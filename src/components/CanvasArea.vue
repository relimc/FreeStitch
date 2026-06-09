<template>
    <div class="canvas-zone">
        <!-- 自由模式 -->
        <div 
            v-if="mode === 'free'" 
            class="free-canvas-container"
            :style="freeCanvasStyle"
            ref="freeCanvasRef"
        >
            <div 
                v-for="img in localImages" 
                :key="img.id"
                class="drag-img-card"
                :style="getCardStyle(img)"
                @mousedown="startDrag($event, img)"
            >
                <img :src="img.dataURL" :style="getImageStyle(img)" draggable="false">
                <div class="delete-icon" @click.stop="handleRemove(img.id)">✖</div>
            </div>
            <div v-if="localImages.length === 0" class="empty-message">
                ✨ 从左侧添加图片，自由拖拽排列
            </div>
        </div>
        
        <!-- 规则模式（横向/纵向/网格/瀑布流） -->
        <div v-else class="rule-canvas-container">
            <canvas ref="ruleCanvasRef" class="preview-canvas"></canvas>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed, nextTick, onUnmounted } from 'vue';

const props = defineProps({
    mode: { type: String, default: 'free' },
    images: { type: Array, default: () => [] },
    spacing: { type: Number, default: 12 },
    bgColor: { type: String, default: '#f8fafc' },
    maxSize: { type: Number, default: 160 },
    useTransparent: { type: Boolean, default: true },
    canvasWidth: { type: Number, default: 800 },
    canvasHeight: { type: Number, default: 600 },
    gridRows: { type: Number, default: 3 },
    gridCols: { type: Number, default: 3 },
    masonryCols: { type: Number, default: 3 },
    // 新增属性
    fixedHeightEnabled: { type: Boolean, default: false },
    fixedHeight: { type: Number, default: 200 },
    fixedWidthEnabled: { type: Boolean, default: false },
    fixedWidth: { type: Number, default: 200 },
    cellWidth: { type: Number, default: 0 },
    cellHeight: { type: Number, default: 0 },
    fillMode: { type: String, default: 'contain' },
    maskShape: { type: String, default: 'none' },
    cornerRadius: { type: Number, default: 20 },
    masonryColumnWidth: { type: Number, default: 360 }
});

const emit = defineEmits(['remove', 'update:images']);

// 本地副本
const localImages = ref([]);
const freeCanvasRef = ref(null);
const ruleCanvasRef = ref(null);
const imagePositions = ref({});

// 拖拽状态
const isDragging = ref(false);
const draggingImg = ref(null);
const dragStartMouseX = ref(0);
const dragStartMouseY = ref(0);
const dragStartCardLeft = ref(0);
const dragStartCardTop = ref(0);

// ========== 辅助函数 ==========
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

const clampAllPositions = () => {
    for (const img of localImages.value) {
        const pos = imagePositions.value[img.id];
        if (!pos) continue;
        const imgStyle = getImageStyle(img);
        const width = parseFloat(imgStyle.width) || 150;
        const height = parseFloat(imgStyle.height) || 150;
        const maxX = Math.max(props.canvasWidth - width, 0);
        const maxY = Math.max(props.canvasHeight - height, 0);
        let newX = pos.x, newY = pos.y;
        if (newX < 0) newX = 0;
        if (newX > maxX) newX = maxX;
        if (newY < 0) newY = 0;
        if (newY > maxY) newY = maxY;
        if (newX !== pos.x || newY !== pos.y) {
            imagePositions.value[img.id] = { x: newX, y: newY };
        }
    }
};

// ========== 数据同步 ==========
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
    clampAllPositions();
}, { immediate: true, deep: true });

watch(localImages, (newVal) => {
    if (JSON.stringify(newVal.map(i => i.id)) !== JSON.stringify(props.images.map(i => i.id))) {
        emit('update:images', newVal);
    }
}, { deep: true });

watch([() => props.canvasWidth, () => props.canvasHeight], () => {
    if (props.mode === 'free') clampAllPositions();
});

// ========== 样式辅助 ==========
const freeCanvasStyle = computed(() => ({
    backgroundColor: props.useTransparent ? 'transparent' : props.bgColor,
    width: `${props.canvasWidth}px`,
    height: `${props.canvasHeight}px`,
    position: 'relative',
    overflow: 'visible'
}));

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
        zIndex: (isDragging.value && draggingImg.value?.id === img.id) ? 1000 : 1,
        transition: 'none'
    };
};

// ========== 拖拽逻辑 ==========
const startDrag = (e, img) => {
    if (e.target.classList?.contains('delete-icon')) return;
    e.preventDefault();
    e.stopPropagation();
    const card = e.target.closest('.drag-img-card');
    if (!card) return;
    draggingImg.value = img;
    isDragging.value = true;
    dragStartMouseX.value = e.clientX;
    dragStartMouseY.value = e.clientY;
    const currentPos = imagePositions.value[img.id] || { x: 20, y: 20 };
    dragStartCardLeft.value = currentPos.x;
    dragStartCardTop.value = currentPos.y;
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', stopDrag);
    document.body.style.cursor = 'grabbing';
    card.style.cursor = 'grabbing';
};

const onDragMove = (e) => {
    if (!isDragging.value || !draggingImg.value) return;
    e.preventDefault();
    const deltaX = e.clientX - dragStartMouseX.value;
    const deltaY = e.clientY - dragStartMouseY.value;
    let newLeft = dragStartCardLeft.value + deltaX;
    let newTop = dragStartCardTop.value + deltaY;
    const imgStyle = getImageStyle(draggingImg.value);
    const cardWidth = parseFloat(imgStyle.width);
    const cardHeight = parseFloat(imgStyle.height);
    const maxX = Math.max(props.canvasWidth - cardWidth, 0);
    const maxY = Math.max(props.canvasHeight - cardHeight, 0);
    newLeft = Math.max(0, Math.min(newLeft, maxX));
    newTop = Math.max(0, Math.min(newTop, maxY));
    imagePositions.value[draggingImg.value.id] = { x: newLeft, y: newTop };
};

const stopDrag = () => {
    if (!isDragging.value) return;
    isDragging.value = false;
    draggingImg.value = null;
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', stopDrag);
    document.body.style.cursor = '';
    if (freeCanvasRef.value) {
        const cards = freeCanvasRef.value.querySelectorAll('.drag-img-card');
        cards.forEach(card => card.style.cursor = 'grab');
    }
};

const handleRemove = (id) => {
    localImages.value = localImages.value.filter(img => img.id !== id);
    delete imagePositions.value[id];
    emit('remove', id);
};

// ========== 加载图片辅助 ==========
const loadImage = (dataURL) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`图片加载失败: ${dataURL.slice(0, 50)}`));
    img.src = dataURL;
});

// ========== 规则模式预览 ==========
const renderRuleCanvas = async () => {
    if (localImages.value.length === 0) {
        const canvas = ruleCanvasRef.value;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = 600;
        canvas.height = 400;
        ctx.fillStyle = props.useTransparent ? 'transparent' : props.bgColor;
        if (!props.useTransparent) ctx.fillRect(0, 0, canvas.width, canvas.height);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#6b7280';
        ctx.font = '14px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('请从左侧添加图片', canvas.width/2, canvas.height/2);
        return;
    }
    const canvas = await exportRuleMode(false, props.useTransparent, true);
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.warn('导出的画布无效');
        return;
    }
    if (canvas && ruleCanvasRef.value) {
        ruleCanvasRef.value.width = canvas.width;
        ruleCanvasRef.value.height = canvas.height;
        const ctx = ruleCanvasRef.value.getContext('2d');
        ctx.drawImage(canvas, 0, 0);
    }
};

// 辅助函数：计算图片在固定容器内的适配尺寸和偏移
function calculateFit(originalW, originalH, containerW, containerH, fillMode) {
    let drawW, drawH, offsetX = 0, offsetY = 0;
    if (fillMode === 'contain') {
        const scale = Math.min(containerW / originalW, containerH / originalH);
        drawW = originalW * scale;
        drawH = originalH * scale;
        offsetX = (containerW - drawW) / 2;
        offsetY = (containerH - drawH) / 2;
    } else { // cover
        const scale = Math.max(containerW / originalW, containerH / originalH);
        drawW = originalW * scale;
        drawH = originalH * scale;
        offsetX = (containerW - drawW) / 2;
        offsetY = (containerH - drawH) / 2;
    }
    return { drawW, drawH, offsetX, offsetY };
}

// ========== 导出核心（支持所有模式，包括新增的横向固定高度和网格单元格尺寸） ==========
const exportRuleMode = async (useOriginalSize, useTransparent, forPreview = false) => {
    const direction = props.mode;
    const gap = props.spacing;
    const bgColor = props.bgColor;
    const maskShape = props.maskShape;
    const cornerRadius = props.cornerRadius;
    
    // 加载原始图片并保留原始尺寸
    let loadedImages = [];
    for (const item of localImages.value) {
        const img = await loadImage(item.dataURL);
        loadedImages.push({
            img,
            origW: item.width,
            origH: item.height
        });
    }
    if (loadedImages.length === 0) return null;
    
    let totalWidth = 0, totalHeight = 0;
    let positions = []; // 存储 { img, x, y, drawW, drawH }
    
    // ========== 横向拼接 ==========
    if (direction === 'horizontal') {
        let scaledImages = [];
        for (const item of loadedImages) {
            let drawW, drawH;
            if (props.fixedHeightEnabled && props.fixedHeight > 0) {
                const scale = props.fixedHeight / item.origH;
                drawW = item.origW * scale;
                drawH = props.fixedHeight;
            } else {
                drawW = item.origW;
                drawH = item.origH;
            }
            scaledImages.push({ img: item.img, drawW, drawH });
        }
        let maxH = 0;
        for (const img of scaledImages) {
            totalWidth += img.drawW;
            maxH = Math.max(maxH, img.drawH);
        }
        totalWidth += gap * (scaledImages.length - 1);
        totalHeight = maxH;
        let curX = 0;
        for (const img of scaledImages) {
            const yOffset = (totalHeight - img.drawH) / 2;
            positions.push({ img: img.img, x: curX, y: yOffset, drawW: img.drawW, drawH: img.drawH });
            curX += img.drawW + gap;
        }
    }
    // ========== 纵向拼接 ==========
    else if (direction === 'vertical') {
        let scaledImages = [];
        for (const item of loadedImages) {
            let drawW, drawH;
            if (props.fixedWidthEnabled && props.fixedWidth > 0) {
                const scale = props.fixedWidth / item.origW;
                drawW = props.fixedWidth;
                drawH = item.origH * scale;
            } else {
                drawW = item.origW;
                drawH = item.origH;
            }
            scaledImages.push({ img: item.img, drawW, drawH });
        }
        let maxW = 0;
        for (const img of scaledImages) {
            totalHeight += img.drawH;
            maxW = Math.max(maxW, img.drawW);
        }
        totalHeight += gap * (scaledImages.length - 1);
        totalWidth = maxW;
        let curY = 0;
        for (const img of scaledImages) {
            const xOffset = (totalWidth - img.drawW) / 2;
            positions.push({ img: img.img, x: xOffset, y: curY, drawW: img.drawW, drawH: img.drawH });
            curY += img.drawH + gap;
        }
    }
    // ========== 网格模式 ==========
    else if (direction === 'grid') {
        const rows = props.gridRows;
        const cols = props.gridCols;
        const totalCells = rows * cols;
        const displayImages = loadedImages.slice(0, totalCells);
        
        let cellW = Number(props.cellWidth);
        let cellH = Number(props.cellHeight);
        if (isNaN(cellW) || cellW <= 0) {
            let maxW = 0;
            for (const item of displayImages) maxW = Math.max(maxW, item.origW);
            cellW = maxW;
        }
        if (isNaN(cellH) || cellH <= 0) {
            let maxH = 0;
            for (const item of displayImages) maxH = Math.max(maxH, item.origH);
            cellH = maxH;
        }
        totalWidth = cols * cellW + (cols - 1) * gap;
        totalHeight = rows * cellH + (rows - 1) * gap;
        
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.ceil(totalWidth));
        canvas.height = Math.max(1, Math.ceil(totalHeight));
        const ctx = canvas.getContext('2d');
        
        if (useTransparent) ctx.clearRect(0, 0, canvas.width, canvas.height);
        else { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        
        // 绘制网格单元格（每个单元格内独立裁剪）
        for (let i = 0; i < displayImages.length; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const cellX = col * (cellW + gap);
            const cellY = row * (cellH + gap);
            const { drawW, drawH, offsetX, offsetY } = calculateFit(
                displayImages[i].origW, displayImages[i].origH,
                cellW, cellH,
                props.fillMode
            );
            ctx.save();
            // 先设置单元格裁剪区域（保证图片不超出格子）
            ctx.beginPath();
            ctx.rect(cellX, cellY, cellW, cellH);
            ctx.clip();
            // 再应用蒙版裁剪（如果启用）
            if (maskShape !== 'none') {
                ctx.save();
                if (maskShape === 'circle') {
                    const imgX = cellX + offsetX;
                    const imgY = cellY + offsetY;
                    const centerX = imgX + drawW / 2;
                    const centerY = imgY + drawH / 2;
                    const radius = Math.min(drawW, drawH) / 2;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.clip();
                } else if (maskShape === 'roundRect') {
                    const r = cornerRadius;
                    const imgX = cellX + offsetX;
                    const imgY = cellY + offsetY;
                    ctx.beginPath();
                    ctx.moveTo(imgX + r, imgY);
                    ctx.lineTo(imgX + drawW - r, imgY);
                    ctx.quadraticCurveTo(imgX + drawW, imgY, imgX + drawW, imgY + r);
                    ctx.lineTo(imgX + drawW, imgY + drawH - r);
                    ctx.quadraticCurveTo(imgX + drawW, imgY + drawH, imgX + drawW - r, imgY + drawH);
                    ctx.lineTo(imgX + r, imgY + drawH);
                    ctx.quadraticCurveTo(imgX, imgY + drawH, imgX, imgY + drawH - r);
                    ctx.lineTo(imgX, imgY + r);
                    ctx.quadraticCurveTo(imgX, imgY, imgX + r, imgY);
                    ctx.closePath();
                    ctx.clip();
                }
            }
            ctx.drawImage(displayImages[i].img, cellX + offsetX, cellY + offsetY, drawW, drawH);
            if (maskShape !== 'none') ctx.restore();
            ctx.restore();
        }
        
        if (forPreview) return canvas;
        return canvas.toDataURL('image/png');
    }
    // ========== 瀑布流模式 ==========
    else if (direction === 'masonry') {
        const cols = props.masonryCols;
        let fixedWidth = props.fixedWidth;
        if (!fixedWidth || isNaN(fixedWidth) || fixedWidth <= 0) fixedWidth = 360;
        const items = [];
        for (const item of loadedImages) {
            const scale = fixedWidth / item.origW;
            const h = item.origH * scale;
            items.push({ img: item.img, w: fixedWidth, h });
        }
        let colHeights = new Array(cols).fill(0);
        for (let item of items) {
            let minCol = colHeights.indexOf(Math.min(...colHeights));
            const x = minCol * (fixedWidth + gap);
            const y = colHeights[minCol];
            positions.push({ img: item.img, x, y, drawW: fixedWidth, drawH: item.h });
            colHeights[minCol] += item.h + gap;
        }
        totalWidth = cols * fixedWidth + (cols - 1) * gap;
        totalHeight = Math.max(...colHeights) - gap;
    }
    
    // ========== 创建画布并绘制（非网格模式） ==========
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(totalWidth));
    canvas.height = Math.max(1, Math.ceil(totalHeight));
    const ctx = canvas.getContext('2d');
    
    if (useTransparent) ctx.clearRect(0, 0, canvas.width, canvas.height);
    else { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    
    // 绘制所有图片（应用蒙版）
    for (const p of positions) {
        if (!p.img || !(p.img instanceof HTMLImageElement)) continue;
        
        if (maskShape !== 'none') {
            ctx.save();
            if (maskShape === 'circle') {
                const centerX = p.x + p.drawW / 2;
                const centerY = p.y + p.drawH / 2;
                const radius = Math.min(p.drawW, p.drawH) / 2;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.clip();
            } else if (maskShape === 'roundRect') {
                const r = cornerRadius;
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
            ctx.drawImage(p.img, p.x, p.y, p.drawW, p.drawH);
            ctx.restore();
        } else {
            ctx.drawImage(p.img, p.x, p.y, p.drawW, p.drawH);
        }
    }
    
    if (forPreview) return canvas;
    return canvas.toDataURL('image/png');
};

// 自由模式导出
const exportFreeMode = async (useTransparent) => {
    const container = freeCanvasRef.value;
    if (!container || localImages.value.length === 0) return null;
    const canvas = document.createElement('canvas');
    canvas.width = props.canvasWidth;
    canvas.height = props.canvasHeight;
    const ctx = canvas.getContext('2d');
    if (useTransparent) ctx.clearRect(0, 0, canvas.width, canvas.height);
    else { ctx.fillStyle = props.bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    for (const img of localImages.value) {
        const pos = imagePositions.value[img.id] || { x: 20, y: 20 };
        const imgStyle = getImageStyle(img);
        const width = parseFloat(imgStyle.width);
        const height = parseFloat(imgStyle.height);
        const imageEl = await loadImage(img.dataURL);
        ctx.drawImage(imageEl, pos.x, pos.y, width, height);
    }
    return canvas.toDataURL('image/png');
};

// 对外导出接口
const exportImage = async (useOriginalSize = false, useTransparent = true) => {
    if (props.mode === 'free') {
        if (useOriginalSize) {
            alert('自由模式下暂不支持“导出原始尺寸”，将按当前显示尺寸导出。如需高清导出，请调大“最大尺寸”滑块或切换到其他模式。');
        }
        return await exportFreeMode(useTransparent);
    } else {
        return await exportRuleMode(useOriginalSize, useTransparent);
    }
};

// 监听模式和参数变化，刷新预览
watch([() => props.mode, () => localImages.value, () => props.spacing, () => props.bgColor, 
        () => props.maxSize, () => props.useTransparent, 
        () => props.gridRows, () => props.gridCols, () => props.masonryCols,
        () => props.fixedHeightEnabled, () => props.fixedHeight,
        () => props.fixedWidthEnabled, () => props.fixedWidth,
        () => props.cellWidth, () => props.cellHeight, () => props.fillMode,
        () => props.maskShape, () => props.cornerRadius],    // 新增这两项
    () => {
        if (props.mode !== 'free') {
            nextTick(() => renderRuleCanvas());
        }
    }, { deep: true, immediate: true });

defineExpose({ exportImage });

onUnmounted(() => {
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', stopDrag);
});
</script>

<style scoped>
/* 样式保持不变（同之前完整版本） */
.canvas-zone {
    flex: 3;
    background: #f8fafc;
    margin: 18px 20px 10px 20px;
    border-radius: 28px;
    overflow: auto;           /* 滚动条出现在这里 */
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    min-height: 0;            /* 允许 flex 子项收缩 */
}
.free-canvas-container {
    position: relative;
    overflow: visible;
    margin: auto;
    box-shadow: 0 0 0 1px #cbd5e1;
    border-radius: 4px;
    background: #f8fafc;
}
.drag-img-card {
    position: absolute;
    background: transparent;
    border: none;
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
    backdrop-filter: blur(2px);
    z-index: 10;
}
.drag-img-card:hover .delete-icon { opacity: 1; }
.delete-icon:hover { background: rgba(220, 38, 38, 1); transform: scale(1.05); }
.rule-canvas-container {
    overflow: auto;
    width: 100%;
    height: 100%;
    text-align: center;  /* 水平居中 inline 或 inline-block 元素，但对 block 无效，需配合 */
}
.preview-canvas {
    display: inline-block; /* 使 text-align 生效 */
    margin: 0 auto;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    background: #ffffff;
}

.empty-message {
    color: #9ca3af;
    text-align: center;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.9rem;
    white-space: nowrap;
}
@media (max-width: 700px) {
    .empty-message { white-space: normal; text-align: center; padding: 20px; }
}
</style>