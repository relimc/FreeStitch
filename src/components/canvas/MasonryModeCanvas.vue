<template>
    <div class="masonry-canvas-container" ref="containerRef">
        <canvas ref="canvasRef" class="preview-canvas"></canvas>
    </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { loadImage } from './utils/canvasHelpers.js';

const props = defineProps({
    images: { type: Array, default: () => [] },
    spacing: { type: Number, default: 12 },
    bgColor: { type: String, default: '#ffffff' },
    useTransparent: { type: Boolean, default: true },
    masonryCols: { type: Number, default: 3 },
    masonryColumnWidth: { type: Number, default: 360 },
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
    
    const cols = props.masonryCols;
    const fixedWidth = props.masonryColumnWidth;
    const items = [];
    for (const item of loadedImages) {
        const scale = fixedWidth / item.origW;
        items.push({ img: item.img, w: fixedWidth, h: item.origH * scale });
    }
    
    let colHeights = new Array(cols).fill(0);
    const positions = [];
    for (let item of items) {
        let minCol = colHeights.indexOf(Math.min(...colHeights));
        const x = minCol * (fixedWidth + props.spacing);
        const y = colHeights[minCol];
        positions.push({ img: item.img, x, y, drawW: fixedWidth, drawH: item.h });
        colHeights[minCol] += item.h + props.spacing;
    }
    
    const originalWidth = cols * fixedWidth + (cols - 1) * props.spacing;
    const originalHeight = Math.max(...colHeights) - props.spacing;
    
    // 外边框：上下左右都加
    const borderSize = props.showOuterBorder ? props.spacing : 0;
    const canvasWidth = originalWidth + borderSize * 2;
    const canvasHeight = originalHeight + borderSize * 2;
    
    const canvas = canvasRef.value;
    canvas.width = Math.max(1, Math.ceil(canvasWidth));
    canvas.height = Math.max(1, Math.ceil(canvasHeight));
    const ctx = canvas.getContext('2d');
    
    if (props.useTransparent) ctx.clearRect(0, 0, canvas.width, canvas.height);
    else { ctx.fillStyle = props.bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    
    ctx.save();
    ctx.translate(borderSize, borderSize);
    
    for (const p of positions) {
        ctx.drawImage(p.img, p.x, p.y, p.drawW, p.drawH);
    }
    
    ctx.restore();
};

const exportImage = async (useTransparent) => {
    await renderCanvas();
    return canvasRef.value?.toDataURL('image/png');
};

watch([() => props.images, () => props.spacing, () => props.bgColor, () => props.useTransparent,
        () => props.masonryCols, () => props.masonryColumnWidth, () => props.showOuterBorder], () => {
    nextTick(() => renderCanvas());
}, { deep: true, immediate: true });

defineExpose({ exportImage });
</script>

<style scoped>
.masonry-canvas-container {
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