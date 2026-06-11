<template>
    <div class="preset-canvas">
        <!-- 图片拼接模板（九宫格等） -->
        <div v-if="!isPoster" class="preset-grid" :style="presetGridStyle">
            <div v-for="(cell, idx) in modelValue" :key="idx" 
                class="preset-cell" 
                :class="{ 'cell-selected': selectedCellIndex === idx }"
                :style="getPresetCellStyle()"
                @click="selectCell(idx)">
                <img v-if="cell && cell.imageData" :src="cell.imageData" :style="getPresetCellImageStyle()">
                <div v-else class="preset-cell-placeholder">
                    <span>+</span>
                    <span class="placeholder-text">点击选中</span>
                </div>
                <div v-if="cell && cell.imageData" class="preset-cell-remove" @click.stop="removeCellImage(idx)">✖</div>
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
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { loadImage } from './utils/canvasHelpers.js';

const props = defineProps({
    modelValue: { type: Array, default: () => [] },
    images: { type: Array, default: () => [] },
    spacing: { type: Number, default: 12 },
    bgColor: { type: String, default: '#ffffff' },
    useTransparent: { type: Boolean, default: true },
    fillMode: { type: String, default: 'cover' },
    presetTemplateId: { type: String, default: 'grid-3x3' },
    posterText: { type: String, default: '美好时光' },
    posterDateFormat: { type: String, default: 'YYYY-MM-DD' },
    posterTextPosition: { type: String, default: 'bottom-center' },
    posterTextColor: { type: String, default: '#ffffff' },
    posterFontSize: { type: Number, default: 32 },
    showOuterBorder: { type: Boolean, default: false },
    maskShape: { type: String, default: 'none' },
    cornerRadius: { type: Number, default: 20 },
    cellWidth: { type: Number, default: 300 },
    cellHeight: { type: Number, default: 185 }
});

const emit = defineEmits(['update:modelValue', 'select-cell']);

const presetTemplateConfig = ref(null);
const selectedCellIndex = ref(-1);

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

const isPoster = computed(() => props.presetTemplateId?.startsWith('poster'));
const posterLayout = computed(() => {
    const template = posterTemplates.find(t => t.id === props.presetTemplateId);
    return template?.layout || 'simple';
});

const formattedDate = computed(() => {
    if (props.posterDateFormat === 'none') return '';
    const now = new Date();
    if (props.posterDateFormat === 'YYYY-MM-DD') return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (props.posterDateFormat === 'YYYY/MM/DD') return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    if (props.posterDateFormat === 'DD/MM/YYYY') return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    if (props.posterDateFormat === 'MM/DD/YYYY') return `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;
    return '';
});

const presetGridStyle = computed(() => {
    const config = presetTemplateConfig.value;
    if (!config || config.type !== 'grid') return {};
    return {
        display: 'grid',
        gridTemplateRows: `repeat(${config.rows}, minmax(0, 1fr))`,
        gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
        gap: `${props.spacing}px`,
        width: '100%',
        height: '100%',
        backgroundColor: props.useTransparent ? 'transparent' : props.bgColor
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
    aspectRatio: '1 / 1',
    width: '100%',
    height: '100%',
    transition: 'all 0.2s ease'
});

const getPresetCellImageStyle = () => {
    if (props.fillMode === 'cover') {
        return { width: '100%', height: '100%', objectFit: 'cover' };
    }
    return { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' };
};

const initPresetTemplate = (templateId) => {
    const allTemplates = [...presetTemplates, ...posterTemplates];
    const template = allTemplates.find(t => t.id === templateId);
    if (!template) return;
    presetTemplateConfig.value = template;
    
    if (template.type === 'poster') {
        emit('update:modelValue', []);
    } else if (template.rows && template.cols) {
        const cells = [];
        for (let i = 0; i < template.rows * template.cols; i++) {
            cells.push({ imageId: null, imageData: null });
        }
        emit('update:modelValue', cells);
    }
    selectedCellIndex.value = -1;
};

const selectCell = (idx) => {
    selectedCellIndex.value = idx;
    emit('select-cell', idx);
};

const removeCellImage = (idx) => {
    const newCells = [...props.modelValue];
    newCells[idx] = { ...newCells[idx], imageId: null, imageData: null };
    emit('update:modelValue', newCells);
    if (selectedCellIndex.value === idx) {
        selectedCellIndex.value = -1;
    }
};

// 添加到选中的格子
const addImageToSelectedCell = (imageId, imageData) => {
    if (selectedCellIndex.value === -1) {
        alert('请先点击画布中的一个格子');
        return false;
    }
    const newCells = [...props.modelValue];
    if (!newCells[selectedCellIndex.value]) {
        newCells[selectedCellIndex.value] = {};
    }
    newCells[selectedCellIndex.value] = {
        ...newCells[selectedCellIndex.value],
        imageId: imageId,
        imageData: imageData
    };
    emit('update:modelValue', newCells);
    selectedCellIndex.value = -1;
    return true;
};

// 自动添加到第一个空余格子
const addImageToEmptyCell = (imageId, imageData) => {
    const emptyIndex = props.modelValue.findIndex(cell => !cell || !cell.imageData);
    if (emptyIndex === -1) {
        alert('所有格子都已填满，请先移除一些图片');
        return false;
    }
    
    const newCells = [...props.modelValue];
    if (!newCells[emptyIndex]) {
        newCells[emptyIndex] = {};
    }
    newCells[emptyIndex] = {
        ...newCells[emptyIndex],
        imageId: imageId,
        imageData: imageData
    };
    emit('update:modelValue', newCells);
    return true;
};

// 导出图片
const exportImage = async (useTransparent) => {
    const config = presetTemplateConfig.value;
    if (!config) return null;
    
    // 海报模板导出
    if (config.type === 'poster') {
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
    
    // 网格模板导出
    const cellW = 300, cellH = 300;
    const cols = config.cols;
    const rows = config.rows;
    const originalWidth = cols * cellW + (cols - 1) * props.spacing;
    const originalHeight = rows * cellH + (rows - 1) * props.spacing;
    
    const borderSize = props.showOuterBorder ? props.spacing : 0;
    const canvasWidth = originalWidth + borderSize * 2;
    const canvasHeight = originalHeight + borderSize * 2;
    
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(canvasWidth));
    canvas.height = Math.max(1, Math.ceil(canvasHeight));
    const ctx = canvas.getContext('2d');
    
    if (useTransparent) ctx.clearRect(0, 0, canvas.width, canvas.height);
    else { ctx.fillStyle = props.bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    
    ctx.save();
    ctx.translate(borderSize, borderSize);
    
    for (let i = 0; i < props.modelValue.length; i++) {
        const cell = props.modelValue[i];
        if (cell && cell.imageData) {
            try {
                const img = await loadImage(cell.imageData);
                const row = Math.floor(i / cols);
                const col = i % cols;
                const x = col * (cellW + props.spacing);
                const y = row * (cellH + props.spacing);
                const scale = Math.min(cellW / img.width, cellH / img.height);
                const dw = img.width * scale;
                const dh = img.height * scale;
                const dx = x + (cellW - dw) / 2;
                const dy = y + (cellH - dh) / 2;
                
                ctx.save();
                ctx.beginPath();
                ctx.rect(x, y, cellW, cellH);
                ctx.clip();
                
                if (props.maskShape !== 'none') {
                    if (props.maskShape === 'circle') {
                        const centerX = dx + dw / 2;
                        const centerY = dy + dh / 2;
                        const radius = Math.min(dw, dh) / 2;
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                        ctx.clip();
                    } else if (props.maskShape === 'roundRect') {
                        const r = Math.min(props.cornerRadius, Math.min(dw, dh) / 2);
                        ctx.beginPath();
                        ctx.moveTo(dx + r, dy);
                        ctx.lineTo(dx + dw - r, dy);
                        ctx.quadraticCurveTo(dx + dw, dy, dx + dw, dy + r);
                        ctx.lineTo(dx + dw, dy + dh - r);
                        ctx.quadraticCurveTo(dx + dw, dy + dh, dx + dw - r, dy + dh);
                        ctx.lineTo(dx + r, dy + dh);
                        ctx.quadraticCurveTo(dx, dy + dh, dx, dy + dh - r);
                        ctx.lineTo(dx, dy + r);
                        ctx.quadraticCurveTo(dx, dy, dx + r, dy);
                        ctx.closePath();
                        ctx.clip();
                    }
                }
                
                ctx.drawImage(img, dx, dy, dw, dh);
                ctx.restore();
            } catch (err) {
                console.warn('绘制图片失败:', err);
            }
        }
    }
    
    ctx.restore();
    return canvas.toDataURL('image/png');
};

// 获取分辨率
const getResolution = () => {
    const config = presetTemplateConfig.value;
    if (!config) return { width: 0, height: 0 };
    
    // 海报模板
    if (config.type === 'poster') {
        return { width: 800, height: 600 };
    }
    
    // 网格模板
    const cols = config.cols;
    const rows = config.rows;
    
    // 使用用户设置的单元格尺寸，如果没有则使用默认值 300
    let cellW = props.cellWidth || 300;
    let cellH = props.cellHeight || 185;
    
    // 注意：preset模式下的单元格尺寸应该从 props 获取
    // 但您的 props 中没有 cellWidth/cellHeight，需要添加
    const originalWidth = cols * cellW + (cols - 1) * props.spacing;
    const originalHeight = rows * cellH + (rows - 1) * props.spacing;
    const borderSize = props.showOuterBorder ? props.spacing : 0;
    
    return {
        width: originalWidth + borderSize * 2,
        height: originalHeight + borderSize * 2
    };
};

watch(() => props.presetTemplateId, (newId) => {
    if (newId) {
        initPresetTemplate(newId);
        selectedCellIndex.value = -1;
    }
}, { immediate: true });

defineExpose({ 
    exportImage, 
    getResolution,
    addImageToSelectedCell, 
    addImageToEmptyCell 
});
</script>

<style scoped>
.preset-canvas {
    width: 100%;
    height: 100%;
    padding: 20px;
    box-sizing: border-box;
    overflow: auto;
}
.preset-grid {
    display: grid;
    width: 100%;
    height: 100%;
    min-height: 400px;
}
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
    aspect-ratio: 1 / 1;
    width: 100%;
    height: 100%;
    transition: all 0.2s ease;
}
.preset-cell.cell-selected {
    border: 3px solid #3b82f6;
    background: #eff6ff;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}
.preset-cell-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    text-align: center;
}
.preset-cell-placeholder span:first-child {
    font-size: 32px;
    font-weight: bold;
    line-height: 1;
}
.placeholder-text {
    font-size: 12px;
    margin-top: 8px;
}
.preset-cell-remove {
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
    transition: all 0.2s ease;
}
.preset-cell-remove:hover {
    background: #dc2626;
    transform: scale(1.05);
}
.preset-cell img {
    width: 100%;
    height: 100%;
    display: block;
}
.poster-canvas {
    width: 100%;
    height: 100%;
    min-height: 400px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
}
.poster-content {
    text-align: center;
    color: white;
    padding: 20px;
}
.poster-text {
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 20px;
    word-break: break-word;
}
.poster-date {
    font-size: 18px;
    opacity: 0.9;
}
@media (max-width: 600px) {
    .preset-cell-placeholder span:first-child { font-size: 24px; }
    .placeholder-text { font-size: 10px; }
    .poster-text { font-size: 24px; }
    .poster-date { font-size: 14px; }
}
</style>