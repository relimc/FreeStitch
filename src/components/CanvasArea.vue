<template>
    <div class="canvas-zone">
        <!-- 自由模式 -->
        <div v-if="mode === 'free'" class="free-canvas-container" :style="freeCanvasStyle" ref="freeCanvasRef">
            <div v-for="img in localImages" :key="img.id" class="drag-img-card" :style="getCardStyle(img)" @mousedown="startDrag($event, img)">
                <img :src="img.dataURL" :style="getImageStyle(img)" draggable="false">
                <div class="delete-icon" @click.stop="handleRemove(img.id)">✖</div>
            </div>
            <div v-if="localImages.length === 0" class="empty-message">
                ✨ 从左侧添加图片，自由拖拽排列<br>
                <span style="color: #d97706;">⚠️ 刷新页面将清空所有数据</span>
            </div>
        </div>

        <!-- 预设模式 -->
        <div v-else-if="mode === 'preset'" class="preset-canvas" :style="presetCanvasStyle">
            <!-- 图片拼接模板（九宫格等） -->
            <div v-if="!isPosterTemplate" class="preset-grid" :style="presetGridStyle">
                <div v-for="(cell, idx) in presetCells" :key="idx" class="preset-cell" :style="getPresetCellStyle(cell)"
                    @click="handlePresetCellClick(idx)" @dragover.prevent @drop="handlePresetCellDrop($event, idx)">
                    <img v-if="cell.imageData" :src="cell.imageData" :style="getPresetCellImageStyle(cell)">
                    <div v-else class="preset-cell-placeholder">
                        <span>+</span>
                        <span class="placeholder-text">点击添加</span>
                    </div>
                    <div v-if="cell.imageData" class="preset-cell-remove" @click.stop="removePresetCellImage(idx)">✖</div>
                </div>
            </div>

            <!-- 海报模板 -->
            <div v-else class="poster-canvas" :style="posterCanvasStyle">
                <div class="poster-content">
                    <div v-if="posterLayout === 'simple'" class="poster-text">{{ posterText }}</div>
                    <div v-else-if="posterLayout === 'withDate'" class="poster-with-date">
                        <div class="poster-text">{{ posterText }}</div>
                        <div class="poster-date">{{ formattedDate }}</div>
                    </div>
                    <div v-else-if="posterLayout === 'titleDate'" class="poster-title-date">
                        <div class="poster-title">{{ posterText }}</div>
                        <div class="poster-date">{{ formattedDate }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 规则模式（网格/瀑布流） -->
        <div v-else class="rule-canvas-container">
            <canvas ref="ruleCanvasRef" class="preview-canvas"></canvas>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed, nextTick, onUnmounted, inject } from 'vue';

const props = defineProps({
    mode: { type: String, default: 'free' },
    images: { type: Array, default: () => [] },
    spacing: { type: Number, default: 12 },
    bgColor: { type: String, default: '#ffffff' },
    useTransparent: { type: Boolean, default: true },
    canvasWidth: { type: Number, default: 800 },
    canvasHeight: { type: Number, default: 600 },
    gridRows: { type: Number, default: 3 },
    gridCols: { type: Number, default: 3 },
    gridLayout: { type: String, default: 'grid' },
    masonryCols: { type: Number, default: 3 },
    masonryColumnWidth: { type: Number, default: 360 },
    cellWidth: { type: Number, default: 0 },
    cellHeight: { type: Number, default: 0 },
    fillMode: { type: String, default: 'cover' },
    maskShape: { type: String, default: 'none' },
    cornerRadius: { type: Number, default: 20 },
    presetTemplateId: { type: String, default: 'grid-3x3' },
    posterText: { type: String, default: '美好时光' },
    posterDateFormat: { type: String, default: 'YYYY-MM-DD' },
    posterTextPosition: { type: String, default: 'bottom-center' },
    posterTextColor: { type: String, default: '#ffffff' },
    posterFontSize: { type: Number, default: 32 }
});

const emit = defineEmits(['remove', 'update:images', 'update:presetCells']);

// 注入图库数据
const galleryImages = inject('galleryImages', ref([]));

// 本地数据
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

// 预设模式数据
const presetCells = ref([]);
const presetTemplateConfig = ref(null);

// 预设模板定义
const presetTemplates = [
    { id: 'grid-3x3', name: '九宫格', rows: 3, cols: 3, type: 'grid' },
    { id: 'grid-2x2', name: '四宫格', rows: 2, cols: 2, type: 'grid' },
    { id: 'grid-1x2', name: '横向双拼', rows: 1, cols: 2, type: 'grid' },
    { id: 'grid-2x1', name: '纵向双拼', rows: 2, cols: 1, type: 'grid' }
];

const posterTemplates = [
    { id: 'poster-simple', name: '纯文字海报', type: 'poster', layout: 'simple' },
    { id: 'poster-with-date', name: '文字+日期', type: 'poster', layout: 'withDate' },
    { id: 'poster-title-date', name: '标题+日期', type: 'poster', layout: 'titleDate' }
];

// 判断是否为海报模板
const isPosterTemplate = computed(() => props.presetTemplateId?.startsWith('poster'));

// 获取海报布局类型
const posterLayout = computed(() => {
    const template = posterTemplates.find(t => t.id === props.presetTemplateId);
    return template?.layout || 'simple';
});

// 格式化日期
const formattedDate = computed(() => {
    if (props.posterDateFormat === 'none') return '';
    const now = new Date();
    if (props.posterDateFormat === 'YYYY-MM-DD') return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (props.posterDateFormat === 'YYYY/MM/DD') return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    if (props.posterDateFormat === 'DD/MM/YYYY') return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    if (props.posterDateFormat === 'MM/DD/YYYY') return `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;
    return '';
});

// 预设模式样式
const presetCanvasStyle = computed(() => ({
    width: '100%',
    height: '100%',
    minHeight: '400px',
    backgroundColor: props.useTransparent ? 'transparent' : props.bgColor,
    padding: '20px'
}));

const presetGridStyle = computed(() => {
    const config = presetTemplateConfig.value;
    if (!config || config.type === 'poster') return {};
    return {
        display: 'grid',
        gridTemplateRows: `repeat(${config.rows || 3}, 1fr)`,
        gridTemplateColumns: `repeat(${config.cols || 3}, 1fr)`,
        gap: `${props.spacing}px`,
        width: '100%',
        height: '100%'
    };
});

const posterCanvasStyle = computed(() => ({
    width: '100%',
    height: '100%',
    minHeight: '400px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px'
}));

const getPresetCellStyle = () => ({
    position: 'relative',
    backgroundColor: '#f1f5f9',
    border: '2px dashed #cbd5e1',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
    aspectRatio: '1 / 1'
});

const getPresetCellImageStyle = () => {
    if (props.fillMode === 'cover') {
        return { width: '100%', height: '100%', objectFit: 'cover' };
    } else {
        return { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' };
    }
};

// 自由模式辅助函数
const getImageStyle = (img) => {
    if (!img) return { width: '150px', height: 'auto' };
    const maxEdge = Math.max(img.width, img.height);
    const scale = maxEdge > 160 ? 160 / maxEdge : 1;
    return {
        width: `${img.width * scale}px`,
        height: `${img.height * scale}px`,
        objectFit: 'contain'
    };
};

const freeCanvasStyle = computed(() => ({
    backgroundColor: props.useTransparent ? 'transparent' : props.bgColor,
    width: `${props.canvasWidth}px`,
    height: `${props.canvasHeight}px`,
    position: 'relative',
    overflow: 'visible',
    margin: 'auto',
    boxShadow: '0 0 0 2px #cbd5e1'
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

// 边界限制
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

// 拖拽逻辑
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
};

// 数据同步
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

// 预设模式初始化
const initPresetTemplate = (templateId) => {
    const allTemplates = [...presetTemplates, ...posterTemplates];
    const template = allTemplates.find(t => t.id === templateId);
    if (!template) return;
    presetTemplateConfig.value = template;
    
    if (template.type === 'poster') {
        presetCells.value = [];
    } else if (template.rows && template.cols) {
        const cells = [];
        for (let i = 0; i < template.rows * template.cols; i++) {
            cells.push({ imageId: null, imageData: null, row: Math.floor(i / template.cols), col: i % template.cols });
        }
        presetCells.value = cells;
    }
    emit('update:presetCells', presetCells.value);
};

watch(() => props.presetTemplateId, (newId) => {
    if (newId) initPresetTemplate(newId);
}, { immediate: true });

// 预设模式交互
const handlePresetCellClick = (idx) => {
    if (!galleryImages.value || galleryImages.value.length === 0) {
        alert('请先在左侧导入图片');
        return;
    }
    const img = galleryImages.value[0]; // 简单起见取第一张，实际可扩展
    presetCells.value[idx] = { ...presetCells.value[idx], imageId: img.id, imageData: img.dataURL };
    emit('update:presetCells', presetCells.value);
};

const handlePresetCellDrop = async (e, idx) => {
    e.preventDefault();
    const imageId = e.dataTransfer.getData('text/plain');
    if (imageId && galleryImages.value) {
        const imgData = galleryImages.value.find(i => i.id == imageId);
        if (imgData) {
            presetCells.value[idx] = { ...presetCells.value[idx], imageId: imgData.id, imageData: imgData.dataURL };
            emit('update:presetCells', presetCells.value);
        }
    }
};

const removePresetCellImage = (idx) => {
    presetCells.value[idx] = { ...presetCells.value[idx], imageId: null, imageData: null };
    emit('update:presetCells', presetCells.value);
};

const handleRemove = (id) => {
    localImages.value = localImages.value.filter(img => img.id !== id);
    delete imagePositions.value[id];
    emit('remove', id);
};

// 加载图片
const loadImage = (dataURL) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataURL;
});

// 规则模式渲染（网格/瀑布流）
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
        ctx.fillText('请从左侧添加图片', canvas.width / 2, canvas.height / 2);
        return;
    }
    const canvas = await exportRuleMode(props.useTransparent, true);
    if (canvas && ruleCanvasRef.value) {
        ruleCanvasRef.value.width = canvas.width;
        ruleCanvasRef.value.height = canvas.height;
        const ctx = ruleCanvasRef.value.getContext('2d');
        ctx.drawImage(canvas, 0, 0);
    }
};

// 网格/瀑布流导出
const exportRuleMode = async (useTransparent, forPreview = false) => {
    const direction = props.mode;
    const gap = props.spacing;
    const bgColor = props.bgColor;
    
    let loadedImages = [];
    for (const item of localImages.value) {
        const img = await loadImage(item.dataURL);
        loadedImages.push({ img, origW: item.width, origH: item.height });
    }
    if (loadedImages.length === 0) return null;
    
    let totalWidth = 0, totalHeight = 0;
    let positions = [];
    
    if (direction === 'grid') {
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
        totalWidth = cols * cellW + (cols - 1) * gap;
        totalHeight = rows * cellH + (rows - 1) * gap;
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.ceil(totalWidth));
        canvas.height = Math.max(1, Math.ceil(totalHeight));
        const ctx = canvas.getContext('2d');
        if (useTransparent) ctx.clearRect(0, 0, canvas.width, canvas.height);
        else { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        for (let i = 0; i < displayImages.length; i++) {
            const row = Math.floor(i / cols), col = i % cols;
            const cellX = col * (cellW + gap), cellY = row * (cellH + gap);
            const scale = Math.min(cellW / displayImages[i].origW, cellH / displayImages[i].origH);
            const drawW = displayImages[i].origW * scale, drawH = displayImages[i].origH * scale;
            const offsetX = (cellW - drawW) / 2, offsetY = (cellH - drawH) / 2;
            ctx.drawImage(displayImages[i].img, cellX + offsetX, cellY + offsetY, drawW, drawH);
        }
        if (forPreview) return canvas;
        return canvas.toDataURL('image/png');
    }
    else if (direction === 'masonry') {
        const cols = props.masonryCols;
        let fixedWidth = props.masonryColumnWidth;
        if (!fixedWidth || fixedWidth <= 0) fixedWidth = 360;
        const items = [];
        for (const item of loadedImages) {
            const scale = fixedWidth / item.origW;
            items.push({ img: item.img, w: fixedWidth, h: item.origH * scale });
        }
        let colHeights = new Array(cols).fill(0);
        for (let item of items) {
            let minCol = colHeights.indexOf(Math.min(...colHeights));
            positions.push({ img: item.img, x: minCol * (fixedWidth + gap), y: colHeights[minCol], drawW: fixedWidth, drawH: item.h });
            colHeights[minCol] += item.h + gap;
        }
        totalWidth = cols * fixedWidth + (cols - 1) * gap;
        totalHeight = Math.max(...colHeights) - gap;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(totalWidth));
    canvas.height = Math.max(1, Math.ceil(totalHeight));
    const ctx = canvas.getContext('2d');
    if (useTransparent) ctx.clearRect(0, 0, canvas.width, canvas.height);
    else { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    for (const p of positions) ctx.drawImage(p.img, p.x, p.y, p.drawW, p.drawH);
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

// 预设模式导出
const exportPresetMode = async (useTransparent) => {
    const config = presetTemplateConfig.value;
    if (!config || config.type === 'poster') {
        // 海报导出
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (useTransparent) ctx.clearRect(0, 0, canvas.width, canvas.height);
        else { ctx.fillStyle = props.bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = props.posterTextColor;
        ctx.font = `${props.posterFontSize}px "PingFang SC"`;
        ctx.textAlign = 'center';
        ctx.fillText(props.posterText || '美好时光', canvas.width / 2, canvas.height / 2);
        if (props.posterDateFormat !== 'none') {
            ctx.font = `${props.posterFontSize - 8}px sans-serif`;
            ctx.fillText(formattedDate.value, canvas.width / 2, canvas.height / 2 + 40);
        }
        return canvas.toDataURL('image/png');
    }
    
    const cellW = 300, cellH = 300;
    const canvas = document.createElement('canvas');
    canvas.width = config.cols * cellW + (config.cols - 1) * props.spacing;
    canvas.height = config.rows * cellH + (config.rows - 1) * props.spacing;
    const ctx = canvas.getContext('2d');
    if (useTransparent) ctx.clearRect(0, 0, canvas.width, canvas.height);
    else { ctx.fillStyle = props.bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    for (let i = 0; i < presetCells.value.length; i++) {
        const cell = presetCells.value[i];
        if (cell.imageData) {
            const img = await loadImage(cell.imageData);
            const row = Math.floor(i / config.cols), col = i % config.cols;
            const x = col * (cellW + props.spacing), y = row * (cellH + props.spacing);
            const scale = Math.min(cellW / img.width, cellH / img.height);
            const dw = img.width * scale, dh = img.height * scale;
            const dx = x + (cellW - dw) / 2, dy = y + (cellH - dh) / 2;
            ctx.drawImage(img, dx, dy, dw, dh);
        }
    }
    return canvas.toDataURL('image/png');
};

// 主导出接口
const exportImage = async (useTransparent = true) => {
    if (props.mode === 'free') return await exportFreeMode(useTransparent);
    if (props.mode === 'preset') return await exportPresetMode(useTransparent);
    return await exportRuleMode(useTransparent);
};

// 监听刷新
watch([() => props.mode, () => localImages.value, () => props.spacing, () => props.bgColor, 
        () => props.useTransparent, () => props.gridRows, () => props.gridCols, () => props.gridLayout,
        () => props.masonryCols, () => props.masonryColumnWidth,
        () => props.cellWidth, () => props.cellHeight, () => props.fillMode], () => {
    if (props.mode !== 'free' && props.mode !== 'preset') {
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
.canvas-zone {
    flex: 3;
    background: #f8fafc;
    margin: 18px 20px 10px 20px;
    border-radius: 28px;
    overflow: auto;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    min-height: 0;
}
.free-canvas-container {
    position: relative;
    overflow: visible;
    margin: auto;
    box-shadow: 0 0 0 2px #cbd5e1;
    border-radius: 4px;
}
.rule-canvas-container {
    overflow: auto;
    width: 100%;
    height: 100%;
    text-align: center;
}
.preview-canvas {
    display: inline-block;
    margin: 0 auto;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    background: #ffffff;
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
.drag-img-card:active {
    cursor: grabbing;
}
.drag-img-card:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}
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
.drag-img-card:hover .delete-icon {
    opacity: 1;
}
.delete-icon:hover {
    background: rgba(220, 38, 38, 1);
    transform: scale(1.05);
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
    .empty-message {
        white-space: normal;
        text-align: center;
        padding: 20px;
    }
}
</style>