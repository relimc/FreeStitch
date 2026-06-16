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

const getResolution = () => {
    // 直接返回当前画布的实际尺寸（同步）
    const canvas = canvasRef.value;
    if (canvas && canvas.width > 0 && canvas.height > 0) {
        return { width: canvas.width, height: canvas.height };
    }
    // 降级：返回默认值，调用方会再次尝试
    return { width: 600, height: 400 };
};

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
    
    let loadedImages = [];
    for (const item of props.images) {
        const img = await loadImage(item.dataURL);
        loadedImages.push({ img, origW: item.width, origH: item.height });
    }
    
    let rows = props.gridRows, cols = props.gridCols;
    if (props.gridLayout === 'horizontal') { 
        rows = 1; 
        cols = loadedImages.length;
    }
    else if (props.gridLayout === 'vertical') { 
        cols = 1; 
        rows = loadedImages.length;
    }
    
    const displayImages = loadedImages;
    
    let cellW = props.cellWidth;
    let cellH = props.cellHeight;
    
    if (!cellW || cellW <= 0) {
        let maxW = 0;
        for (const item of displayImages) maxW = Math.max(maxW, item.origW);
        cellW = maxW > 0 ? maxW : 300;
    }
    if (!cellH || cellH <= 0) {
        let maxH = 0;
        for (const item of displayImages) maxH = Math.max(maxH, item.origH);
        cellH = maxH > 0 ? maxH : 185;
    }
    
    const originalWidth = cols * cellW + (cols - 1) * props.spacing;
    const originalHeight = rows * cellH + (rows - 1) * props.spacing;
    
    const borderSize = props.showOuterBorder ? props.spacing : 0;
    const canvasWidth = originalWidth + borderSize * 2;
    const canvasHeight = originalHeight + borderSize * 2;
    
    const canvas = canvasRef.value;
    canvas.width = Math.max(1, Math.ceil(canvasWidth));
    canvas.height = Math.max(1, Math.ceil(canvasHeight));
    const ctx = canvas.getContext('2d');
    
    // ✅ 填充整个画布（包括外边框区域）
    if (props.useTransparent) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = props.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // ✅ 如果启用了外边框且非透明模式，绘制边框颜色（让边框更明显）
    if (props.showOuterBorder && borderSize > 0 && !props.useTransparent) {
        // 外边框已经通过 fillRect 填充了 bgColor，这里无需额外绘制
        // 但如果希望边框有更明显的视觉效果，可以绘制一条内边框线
        // 但当前 bgColor 填充已经覆盖了外边框区域，所以直接使用即可
        // 补充：为了让边框更清晰，可以在内部内容周围绘制一条细线
        ctx.save();
        ctx.strokeStyle = props.bgColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(borderSize, borderSize, originalWidth, originalHeight);
        ctx.restore();
    }
    
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
        
        if (props.maskShape !== 'none') {
            ctx.save();
            if (props.maskShape === 'circle') {
                const centerX = cellX + cellW / 2;
                const centerY = cellY + cellH / 2;
                const radius = Math.min(cellW, cellH) / 2;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.clip();
            } else if (props.maskShape === 'roundRect') {
                const r = Math.min(props.cornerRadius, Math.min(cellW, cellH) / 2);
                ctx.beginPath();
                ctx.moveTo(cellX + r, cellY);
                ctx.lineTo(cellX + cellW - r, cellY);
                ctx.quadraticCurveTo(cellX + cellW, cellY, cellX + cellW, cellY + r);
                ctx.lineTo(cellX + cellW, cellY + cellH - r);
                ctx.quadraticCurveTo(cellX + cellW, cellY + cellH, cellX + cellW - r, cellY + cellH);
                ctx.lineTo(cellX + r, cellY + cellH);
                ctx.quadraticCurveTo(cellX, cellY + cellH, cellX, cellY + cellH - r);
                ctx.lineTo(cellX, cellY + r);
                ctx.quadraticCurveTo(cellX, cellY, cellX + r, cellY);
                ctx.closePath();
                ctx.clip();
            }
        }
        
        ctx.drawImage(displayImages[i].img, cellX + offsetX, cellY + offsetY, drawW, drawH);
        
        if (props.maskShape !== 'none') {
            ctx.restore();
        }
        ctx.restore();
    }
    
    ctx.restore();

    emit('render-complete');
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