<template>
    <div class="preset-canvas">
        <!-- 图片拼接模板 -->
        <div v-if="!isPoster" class="preset-grid" :style="presetGridStyle">
            <div v-for="(cell, idx) in presetCells" :key="idx" 
                class="preset-cell" 
                :class="{ 'cell-selected': selectedCellIndex === idx }"
                :style="getPresetCellStyle()"
                @click="selectCell(idx)">
                <img v-if="cell.imageData" :src="cell.imageData" :style="getPresetCellImageStyle()">
                <div v-else class="preset-cell-placeholder">
                    <span>+</span>
                    <span class="placeholder-text">点击选中</span>
                </div>
                <div v-if="cell.imageData" class="preset-cell-remove" @click.stop="removeCellImage(idx)">✖</div>
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
import { ref, watch, computed, inject } from 'vue';
import { loadImage } from './utils/canvasHelpers.js';

const props = defineProps({
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
    showOuterBorder: { type: Boolean, default: false }
});

const emit = defineEmits(['update:presetCells', 'select-cell']);

const galleryImages = inject('galleryImages', ref([]));
const presetCells = ref([]);
const presetTemplateConfig = ref(null);
const selectedCellIndex = ref(-1);

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
    height: '100%'
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
        presetCells.value = [];
    } else if (template.rows && template.cols) {
        const cells = [];
        for (let i = 0; i < template.rows * template.cols; i++) {
            cells.push({ imageId: null, imageData: null });
        }
        presetCells.value = cells;
    }
    emit('update:presetCells', presetCells.value);
};

const selectCell = (idx) => {
    selectedCellIndex.value = idx;
    emit('select-cell', idx);
};

const removeCellImage = (idx) => {
    const newCells = [...presetCells.value];
    newCells[idx] = { ...newCells[idx], imageId: null, imageData: null };
    presetCells.value = newCells;
    emit('update:presetCells', presetCells.value);
    if (selectedCellIndex.value === idx) {
        selectedCellIndex.value = -1;
    }
};

const addImageToSelectedCell = (imageId, imageData) => {
    if (selectedCellIndex.value === -1) {
        alert('请先点击画布中的一个格子');
        return false;
    }
    const newCells = [...presetCells.value];
    newCells[selectedCellIndex.value] = {
        ...newCells[selectedCellIndex.value],
        imageId: imageId,
        imageData: imageData
    };
    presetCells.value = newCells;
    emit('update:presetCells', presetCells.value);
    selectedCellIndex.value = -1;
    return true;
};

// 导出图片
// 确保 exportImage 是 async 函数，并且正确返回
const exportImage = async (useTransparent) => {
    const config = presetTemplateConfig.value;
    if (!config) {
        console.warn('没有模板配置');
        return null;
    }
    
    // 海报模板导出
    if (config.type === 'poster') {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        if (useTransparent) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = props.bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
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
    
    // 绘制背景
    if (useTransparent) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = props.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // 偏移绘制内容
    ctx.save();
    ctx.translate(borderSize, borderSize);
    
    for (let i = 0; i < presetCells.value.length; i++) {
        const cell = presetCells.value[i];
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
                ctx.drawImage(img, dx, dy, dw, dh);
            } catch (err) {
                console.warn('绘制图片失败:', err);
            }
        }
    }
    
    ctx.restore();
    return canvas.toDataURL('image/png');
};

watch(() => props.presetTemplateId, (newId) => {
    if (newId) {
        initPresetTemplate(newId);
        selectedCellIndex.value = -1;
    }
}, { immediate: true });

defineExpose({ exportImage, addImageToSelectedCell });
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