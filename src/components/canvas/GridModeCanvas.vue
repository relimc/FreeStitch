<template>
    <div class="grid-canvas-container" ref="containerRef">
        <canvas ref="canvasRef" class="preview-canvas"></canvas>
    </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { loadImage, calculateFit } from './utils/canvasHelpers.js';

const props = defineProps({
    images: { type: Array, default: () => [] },
    spacing: { type: Number, default: 12 },
    bgColor: { type: String, default: '#ffffff' },
    useTransparent: { type: Boolean, default: true },
    gridRows: { type: Number, default: 3 },
    gridCols: { type: Number, default: 3 },
    gridLayout: { type: String, default: 'grid' },
    cellWidth: { type: Number, default: 0 },
    cellHeight: { type: Number, default: 0 },
    fillMode: { type: String, default: 'cover' },
    maskShape: { type: String, default: 'none' },
    cornerRadius: { type: Number, default: 20 },
    outerBorderSize: { type: Number, default: 0 }
});

const canvasRef = ref(null);
const containerRef = ref(null);

const getResolution = () => {
    const canvas = canvasRef.value;
    if (canvas && canvas.width > 0 && canvas.height > 0) {
        return { width: canvas.width, height: canvas.height };
    }
    return { width: 600, height: 400 };
};

// 辅助：绘制蒙版路径
const drawMaskPath = (ctx, x, y, w, h) => {
    if (props.maskShape === 'circle') {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const r = Math.min(w, h) / 2;
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
    } else if (props.maskShape === 'roundRect') {
        const radius = Math.min(props.cornerRadius, Math.min(w, h) / 2);
        if (radius <= 0) {
            ctx.rect(x, y, w, h);
        } else {
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + w - radius, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
            ctx.lineTo(x + w, y + h - radius);
            ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
            ctx.lineTo(x + radius, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
        }
    } else {
        // 无蒙版时使用矩形
        ctx.rect(x, y, w, h);
    }
    ctx.closePath();
};

const renderCanvas = async () => {
    console.log('🔄 Grid 渲染中... maskShape:', props.maskShape, 'cornerRadius:', props.cornerRadius);
    const canvas = canvasRef.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // 1. 行列数
    let rows = props.gridRows, cols = props.gridCols;
    if (props.gridLayout === 'horizontal') { rows = 1; cols = Math.max(props.gridCols, 1); }
    else if (props.gridLayout === 'vertical') { cols = 1; rows = Math.max(props.gridRows, 1); }

    // 2. 单元格尺寸
    let cellW = props.cellWidth;
    let cellH = props.cellHeight;
    if (!cellW || cellW <= 0) cellW = 200;
    if (!cellH || cellH <= 0) cellH = 200;

    // 3. 加载图片
    let loadedImages = [];
    let hasImages = props.images && props.images.length > 0;
    if (hasImages) {
        for (const item of props.images) {
            const img = await loadImage(item.dataURL);
            loadedImages.push({ img, origW: item.width, origH: item.height });
        }
        if (!props.cellWidth || props.cellWidth <= 0) {
            let maxW = 0;
            for (const item of loadedImages) maxW = Math.max(maxW, item.origW);
            cellW = maxW > 0 ? maxW : 200;
        }
        if (!props.cellHeight || props.cellHeight <= 0) {
            let maxH = 0;
            for (const item of loadedImages) maxH = Math.max(maxH, item.origH);
            cellH = maxH > 0 ? maxH : 200;
        }
        if (props.gridLayout === 'horizontal') {
            rows = 1;
            cols = loadedImages.length;
        } else if (props.gridLayout === 'vertical') {
            cols = 1;
            rows = loadedImages.length;
        }
    }

    // 4. 画布尺寸
    const gap = props.spacing;
    const borderSize = Math.max(0, props.outerBorderSize);
    const contentWidth = cols * cellW + (cols - 1) * gap;
    const contentHeight = rows * cellH + (rows - 1) * gap;
    const canvasWidth = contentWidth + borderSize * 2;
    const canvasHeight = contentHeight + borderSize * 2;

    canvas.width = Math.max(1, Math.ceil(canvasWidth));
    canvas.height = Math.max(1, Math.ceil(canvasHeight));

    // 清空/填充背景（整个画布，包括外边框区域）
    if (props.useTransparent) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = props.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    ctx.translate(borderSize, borderSize);

    // 5. 绘制网格内容
    const totalCells = rows * cols;
    for (let i = 0; i < totalCells; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = col * (cellW + gap);
        const y = row * (cellH + gap);

        const imgData = (hasImages && i < loadedImages.length) ? loadedImages[i] : null;

        ctx.save();

        // 第一步：应用蒙版裁剪（如果有），否则矩形裁剪
        ctx.beginPath();
        drawMaskPath(ctx, x, y, cellW, cellH);
        ctx.clip();

        // 第二步：绘制单元格背景（只在非透明模式下）
        if (!props.useTransparent) {
            ctx.fillStyle = '#f1f5f9';
            ctx.fillRect(x, y, cellW, cellH);
        }

        // 第三步：绘制图片或空单元格占位符
        if (imgData) {
            const { drawW, drawH, offsetX, offsetY } = calculateFit(
                imgData.origW, imgData.origH,
                cellW, cellH,
                props.fillMode
            );
            ctx.drawImage(imgData.img, x + offsetX, y + offsetY, drawW, drawH);
        } else {
            // 空单元格：虚线框 + 加号（现在被蒙版裁剪）
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(x, y, cellW, cellH);
            ctx.setLineDash([]);
            ctx.fillStyle = '#94a3b8';
            ctx.font = `${Math.min(cellW, cellH) * 0.3}px "PingFang SC", system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('+', x + cellW / 2, y + cellH / 2);
        }

        ctx.restore();
    }

    ctx.restore();

    // 外边框：不绘制额外线条，只依赖背景色填充（已覆盖）
    emit('render-complete');
};

const exportImage = async (useTransparent) => {
    await renderCanvas();
    return canvasRef.value?.toDataURL('image/png');
};

// 监听
watch([() => props.images, () => props.spacing, () => props.bgColor, () => props.useTransparent,
        () => props.gridRows, () => props.gridCols, () => props.gridLayout,
        () => props.cellWidth, () => props.cellHeight, () => props.fillMode,
        () => props.maskShape, () => props.cornerRadius, () => props.outerBorderSize], () => {
    nextTick(() => renderCanvas());
}, { deep: true, immediate: true });

defineExpose({ exportImage, getResolution });
const emit = defineEmits(['update:images', 'render-complete']);
</script>

<style scoped>
.grid-canvas-container {
    width: 100%;
    height: 100%;
    overflow: auto;
    text-align: center;
}
.preview-canvas {
    display: inline-block;
    margin: 0 auto;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    background: #ffffff;
}
</style>