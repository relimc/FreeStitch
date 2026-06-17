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
    outerBorderSize: { type: Number, default: 0 }   // 仅保留外边框尺寸，移除 showOuterBorder
});

const canvasRef = ref(null);
const containerRef = ref(null);

const renderCanvas = async () => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const hasImages = props.images && props.images.length > 0;
    if (!hasImages) {
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

    const contentWidth = cols * fixedWidth + (cols - 1) * props.spacing;
    const contentHeight = Math.max(...colHeights) - props.spacing;
    // ✅ 直接使用 outerBorderSize，不再依赖 showOuterBorder
    const borderSize = Math.max(0, props.outerBorderSize);
    const canvasWidth = contentWidth + borderSize * 2;
    const canvasHeight = contentHeight + borderSize * 2;

    canvas.width = Math.max(1, Math.ceil(canvasWidth));
    canvas.height = Math.max(1, Math.ceil(canvasHeight));

    // 清空/填充背景
    if (props.useTransparent) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = props.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    ctx.translate(borderSize, borderSize);

    // 绘制每张图片
    for (const p of positions) {
        ctx.save();
        if (props.maskShape !== 'none') {
            if (props.maskShape === 'circle') {
                const cx = p.x + p.drawW / 2;
                const cy = p.y + p.drawH / 2;
                const r = Math.min(p.drawW, p.drawH) / 2;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.clip();
            } else if (props.maskShape === 'roundRect') {
                const r = Math.min(props.cornerRadius, Math.min(p.drawW, p.drawH) / 2);
                ctx.beginPath();
                ctx.moveTo(p.x + r, p.y);
                ctx.lineTo(p.x + p.drawW - r, p.y);
                ctx.quadraticCurveTo(p.x + p.drawW, p.y, p.x + p.drawW, p.y + r);
                ctx.lineTo(p.x + p.drawW, p.y + p.drawH - r);
                ctx.quadraticCurveTo(p.x + p.drawW, p.y + p.drawH, p.x + p.drawW - r, p.y + p.drawH);
                ctx.lineTo(p.x + r, p.y + p.drawH);
                ctx.quadraticCurveTo(p.x, p.y + p.drawH, p.x, p.y + p.drawH - r);
                ctx.lineTo(p.x, p.y + r);
                ctx.quadraticCurveTo(p.x, p.y, p.x + r, p.y);
                ctx.closePath();
                ctx.clip();
            }
        }
        ctx.drawImage(p.img, p.x, p.y, p.drawW, p.drawH);
        ctx.restore();
    }

    ctx.restore();

    // ✅ 绘制外边框线（只要 borderSize > 0 就绘制，不再依赖任何开关）
    if (borderSize > 0) {
        ctx.save();
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        ctx.strokeRect(borderSize, borderSize, contentWidth, contentHeight);
        ctx.restore();
    }
};

const exportImage = async (useTransparent) => {
    await renderCanvas();
    return canvasRef.value?.toDataURL('image/png');
};

// 获取分辨率（同步计算）
const getResolution = () => {
    if (props.images.length === 0) {
        return { width: 600, height: 400 };
    }
    
    const cols = props.masonryCols;
    const fixedWidth = props.masonryColumnWidth;
    let colHeights = new Array(cols).fill(0);
    for (const item of props.images) {
        const scale = fixedWidth / item.width;
        const h = item.height * scale;
        let minCol = colHeights.indexOf(Math.min(...colHeights));
        colHeights[minCol] += h + props.spacing;
    }
    
    const contentWidth = cols * fixedWidth + (cols - 1) * props.spacing;
    const contentHeight = Math.max(...colHeights) - props.spacing;
    // ✅ 直接使用 outerBorderSize，移除 showOuterBorder 判断
    const borderSize = Math.max(0, props.outerBorderSize);
    return {
        width: contentWidth + borderSize * 2,
        height: contentHeight + borderSize * 2
    };
};

// 监听参数变化（移除 showOuterBorder）
watch([() => props.images, () => props.spacing, () => props.bgColor, () => props.useTransparent,
        () => props.masonryCols, () => props.masonryColumnWidth, () => props.outerBorderSize,
        () => props.maskShape, () => props.cornerRadius], () => {
    nextTick(() => renderCanvas());
}, { deep: true, immediate: true });

defineExpose({ exportImage, getResolution });
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