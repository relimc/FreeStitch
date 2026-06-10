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
    showOuterBorder: { type: Boolean, default: false }
});

const canvasRef = ref(null);
const containerRef = ref(null);

const renderCanvas = async () => {
    if (props.images.length === 0) {
        const canvas = canvasRef.value;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = 600;
        canvas.height = 400;
        if (props.useTransparent) ctx.clearRect(0, 0, canvas.width, canvas.height);
        else { ctx.fillStyle = props.bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        ctx.fillStyle = '#6b7280';
        ctx.font = '14px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('请从左侧添加图片', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // 加载图片
    let loadedImages = [];
    for (const item of props.images) {
        const img = await loadImage(item.dataURL);
        loadedImages.push({ img, origW: item.width, origH: item.height });
    }
    
    let rows = props.gridRows, cols = props.gridCols;
    if (props.gridLayout === 'horizontal') { rows = 1; cols = props.gridCols; }
    else if (props.gridLayout === 'vertical') { rows = props.gridRows; cols = 1; }
    
    const displayImages = loadedImages.slice(0, rows * cols);
    let cellW = props.cellWidth, cellH = props.cellHeight;
    if (!cellW || cellW <= 0) {
        let maxW = 0; for (const item of displayImages) maxW = Math.max(maxW, item.origW);
        cellW = maxW;
    }
    if (!cellH || cellH <= 0) {
        let maxH = 0; for (const item of displayImages) maxH = Math.max(maxH, item.origH);
        cellH = maxH;
    }
    
    const originalWidth = cols * cellW + (cols - 1) * props.spacing;
    const originalHeight = rows * cellH + (rows - 1) * props.spacing;
    
    // 外边框：上下左右都加
    const borderSize = props.showOuterBorder ? props.spacing : 0;
    const canvasWidth = originalWidth + borderSize * 2;
    const canvasHeight = originalHeight + borderSize * 2;
    
    const canvas = canvasRef.value;
    canvas.width = Math.max(1, Math.ceil(canvasWidth));
    canvas.height = Math.max(1, Math.ceil(canvasHeight));
    const ctx = canvas.getContext('2d');
    
    // 绘制背景（包括外边框区域）
    if (props.useTransparent) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = props.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // 偏移绘制图片内容
    ctx.save();
    ctx.translate(borderSize, borderSize);
    
    for (let i = 0; i < displayImages.length; i++) {
        const row = Math.floor(i / cols), col = i % cols;
        const cellX = col * (cellW + props.spacing);
        const cellY = row * (cellH + props.spacing);
        const { drawW, drawH, offsetX, offsetY } = calculateFit(
            displayImages[i].origW, displayImages[i].origH,
            cellW, cellH,
            props.fillMode
        );
        ctx.save();
        ctx.beginPath();
        ctx.rect(cellX, cellY, cellW, cellH);
        ctx.clip();
        ctx.drawImage(displayImages[i].img, cellX + offsetX, cellY + offsetY, drawW, drawH);
        ctx.restore();
    }
    
    ctx.restore();
};

const exportImage = async (useTransparent) => {
    await renderCanvas();
    return canvasRef.value?.toDataURL('image/png');
};

watch([() => props.images, () => props.spacing, () => props.bgColor, () => props.useTransparent,
        () => props.gridRows, () => props.gridCols, () => props.gridLayout,
        () => props.cellWidth, () => props.cellHeight, () => props.fillMode,
        () => props.maskShape, () => props.cornerRadius, () => props.showOuterBorder], () => {
    nextTick(() => renderCanvas());
}, { deep: true, immediate: true });

defineExpose({ exportImage });
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