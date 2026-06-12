<template>
    <div class="preset-canvas">
        <!-- 网格布局（非图文模式） -->
        <div v-if="!isTextMode" class="preset-layout" :style="layoutStyle">
            <div 
                v-for="(cell, idx) in cells" 
                :key="idx"
                class="preset-cell"
                :class="{ 'cell-selected': selectedCellIndex === idx }"
                @click="selectCell(idx)"
            >
                <img v-if="cell && cell.imageData" :src="cell.imageData" :style="imageStyle">
                <div v-else class="cell-placeholder">
                    <span>+</span>
                    <span class="placeholder-text">点击选中</span>
                </div>
                <div v-if="cell && cell.imageData" class="cell-remove" @click.stop="removeCellImage(idx)">✖</div>
            </div>
        </div>

        <!-- 图文模式 -->
        <div v-else class="text-mode-wrapper">
            <div class="text-mode-layout">
                <div 
                    v-for="(cell, idx) in cells" 
                    :key="idx"
                    class="preset-cell text-preset-cell"
                    :class="{ 'cell-selected': selectedCellIndex === idx }"
                    @click="selectCell(idx)"
                >
                    <img v-if="cell && cell.imageData" :src="cell.imageData" :style="imageStyle">
                    <div v-else class="cell-placeholder">
                        <span>+</span>
                        <span class="placeholder-text">点击选中</span>
                    </div>
                    <div v-if="cell && cell.imageData" class="cell-remove" @click.stop="removeCellImage(idx)">✖</div>
                </div>
            </div>
            <div class="text-area">
                <div class="poster-text">{{ posterText }}</div>
                <div class="poster-date">{{ formattedDate }}</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed, inject } from 'vue';
import { loadImage } from './utils/canvasHelpers.js';

const props = defineProps({
    subModeId: { type: String, default: '' },
    spacing: { type: Number, default: 12 },
    bgColor: { type: String, default: '#ffffff' },
    useTransparent: { type: Boolean, default: true },
    fillMode: { type: String, default: 'cover' },
    showOuterBorder: { type: Boolean, default: false },
    posterText: { type: String, default: '美好时光' },
    posterDateFormat: { type: String, default: 'YYYY-MM-DD' },
    posterTextColor: { type: String, default: '#ffffff' },
    posterFontSize: { type: Number, default: 24 },
    canvasWidth: { type: Number, default: 800 },
    canvasHeight: { type: Number, default: 600 }
});

const emit = defineEmits(['update:cells', 'select-cell']);

const cells = ref([]);
const selectedCellIndex = ref(-1);
const currentLayout = ref(null);

// 子模式库
const subModeLibrary = {
    '2-horizontal': { rows: 1, cols: 2, cells: 2 },
    '2-vertical': { rows: 2, cols: 1, cells: 2 },
    '3-horizontal': { rows: 1, cols: 3, cells: 3 },
    '3-vertical': { rows: 3, cols: 1, cells: 3 },
    '3-l': { type: 'custom', cells: 3 },
    '4-grid': { rows: 2, cols: 2, cells: 4 },
    '4-horizontal': { rows: 1, cols: 4, cells: 4 },
    '4-vertical': { rows: 4, cols: 1, cells: 4 },
    '5-2x3': { rows: 2, cols: 3, cells: 5 },
    '6-2x3': { rows: 2, cols: 3, cells: 6 },
    '6-3x2': { rows: 3, cols: 2, cells: 6 },
    '7-1-3-3': { rows: 3, cols: 3, cells: 7 },
    '8-2x4': { rows: 2, cols: 4, cells: 8 },
    '8-4x2': { rows: 4, cols: 2, cells: 8 },
    '9-grid': { rows: 3, cols: 3, cells: 9 },
    'text-simple': { type: 'text', cells: 1 }
};

const isTextMode = computed(() => props.subModeId === 'text-simple');

// 网格布局样式：使用固定格子大小，整体居中
const layoutStyle = computed(() => {
    if (isTextMode.value) return {};
    const layout = currentLayout.value;
    if (!layout) return {};
    // 每个格子固定宽度和高度（可根据需要调整，这里设为180px）
    const cellSize = 180;
    const gap = props.spacing;
    const totalWidth = layout.cols * cellSize + (layout.cols - 1) * gap;
    const totalHeight = layout.rows * cellSize + (layout.rows - 1) * gap;
    return {
        display: 'grid',
        gridTemplateColumns: `repeat(${layout.cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${layout.rows}, ${cellSize}px)`,
        gap: `${gap}px`,
        width: `${totalWidth}px`,
        height: `${totalHeight}px`,
        margin: 'auto'
    };
});

const imageStyle = computed(() => ({
    width: '100%',
    height: '100%',
    objectFit: props.fillMode === 'cover' ? 'cover' : 'contain'
}));

const formattedDate = computed(() => {
    if (props.posterDateFormat === 'none') return '';
    const now = new Date();
    if (props.posterDateFormat === 'YYYY-MM-DD') return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    if (props.posterDateFormat === 'YYYY/MM/DD') return `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')}`;
    if (props.posterDateFormat === 'DD/MM/YYYY') return `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
    if (props.posterDateFormat === 'MM/DD/YYYY') return `${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')}/${now.getFullYear()}`;
    return '';
});

const initLayout = (subId) => {
    const layout = subModeLibrary[subId];
    if (!layout) return;
    currentLayout.value = layout;
    const newCells = [];
    for (let i = 0; i < layout.cells; i++) {
        newCells.push({ imageId: null, imageData: null });
    }
    cells.value = newCells;
    emit('update:cells', cells.value);
};

const selectCell = (idx) => {
    selectedCellIndex.value = idx;
    emit('select-cell', idx);
};

const removeCellImage = (idx) => {
    const newCells = [...cells.value];
    newCells[idx] = { imageId: null, imageData: null };
    cells.value = newCells;
    emit('update:cells', cells.value);
    if (selectedCellIndex.value === idx) selectedCellIndex.value = -1;
};

const addImageToSelectedCell = (imageId, imageData) => {
    if (selectedCellIndex.value === -1) {
        alert('请先点击一个格子');
        return false;
    }
    const newCells = [...cells.value];
    newCells[selectedCellIndex.value] = { imageId, imageData };
    cells.value = newCells;
    emit('update:cells', cells.value);
    selectedCellIndex.value = -1;
    return true;
};

const addImageToEmptyCell = (imageId, imageData) => {
    const emptyIndex = cells.value.findIndex(cell => !cell.imageId);
    if (emptyIndex === -1) {
        alert('所有格子都已填满');
        return false;
    }
    const newCells = [...cells.value];
    newCells[emptyIndex] = { imageId, imageData };
    cells.value = newCells;
    emit('update:cells', cells.value);
    return true;
};

const exportImage = async (useTransparent) => {
    const canvas = document.createElement('canvas');
    canvas.width = props.canvasWidth;
    canvas.height = props.canvasHeight;
    const ctx = canvas.getContext('2d');
    
    if (useTransparent) ctx.clearRect(0, 0, canvas.width, canvas.height);
    else { ctx.fillStyle = props.bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    
    if (isTextMode.value) {
        if (cells.value[0] && cells.value[0].imageData) {
            const img = await loadImage(cells.value[0].imageData);
            const imgH = canvas.height * 0.7;
            const imgW = (img.width / img.height) * imgH;
            const imgX = (canvas.width - imgW) / 2;
            ctx.drawImage(img, imgX, 0, imgW, imgH);
        }
        ctx.fillStyle = props.posterTextColor;
        ctx.font = `${props.posterFontSize}px "PingFang SC"`;
        ctx.textAlign = 'center';
        ctx.fillText(props.posterText, canvas.width / 2, canvas.height - 50);
        if (props.posterDateFormat !== 'none') {
            ctx.font = `14px sans-serif`;
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillText(formattedDate.value, canvas.width / 2, canvas.height - 20);
        }
    } else {
        const layout = currentLayout.value;
        if (!layout) return null;
        const cellSize = 180; // 与预览保持一致
        const gap = props.spacing;
        const startX = (canvas.width - (layout.cols * cellSize + (layout.cols - 1) * gap)) / 2;
        const startY = (canvas.height - (layout.rows * cellSize + (layout.rows - 1) * gap)) / 2;
        for (let i = 0; i < cells.value.length; i++) {
            const cell = cells.value[i];
            if (cell && cell.imageData) {
                const img = await loadImage(cell.imageData);
                const row = Math.floor(i / layout.cols);
                const col = i % layout.cols;
                const x = startX + col * (cellSize + gap);
                const y = startY + row * (cellSize + gap);
                if (props.fillMode === 'cover') {
                    const scale = Math.max(cellSize / img.width, cellSize / img.height);
                    const dw = img.width * scale;
                    const dh = img.height * scale;
                    const dx = x + (cellSize - dw) / 2;
                    const dy = y + (cellSize - dh) / 2;
                    ctx.drawImage(img, dx, dy, dw, dh);
                } else {
                    const scale = Math.min(cellSize / img.width, cellSize / img.height);
                    const dw = img.width * scale;
                    const dh = img.height * scale;
                    const dx = x + (cellSize - dw) / 2;
                    const dy = y + (cellSize - dh) / 2;
                    ctx.drawImage(img, dx, dy, dw, dh);
                }
            }
        }
    }
    
    if (props.showOuterBorder && props.spacing > 0) {
        const outerCanvas = document.createElement('canvas');
        outerCanvas.width = canvas.width + props.spacing * 2;
        outerCanvas.height = canvas.height + props.spacing * 2;
        const outerCtx = outerCanvas.getContext('2d');
        if (useTransparent) outerCtx.clearRect(0, 0, outerCanvas.width, outerCanvas.height);
        else { outerCtx.fillStyle = props.bgColor; outerCtx.fillRect(0, 0, outerCanvas.width, outerCanvas.height); }
        outerCtx.drawImage(canvas, props.spacing, props.spacing);
        return outerCanvas.toDataURL('image/png');
    }
    
    return canvas.toDataURL('image/png');
};

const getResolution = () => ({
    width: props.canvasWidth,
    height: props.canvasHeight
});

const hasImages = () => cells.value.some(c => c.imageId);

defineExpose({
    exportImage,
    getResolution,
    addImageToSelectedCell,
    addImageToEmptyCell,
    hasImages
});

watch(() => props.subModeId, (newId) => {
    if (newId) {
        initLayout(newId);
        selectedCellIndex.value = -1;
    }
}, { immediate: true });
</script>

<style scoped>
/* 整体画布容器，带边框，内容居中 */
.preset-canvas {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: auto;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background-color: transparent;
}

/* 网格布局容器：固定尺寸，居中 */
.preset-layout {
    margin: auto;
}

/* 图文模式包装器，居中 */
.text-mode-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: auto;
}

/* 图文模式图片容器 - 固定尺寸 300x300 */
.text-mode-layout {
    width: 300px;
    height: 300px;
    background-color: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.text-preset-cell {
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
}

/* 文字区域 */
.text-area {
    margin-top: 16px;
    text-align: center;
    width: 100%;
}

/* 格子通用样式 */
.preset-cell {
    position: relative;
    background-color: #f1f5f9;
    border: 2px dashed #cbd5e1;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
    width: 100%;
    height: 100%;
}
.cell-selected {
    border: 3px solid #3b82f6;
    background: #eff6ff;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}
.cell-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #94a3b8;
}
.cell-placeholder span:first-child {
    font-size: 32px;
    font-weight: bold;
}
.placeholder-text {
    font-size: 12px;
    margin-top: 8px;
}
.cell-remove {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 24px;
    height: 24px;
    background: rgba(220, 38, 38, 0.85);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    cursor: pointer;
    z-index: 10;
}
.poster-text {
    font-size: 20px;
    font-weight: bold;
}
.poster-date {
    font-size: 14px;
    opacity: 0.8;
}
</style>