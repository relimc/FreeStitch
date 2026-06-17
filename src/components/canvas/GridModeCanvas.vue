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
    outerBorderSize: { type: Number, default: 0 }   // 仅保留外边框尺寸
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

const renderCanvas = async () => {
    // 调试日志（可删除）
    console.log('outerBorderSize:', props.outerBorderSize, 'useTransparent:', props.useTransparent);
    const canvas = canvasRef.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // 1. 确定行列数
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

    // 4. 计算画布尺寸（外边框直接使用 outerBorderSize，无需开关）
    const gap = props.spacing;
    const borderSize = Math.max(0, props.outerBorderSize); // 直接使用，0 表示无边框
    const contentWidth = cols * cellW + (cols - 1) * gap;
    const contentHeight = rows * cellH + (rows - 1) * gap;
    const canvasWidth = contentWidth + borderSize * 2;
    const canvasHeight = contentHeight + borderSize * 2;

    canvas.width = Math.max(1, Math.ceil(canvasWidth));
    canvas.height = Math.max(1, Math.ceil(canvasHeight));

    // 清空/填充背景（整个画布）
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

        if (!props.useTransparent) {
            ctx.fillStyle = '#f1f5f9';
            ctx.fillRect(x, y, cellW, cellH);
        }

        const imgData = (hasImages && i < loadedImages.length) ? loadedImages[i] : null;

        if (imgData) {
            const { drawW, drawH, offsetX, offsetY } = calculateFit(
                imgData.origW, imgData.origH,
                cellW, cellH,
                props.fillMode
            );

            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, cellW, cellH);
            ctx.clip();

            if (props.maskShape !== 'none') {
                ctx.save();
                if (props.maskShape === 'circle') {
                    const cx = x + cellW / 2;
                    const cy = y + cellH / 2;
                    const r = Math.min(cellW, cellH) / 2;
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.clip();
                } else if (props.maskShape === 'roundRect') {
                    const radius = Math.min(props.cornerRadius, Math.min(cellW, cellH) / 2);
                    ctx.beginPath();
                    ctx.moveTo(x + radius, y);
                    ctx.lineTo(x + cellW - radius, y);
                    ctx.quadraticCurveTo(x + cellW, y, x + cellW, y + radius);
                    ctx.lineTo(x + cellW, y + cellH - radius);
                    ctx.quadraticCurveTo(x + cellW, y + cellH, x + cellW - radius, y + cellH);
                    ctx.lineTo(x + radius, y + cellH);
                    ctx.quadraticCurveTo(x, y + cellH, x, y + cellH - radius);
                    ctx.lineTo(x, y + radius);
                    ctx.quadraticCurveTo(x, y, x + radius, y);
                    ctx.closePath();
                    ctx.clip();
                }
            }

            ctx.drawImage(imgData.img, x + offsetX, y + offsetY, drawW, drawH);

            if (props.maskShape !== 'none') ctx.restore();
            ctx.restore();
        } else {
            ctx.save();
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
            ctx.restore();
        }
    }

    ctx.restore();

    // ✅ 绘制外边框线（只要 borderSize > 0 就绘制，不再依赖任何开关）
    if (borderSize > 0) {
        ctx.save();
        ctx.strokeStyle = '#666666';   // 深灰色边框，清晰可见
        ctx.lineWidth = 2;
        // 边框线绘制在内容区域外围（即从 borderSize 开始，大小为 contentWidth/contentHeight）
        ctx.strokeRect(borderSize, borderSize, contentWidth, contentHeight);
        ctx.restore();
    }

    emit('render-complete');
};

const exportImage = async (useTransparent) => {
    await renderCanvas();
    return canvasRef.value?.toDataURL('image/png');
};

// 监听参数变化（移除了 showOuterBorder）
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