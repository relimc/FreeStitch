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

        <!-- 海报模板（图片拼接风格） -->
        <div v-else class="poster-canvas">
            <!-- 经典网格 2x2 -->
            <div v-if="posterLayout === 'grid-2x2'" class="poster-grid-2x2">
                <div v-for="(cell, idx) in posterCells" :key="idx" class="poster-cell" 
                    :class="{ 'cell-selected': selectedPosterCellIndex === idx }"
                    @click="selectPosterCell(idx)">
                    <img v-if="cell && cell.imageData" :src="cell.imageData">
                    <div v-else class="poster-cell-placeholder">+</div>
                    <div v-if="cell && cell.imageData" class="poster-cell-remove" @click.stop="removePosterCell(idx)">✖</div>
                </div>
            </div>
            
            <!-- 大图+小图布局 -->
            <div v-else-if="posterLayout === 'big-small'" class="poster-big-small">
                <div class="poster-big" 
                    :class="{ 'cell-selected': selectedPosterCellIndex === 0 }"
                    @click="selectPosterCell(0)">
                    <img v-if="posterCells[0] && posterCells[0].imageData" :src="posterCells[0].imageData">
                    <div v-else class="poster-cell-placeholder">+</div>
                    <div v-if="posterCells[0] && posterCells[0].imageData" class="poster-cell-remove" @click.stop="removePosterCell(0)">✖</div>
                </div>
                <div class="poster-small-group">
                    <div class="poster-small" 
                        v-for="idx in [1, 2]" :key="idx"
                        :class="{ 'cell-selected': selectedPosterCellIndex === idx }"
                        @click="selectPosterCell(idx)">
                        <img v-if="posterCells[idx] && posterCells[idx].imageData" :src="posterCells[idx].imageData">
                        <div v-else class="poster-cell-placeholder">+</div>
                        <div v-if="posterCells[idx] && posterCells[idx].imageData" class="poster-cell-remove" @click.stop="removePosterCell(idx)">✖</div>
                    </div>
                </div>
            </div>
            
            <!-- 三图横排 -->
            <div v-else-if="posterLayout === 'three-horizontal'" class="poster-three-horizontal">
                <div v-for="(cell, idx) in posterCells" :key="idx" class="poster-cell"
                    :class="{ 'cell-selected': selectedPosterCellIndex === idx }"
                    @click="selectPosterCell(idx)">
                    <img v-if="cell && cell.imageData" :src="cell.imageData">
                    <div v-else class="poster-cell-placeholder">+</div>
                    <div v-if="cell && cell.imageData" class="poster-cell-remove" @click.stop="removePosterCell(idx)">✖</div>
                </div>
            </div>
            
            <!-- 上下布局 -->
            <div v-else-if="posterLayout === 'top-bottom'" class="poster-top-bottom">
                <div class="poster-top" 
                    :class="{ 'cell-selected': selectedPosterCellIndex === 0 }"
                    @click="selectPosterCell(0)">
                    <img v-if="posterCells[0] && posterCells[0].imageData" :src="posterCells[0].imageData">
                    <div v-else class="poster-cell-placeholder">+</div>
                    <div v-if="posterCells[0] && posterCells[0].imageData" class="poster-cell-remove" @click.stop="removePosterCell(0)">✖</div>
                </div>
                <div class="poster-bottom-group">
                    <div class="poster-bottom" 
                        v-for="idx in [1, 2]" :key="idx"
                        :class="{ 'cell-selected': selectedPosterCellIndex === idx }"
                        @click="selectPosterCell(idx)">
                        <img v-if="posterCells[idx] && posterCells[idx].imageData" :src="posterCells[idx].imageData">
                        <div v-else class="poster-cell-placeholder">+</div>
                        <div v-if="posterCells[idx] && posterCells[idx].imageData" class="poster-cell-remove" @click.stop="removePosterCell(idx)">✖</div>
                    </div>
                </div>
            </div>
            
            <div class="poster-footer">
                <div class="poster-text">{{ posterText }}</div>
                <div class="poster-date">{{ formattedDate }}</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue';
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
    posterTextColor: { type: String, default: '#ffffff' },
    posterFontSize: { type: Number, default: 24 },
    showOuterBorder: { type: Boolean, default: false },
    maskShape: { type: String, default: 'none' },
    cornerRadius: { type: Number, default: 20 },
    cellWidth: { type: Number, default: 300 },
    cellHeight: { type: Number, default: 185 }
});

const emit = defineEmits(['update:modelValue', 'select-cell']);

const presetTemplateConfig = ref(null);
const selectedCellIndex = ref(-1);

// 预设模板定义（九宫格等）
const presetTemplates = [
    { id: 'grid-3x3', name: '九宫格', rows: 3, cols: 3, type: 'grid' },
    { id: 'grid-2x2', name: '四宫格', rows: 2, cols: 2, type: 'grid' },
    { id: 'grid-1x2', name: '横向双拼', rows: 1, cols: 2, type: 'grid' },
    { id: 'grid-2x1', name: '纵向双拼', rows: 2, cols: 1, type: 'grid' }
];

// 海报模板定义（图片拼接风格）
const posterTemplates = [
    { id: 'poster-grid-2x2', name: '经典网格', type: 'poster', layout: 'grid-2x2', cells: 4 },
    { id: 'poster-big-small', name: '大图+小图', type: 'poster', layout: 'big-small', cells: 3 },
    { id: 'poster-three-horizontal', name: '三图横排', type: 'poster', layout: 'three-horizontal', cells: 3 },
    { id: 'poster-top-bottom', name: '上下布局', type: 'poster', layout: 'top-bottom', cells: 3 }
];

// 判断是否为海报模板
const isPoster = computed(() => props.presetTemplateId?.startsWith('poster'));

// 海报模式相关
const posterLayout = ref('grid-2x2');
const posterCells = ref([]);
const selectedPosterCellIndex = ref(-1);


const posterCanvasStyle = computed(() => ({
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
}));

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

// 初始化预设模板
const initPresetTemplate = (templateId) => {
    const allTemplates = [...presetTemplates, ...posterTemplates];
    const template = allTemplates.find(t => t.id === templateId);
    if (!template) return;
    presetTemplateConfig.value = template;
    
    if (template.type === 'poster') {
        // 重新初始化海报格子（清空旧数据）
        const cells = [];
        for (let i = 0; i < template.cells; i++) {
            cells.push({ imageId: null, imageData: null });
        }
        posterCells.value = cells;
        posterLayout.value = template.layout;
        selectedPosterCellIndex.value = -1;
    } else if (template.rows && template.cols) {
        const cells = [];
        for (let i = 0; i < template.rows * template.cols; i++) {
            cells.push({ imageId: null, imageData: null });
        }
        emit('update:modelValue', cells);
        selectedCellIndex.value = -1;
    }
};

// 选中格子（九宫格模式）
const selectCell = (idx) => {
    selectedCellIndex.value = idx;
    emit('select-cell', idx);
};

// 移除格子图片
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

// ========== 海报模式方法 ==========
const selectPosterCell = (idx) => {
    selectedPosterCellIndex.value = idx;
    emit('select-cell', idx);
};

const removePosterCell = (idx) => {
    const newCells = [...posterCells.value];
    newCells[idx] = { imageId: null, imageData: null };
    posterCells.value = newCells;
    if (selectedPosterCellIndex.value === idx) {
        selectedPosterCellIndex.value = -1;
    }
};

const addImageToSelectedPosterCell = (imageId, imageData) => {
    if (selectedPosterCellIndex.value === -1) {
        alert('请先点击画布中的一个格子');
        return false;
    }
    const newCells = [...posterCells.value];
    newCells[selectedPosterCellIndex.value] = { imageId, imageData };
    posterCells.value = newCells;
    selectedPosterCellIndex.value = -1;
    return true;
};

const addImageToEmptyPosterCell = (imageId, imageData) => {
    const emptyIndex = posterCells.value.findIndex(cell => !cell || !cell.imageData);
    if (emptyIndex === -1) {
        alert('所有格子都已填满，请先移除一些图片');
        return false;
    }
    const newCells = [...posterCells.value];
    newCells[emptyIndex] = { imageId, imageData };
    posterCells.value = newCells;
    return true;
};

// 导出图片
const exportImage = async (useTransparent) => {
    const config = presetTemplateConfig.value;
    if (!config) return null;
    
    // 导出图片中的海报模板部分
    if (config.type === 'poster') {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = config.layout === 'movie' ? 1000 : 800;
        const ctx = canvas.getContext('2d');
        
        // 绘制背景
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const cells = posterCells.value;
        const layout = config.layout;
        const gap = props.spacing;
        const textPosition = config.textPosition;
        
        // 根据布局绘制图片区域
        if (layout === 'grid-3x3') {
            const cellW = (canvas.width - gap * 2) / 3;
            const cellH = (canvas.height - gap * 2 - 100) / 3;
            for (let i = 0; i < 9 && i < cells.length; i++) {
                if (cells[i] && cells[i].imageData) {
                    const img = await loadImage(cells[i].imageData);
                    const row = Math.floor(i / 3);
                    const col = i % 3;
                    const x = col * (cellW + gap);
                    const y = row * (cellH + gap);
                    ctx.drawImage(img, x, y, cellW, cellH);
                }
            }
            drawText(ctx, textPosition, 100);
        }
        else if (layout === 'grid-2x2') {
            const cellW = (canvas.width - gap) / 2;
            const cellH = (canvas.height - gap - 100) / 2;
            for (let i = 0; i < 4 && i < cells.length; i++) {
                if (cells[i] && cells[i].imageData) {
                    const img = await loadImage(cells[i].imageData);
                    const row = Math.floor(i / 2);
                    const col = i % 2;
                    const x = col * (cellW + gap);
                    const y = row * (cellH + gap);
                    ctx.drawImage(img, x, y, cellW, cellH);
                }
            }
            drawText(ctx, textPosition, 100);
        }
        else if (layout === 'big-small') {
            const bigW = canvas.width * 0.6;
            const smallW = canvas.width * 0.4;
            const smallH = (canvas.height - 100 - gap) / 2;
            if (cells[0] && cells[0].imageData) {
                const img = await loadImage(cells[0].imageData);
                ctx.drawImage(img, 0, 0, bigW, canvas.height - 100);
            }
            if (cells[1] && cells[1].imageData) {
                const img = await loadImage(cells[1].imageData);
                ctx.drawImage(img, bigW + gap, 0, smallW, smallH);
            }
            if (cells[2] && cells[2].imageData) {
                const img = await loadImage(cells[2].imageData);
                ctx.drawImage(img, bigW + gap, smallH + gap, smallW, smallH);
            }
            drawText(ctx, textPosition, 100);
        }
        else if (layout === 'top-bottom') {
            const topH = (canvas.height - 100 - gap) * 0.6;
            const bottomH = (canvas.height - 100 - gap) * 0.4;
            const bottomW = (canvas.width - gap) / 2;
            if (cells[0] && cells[0].imageData) {
                const img = await loadImage(cells[0].imageData);
                ctx.drawImage(img, 0, 0, canvas.width, topH);
            }
            if (cells[1] && cells[1].imageData) {
                const img = await loadImage(cells[1].imageData);
                ctx.drawImage(img, 0, topH + gap, bottomW, bottomH);
            }
            if (cells[2] && cells[2].imageData) {
                const img = await loadImage(cells[2].imageData);
                ctx.drawImage(img, bottomW + gap, topH + gap, bottomW, bottomH);
            }
            drawText(ctx, textPosition, 100);
        }
        else if (layout === 'banner') {
            // 横幅海报：上方通栏图
            const imgHeight = canvas.height - 150;
            if (cells[0] && cells[0].imageData) {
                const img = await loadImage(cells[0].imageData);
                ctx.drawImage(img, 0, 0, canvas.width, imgHeight);
            }
            drawText(ctx, 'below', 0);
        }
        else if (layout === 'movie') {
            // 电影海报：全幅背景图
            if (cells[0] && cells[0].imageData) {
                const img = await loadImage(cells[0].imageData);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height - 150);
            }
            drawText(ctx, 'center', 0);
        }
        
        function drawText(ctx, position, offsetY) {
            const text = props.posterText || '美好时光';
            const date = formattedDate.value;
            const textColor = props.posterTextColor || '#ffffff';
            const fontSize = props.posterFontSize || 24;
            
            ctx.fillStyle = textColor;
            ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei"`;
            ctx.textAlign = 'center';
            
            if (position === 'bottom') {
                ctx.fillText(text, canvas.width / 2, canvas.height - offsetY - 40);
                if (date) {
                    ctx.font = `14px sans-serif`;
                    ctx.fillStyle = 'rgba(255,255,255,0.8)';
                    ctx.fillText(date, canvas.width / 2, canvas.height - offsetY - 15);
                }
            } else if (position === 'below') {
                ctx.fillText(text, canvas.width / 2, canvas.height - offsetY - 50);
                if (date) {
                    ctx.font = `14px sans-serif`;
                    ctx.fillText(date, canvas.width / 2, canvas.height - offsetY - 25);
                }
            } else if (position === 'center') {
                ctx.fillText(text, canvas.width / 2, canvas.height / 2);
                if (date) {
                    ctx.font = `14px sans-serif`;
                    ctx.fillText(date, canvas.width / 2, canvas.height / 2 + 35);
                }
            }
        }
        
        return canvas.toDataURL('image/png');
    }
    
    // ========== 网格模板导出（完整保留） ==========
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
    
    if (config.type === 'poster') {
        return { width: 800, height: 700 };
    }
    
    const cellW = props.cellWidth;
    const cellH = props.cellHeight;
    const cols = config.cols;
    const rows = config.rows;
    const originalWidth = cols * cellW + (cols - 1) * props.spacing;
    const originalHeight = rows * cellH + (rows - 1) * props.spacing;
    const borderSize = props.showOuterBorder ? props.spacing : 0;
    
    return {
        width: originalWidth + borderSize * 2,
        height: originalHeight + borderSize * 2
    };
};

// 监听模板变化，重新初始化
watch(() => props.presetTemplateId, (newId) => {
    if (newId) {
        initPresetTemplate(newId);
        selectedCellIndex.value = -1;
        selectedPosterCellIndex.value = -1;
    }
}, { immediate: true });

defineExpose({ 
    exportImage, 
    getResolution,
    addImageToSelectedCell, 
    addImageToEmptyCell,
    addImageToSelectedPosterCell,
    addImageToEmptyPosterCell
});
</script>

<style scoped>
/* 样式保持不变 */
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

/* 海报布局样式 */
.poster-canvas {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.poster-grid-2x2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 8px;
    flex: 1;
    padding: 16px;
}

.poster-big-small {
    display: flex;
    gap: 8px;
    flex: 1;
    padding: 16px;
}
.poster-big {
    flex: 2;
}
.poster-small-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.poster-small {
    flex: 1;
}

.poster-three-horizontal {
    display: flex;
    gap: 8px;
    flex: 1;
    padding: 16px;
}
.poster-three-horizontal .poster-cell {
    flex: 1;
}

.poster-top-bottom {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    padding: 16px;
}
.poster-top {
    flex: 2;
}
.poster-bottom-group {
    flex: 1;
    display: flex;
    gap: 8px;
}
.poster-bottom {
    flex: 1;
}

.poster-cell, .poster-big, .poster-small, .poster-top, .poster-bottom {
    background: rgba(255,255,255,0.1);
    border: 2px dashed rgba(255,255,255,0.3);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
    position: relative;
}

.poster-cell.cell-selected, 
.poster-big.cell-selected, 
.poster-small.cell-selected, 
.poster-top.cell-selected, 
.poster-bottom.cell-selected {
    border: 3px solid #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.poster-cell img, .poster-big img, .poster-small img, .poster-top img, .poster-bottom img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.poster-cell-placeholder {
    font-size: 32px;
    color: rgba(255,255,255,0.5);
}

.poster-cell-remove {
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

.poster-footer {
    padding: 16px;
    text-align: center;
    background: rgba(0,0,0,0.5);
}

.poster-text {
    font-size: 20px;
    font-weight: bold;
    color: white;
}

.poster-date {
    font-size: 14px;
    color: rgba(255,255,255,0.8);
    margin-top: 4px;
}

.poster-footer {
    padding: 16px;
    text-align: center;
    background: rgba(0,0,0,0.5);
}
.poster-footer-top-left {
    position: absolute;
    top: 20px;
    left: 20px;
    background: transparent;
}
.poster-footer-top-center {
    position: absolute;
    top: 20px;
    left: 0;
    right: 0;
    background: transparent;
}
.poster-footer-top-right {
    position: absolute;
    top: 20px;
    right: 20px;
    background: transparent;
}
.poster-footer-center {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    transform: translateY(-50%);
    background: transparent;
}
.poster-footer-bottom-left {
    position: absolute;
    bottom: 20px;
    left: 20px;
}
.poster-footer-bottom-right {
    position: absolute;
    bottom: 20px;
    right: 20px;
}
</style>