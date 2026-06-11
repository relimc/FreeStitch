<template>
    <div class="free-canvas-container" :style="freeCanvasStyle" ref="containerRef">
        <div v-for="img in localImages" :key="img.id" 
            class="drag-img-card" 
            :class="{ 'has-border': showOuterBorder }"
            :style="getCardStyle(img)" 
            @mousedown="startDrag($event, img)">
            <img :src="img.dataURL" :style="getImageStyle(img)" draggable="false">
            <div class="delete-icon" @click.stop="handleRemove(img.id)">✖</div>
        </div>
        <div v-if="localImages.length === 0" class="empty-message">
            ✨ 从左侧添加图片，自由拖拽排列
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed, inject, onUnmounted } from 'vue';
import { useCanvasDrag } from './composables/useCanvasDrag.js';
import { loadImage } from './utils/canvasHelpers.js';

const props = defineProps({
    images: { type: Array, default: () => [] },
    canvasWidth: { type: Number, default: 800 },
    canvasHeight: { type: Number, default: 600 },
    bgColor: { type: String, default: '#ffffff' },
    useTransparent: { type: Boolean, default: true },
    spacing: { type: Number, default: 12 },
    maxSize: { type: Number, default: 160 },
    showOuterBorder: { type: Boolean, default: false }
});

const emit = defineEmits(['remove', 'update:images']);

const localImages = ref([]);
const containerRef = ref(null);

const getImageStyle = (img) => {
    if (!img) return { width: '150px', height: 'auto' };
    const maxEdge = Math.max(img.width, img.height);
    const scale = maxEdge > props.maxSize ? props.maxSize / maxEdge : 1;
    return {
        width: `${img.width * scale}px`,
        height: `${img.height * scale}px`,
        objectFit: 'contain'
    };
};

const canvasWidthRef = computed(() => props.canvasWidth);
const canvasHeightRef = computed(() => props.canvasHeight);

const { imagePositions, startDrag, clampAllPositions } = useCanvasDrag(canvasWidthRef, canvasHeightRef, getImageStyle);

const freeCanvasStyle = computed(() => {
    // 确定边框颜色：透明模式下边框透明，否则使用背景色
    let borderColor = 'transparent';
    if (props.showOuterBorder && !props.useTransparent) {
        borderColor = props.bgColor;
    } else if (props.showOuterBorder && props.useTransparent) {
        borderColor = 'transparent';
    }
    
    return {
        backgroundColor: props.useTransparent ? 'transparent' : props.bgColor,
        width: `${props.canvasWidth}px`,
        height: `${props.canvasHeight}px`,
        position: 'relative',
        overflow: 'visible',
        margin: 'auto',
        boxShadow: props.showOuterBorder ? `0 0 0 ${props.spacing}px ${borderColor}` : '0 0 0 2px #cbd5e1',
        transition: 'box-shadow 0.2s ease'
    };
});

const getCardStyle = (img) => {
    const pos = imagePositions.value[img.id] || { x: 20, y: 20 };
    const imgStyle = getImageStyle(img);
    const width = parseFloat(imgStyle.width) || 150;
    return {
        position: 'absolute',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: `${width}px`,
        cursor: 'grab',
        zIndex: 1,
        transition: 'none'
    };
};

const getResolution = () => {
    // 自由模式的分辨率就是画布设置的宽高加上外边框
    const borderSize = props.showOuterBorder ? props.spacing : 0;
    return {
        width: props.canvasWidth + borderSize * 2,
        height: props.canvasHeight + borderSize * 2
    };
};


watch(() => props.images, (newImages) => {
    localImages.value = newImages.map(img => ({ ...img }));
    newImages.forEach((img, index) => {
        if (!imagePositions.value[img.id]) {
            const cols = 3;
            const col = index % cols;
            const row = Math.floor(index / cols);
            imagePositions.value[img.id] = { x: col * 220 + 20, y: row * 220 + 20 };
        }
    });
    const currentIds = new Set(newImages.map(i => i.id));
    Object.keys(imagePositions.value).forEach(id => {
        if (!currentIds.has(parseInt(id))) delete imagePositions.value[id];
    });
    clampAllPositions(localImages.value, props.canvasWidth, props.canvasHeight, getImageStyle);
}, { immediate: true, deep: true });

watch(localImages, (newVal) => {
    if (JSON.stringify(newVal.map(i => i.id)) !== JSON.stringify(props.images.map(i => i.id))) {
        emit('update:images', newVal);
    }
}, { deep: true });

watch([() => props.canvasWidth, () => props.canvasHeight], () => {
    clampAllPositions(localImages.value, props.canvasWidth, props.canvasHeight, getImageStyle);
});

const handleRemove = (id) => {
    localImages.value = localImages.value.filter(img => img.id !== id);
    delete imagePositions.value[id];
    emit('remove', id);
};

const exportImage = async (useTransparent) => {
    const container = containerRef.value;
    if (!container || localImages.value.length === 0) return null;
    
    const borderSize = props.showOuterBorder ? props.spacing : 0;
    const totalWidth = props.canvasWidth + borderSize * 2;
    const totalHeight = props.canvasHeight + borderSize * 2;
    
    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');
    
    if (useTransparent) ctx.clearRect(0, 0, canvas.width, canvas.height);
    else { ctx.fillStyle = props.bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    
    ctx.save();
    ctx.translate(borderSize, borderSize);
    
    for (const img of localImages.value) {
        const pos = imagePositions.value[img.id] || { x: 20, y: 20 };
        const imgStyle = getImageStyle(img);
        const width = parseFloat(imgStyle.width);
        const height = parseFloat(imgStyle.height);
        const imageEl = await loadImage(img.dataURL);
        ctx.drawImage(imageEl, pos.x, pos.y, width, height);
    }
    
    ctx.restore();
    return canvas.toDataURL('image/png');
};

defineExpose({ exportImage, getResolution });

onUnmounted(() => {
    document.removeEventListener('mousemove', useCanvasDrag.onDragMove);
    document.removeEventListener('mouseup', useCanvasDrag.stopDrag);
});
</script>

<style scoped>
.free-canvas-container {
    position: relative;
    overflow: visible;
}
.drag-img-card {
    position: absolute;
    background: transparent;
    cursor: grab;
    user-select: none;
    padding: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.2s;
}
.drag-img-card:active { cursor: grabbing; }
.drag-img-card:hover { box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15); }
.drag-img-card img {
    display: block;
    background: #f1f5f9;
    pointer-events: none;
    width: 100%;
    height: auto;
}
.delete-icon {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 26px;
    height: 26px;
    background: rgba(220, 38, 38, 0.85);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
}
.drag-img-card:hover .delete-icon { opacity: 1; }
.delete-icon:hover { background: rgba(220, 38, 38, 1); transform: scale(1.05); }
.empty-message {
    color: #9ca3af;
    text-align: center;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}
</style>