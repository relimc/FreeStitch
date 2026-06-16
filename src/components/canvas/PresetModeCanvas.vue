<template>
    <div class="preset-canvas">
        <!-- 网格布局 -->
        <div v-if="!isTextMode" class="preset-layout" :style="layoutStyle">
            <div 
                v-for="(cell, idx) in cells" 
                :key="idx"
                class="preset-cell"
                :class="{
                    'cell-selected': selectedCellIndex === idx,
                    'mask-circle': maskShape === 'circle',
                    'mask-round': maskShape === 'roundRect'
                }"
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
            <div 
                class="text-mode-layout"
                :class="{
                    'mask-circle': maskShape === 'circle',
                    'mask-round': maskShape === 'roundRect'
                }"
                :style="textLayoutStyle"
            >
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
import { ref, watch, computed } from 'vue';
import { loadImage } from './utils/canvasHelpers.js';

const props = defineProps({
    subModeId: { type: String, default: '' },
    spacing: { type: Number, default: 12 },
    outerBorderSize: { type: Number, default: 0 },
    bgColor: { type: String, default: '#ffffff' },
    useTransparent: { type: Boolean, default: true },
    fillMode: { type: String, default: 'cover' },
    maskShape: { type: String, default: 'none' },
    cornerRadius: { type: Number, default: 20 },
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

const subModeLibrary = {
    '2-horizontal': { rows: 1, cols: 2, cells: 2 },
    '2-vertical': { rows: 2, cols: 1, cells: 2 },
    '3-horizontal': { rows: 1, cols: 3, cells: 3 },
    '3-vertical': { rows: 3, cols: 1, cells: 3 },
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

const layoutStyle = computed(() => {
    if (isTextMode.value) return {};
    const layout = currentLayout.value;
    if (!layout) return {};
    const cellSize = 180;
    const gap = props.spacing;
    const borderSize = props.outerBorderSize > 0 ? props.outerBorderSize : 0;
    return {
        display: 'grid',
        gridTemplateColumns: `repeat(${layout.cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${layout.rows}, ${cellSize}px)`,
        gap: `${gap}px`,
        width: 'fit-content',
        height: 'fit-content',
        margin: '0 auto',
        backgroundColor: props.useTransparent ? 'transparent' : props.bgColor,
        boxShadow: borderSize > 0 ? `0 0 0 ${borderSize}px ${props.useTransparent ? 'transparent' : props.bgColor}` : 'none'
    };
});

const textLayoutStyle = computed(() => {
    const borderSize = props.outerBorderSize > 0 ? props.outerBorderSize : 0;
    return {
        width: '300px',
        height: '300px',
        backgroundColor: props.useTransparent ? 'transparent' : props.bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        margin: '20px',
        boxShadow: borderSize > 0 ? `0 0 0 ${borderSize}px ${props.useTransparent ? 'transparent' : props.bgColor}` : 'none'
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
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    if (props.posterDateFormat === 'YYYY-MM-DD') return `${y}-${m}-${d}`;
    if (props.posterDateFormat === 'YYYY/MM/DD') return `${y}/${m}/${d}`;
    if (props.posterDateFormat === 'DD/MM/YYYY') return `${d}/${m}/${y}`;
    if (props.posterDateFormat === 'MM/DD/YYYY') return `${m}/${d}/${y}`;
    return '';
});

// 初始化布局
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

// ---------- 导出图片（透明背景修复 + 圆角蒙版） ----------
const exportImage = async (useTransparent) => {
    const borderSize = props.outerBorderSize > 0 ? props.outerBorderSize : 0;
    
    // 辅助函数：在给定区域应用蒙版裁剪（不保存/恢复状态，由调用者管理）
    const applyMaskToCtx = (ctx, x, y, w, h) => {
        if (props.maskShape === 'none') {
            // 无蒙版时，用矩形裁剪防止图片溢出
            ctx.beginPath();
            ctx.rect(x, y, w, h);
            ctx.clip();
            return;
        }
        
        if (props.maskShape === 'circle') {
            const cx = x + w / 2;
            const cy = y + h / 2;
            const r = Math.min(w, h) / 2;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            return;
        }
        
        if (props.maskShape === 'roundRect') {
            const radius = Math.min(props.cornerRadius || 0, Math.min(w, h) / 2);
            if (radius <= 0) {
                ctx.beginPath();
                ctx.rect(x, y, w, h);
                ctx.clip();
                return;
            }
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + w - radius, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
            ctx.lineTo(x + w, y + h - radius);
            ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
            ctx.lineTo(x + radius, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.clip();
            return;
        }
    };

    // ---- 图文模式 ----
    if (isTextMode.value) {
        const canvas = document.createElement('canvas');
        canvas.width = props.canvasWidth + borderSize * 2;
        canvas.height = props.canvasHeight + borderSize * 2;
        const ctx = canvas.getContext('2d');
        
        if (useTransparent) ctx.clearRect(0, 0, canvas.width, canvas.height);
        else { ctx.fillStyle = props.bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        
        ctx.save();
        ctx.translate(borderSize, borderSize);
        
        // 绘制图片（如果存在）
        if (cells.value[0] && cells.value[0].imageData) {
            const img = await loadImage(cells.value[0].imageData);
            const imgH = props.canvasHeight * 0.7;
            const imgW = (img.width / img.height) * imgH;
            const imgX = (props.canvasWidth - imgW) / 2;
            
            ctx.save();
            applyMaskToCtx(ctx, imgX, 0, imgW, imgH);
            ctx.drawImage(img, imgX, 0, imgW, imgH);
            ctx.restore();
        }
        
        // 绘制文字（注意：文字在透明背景下也保留，用户可能需要）
        ctx.fillStyle = props.posterTextColor;
        ctx.font = `${props.posterFontSize}px "PingFang SC"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(props.posterText, props.canvasWidth / 2, props.canvasHeight - 30);
        if (props.posterDateFormat !== 'none') {
            ctx.font = `14px sans-serif`;
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.textBaseline = 'bottom';
            ctx.fillText(formattedDate.value, props.canvasWidth / 2, props.canvasHeight - 8);
        }
        
        ctx.restore();
        return canvas.toDataURL('image/png');
    }

    // ---- 网格预设模式 ----
    const layout = currentLayout.value;
    if (!layout) return null;
    
    const cellSize = 180;
    const gap = props.spacing;
    const totalWidth = layout.cols * cellSize + (layout.cols - 1) * gap;
    const totalHeight = layout.rows * cellSize + (layout.rows - 1) * gap;
    
    const canvas = document.createElement('canvas');
    canvas.width = totalWidth + borderSize * 2;
    canvas.height = totalHeight + borderSize * 2;
    const ctx = canvas.getContext('2d');
    
    if (useTransparent) ctx.clearRect(0, 0, canvas.width, canvas.height);
    else { ctx.fillStyle = props.bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    
    ctx.save();
    ctx.translate(borderSize, borderSize);
    
    for (let i = 0; i < cells.value.length; i++) {
        const cell = cells.value[i];
        const row = Math.floor(i / layout.cols);
        const col = i % layout.cols;
        const x = col * (cellSize + gap);
        const y = row * (cellSize + gap);
        
        // ✅ 仅在非透明模式下绘制灰色背景
        if (!useTransparent) {
            ctx.fillStyle = props.bgColor;
            ctx.fillRect(x, y, cellSize, cellSize);
        }
        
        if (cell && cell.imageData) {
            // 加载图片
            const img = await loadImage(cell.imageData);
            
            // 计算绘制尺寸
            let drawW, drawH, offsetX, offsetY;
            if (props.fillMode === 'cover') {
                const scale = Math.max(cellSize / img.width, cellSize / img.height);
                drawW = img.width * scale;
                drawH = img.height * scale;
                offsetX = (cellSize - drawW) / 2;
                offsetY = (cellSize - drawH) / 2;
            } else { // contain
                const scale = Math.min(cellSize / img.width, cellSize / img.height);
                drawW = img.width * scale;
                drawH = img.height * scale;
                offsetX = (cellSize - drawW) / 2;
                offsetY = (cellSize - drawH) / 2;
            }
            
            // 应用蒙版并绘制图片
            ctx.save();
            applyMaskToCtx(ctx, x, y, cellSize, cellSize);
            ctx.drawImage(img, x + offsetX, y + offsetY, drawW, drawH);
            ctx.restore();
        } else {
            // ✅ 空单元格：仅在非透明模式下绘制虚线框和加号，透明模式下完全透明
            if (!useTransparent) {
                ctx.save();
                ctx.strokeStyle = '#cbd5e1';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(x, y, cellSize, cellSize);
                ctx.setLineDash([]);
                ctx.fillStyle = '#94a3b8';
                ctx.font = `${Math.min(cellSize, cellSize) * 0.3}px "PingFang SC"`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('+', x + cellSize / 2, y + cellSize / 2);
                ctx.restore();
            }
        }
    }
    
    ctx.restore();
    return canvas.toDataURL('image/png');
};

// 获取分辨率
const getResolution = () => {
    if (isTextMode.value) {
        const borderSize = props.outerBorderSize > 0 ? props.outerBorderSize : 0;
        return {
            width: props.canvasWidth + borderSize * 2,
            height: props.canvasHeight + borderSize * 2
        };
    }
    const layout = currentLayout.value;
    if (!layout) return { width: 0, height: 0 };
    const cellSize = 180;
    const gap = props.spacing;
    const borderSize = props.outerBorderSize > 0 ? props.outerBorderSize : 0;
    return {
        width: layout.cols * cellSize + (layout.cols - 1) * gap + borderSize * 2,
        height: layout.rows * cellSize + (layout.rows - 1) * gap + borderSize * 2
    };
};

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
.preset-canvas {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
    background-color: transparent;
}

.preset-layout {
    margin: 0 auto;
}

.text-mode-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.text-mode-layout {
    width: 300px;
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin: 20px;
}

.preset-cell {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    width: 100%;
    height: 100%;
    background-color: #f1f5f9;
    border: 2px dashed #cbd5e1;
    transition: all 0.2s ease;
}

.mask-circle {
    border-radius: 50% !important;
    overflow: hidden !important;
}

.mask-round {
    border-radius: v-bind(cornerRadius + 'px') !important;
    overflow: hidden !important;
}

.cell-selected {
    border: 3px solid #3b82f6 !important;
    background: #eff6ff !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.preset-cell img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
}

.text-preset-cell {
    border: none !important;
    background: transparent !important;
}

.text-area {
    margin-top: 16px;
    text-align: center;
    width: 100%;
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