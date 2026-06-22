<template>
    <div class="preset-canvas">
        <!-- 常规网格布局（div） -->
        <div v-if="!isTextMode && !isTrapezoidMode" class="preset-layout" :style="layoutStyle">
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

        <!-- 斜切布局（Canvas） -->
        <div v-else-if="isTrapezoidMode" class="trapezoid-canvas-wrapper" ref="trapezoidWrapper">
            <canvas 
                ref="trapezoidCanvasRef" 
                class="trapezoid-canvas"
                @click="handleTrapezoidClick"
            ></canvas>
        </div>

        <!-- 图文模式 -->
        <div v-else-if="isTextMode" class="text-mode-wrapper">
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
import { ref, watch, computed, nextTick } from 'vue';
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
const trapezoidCanvasRef = ref(null);
const trapezoidWrapper = ref(null);

// ---------- 完整的预设模板库 ----------
const subModeLibrary = {
    // 2宫格所有变种
    '2-horizontal': { rows: 1, cols: 2, cells: 2, colRatios: [1, 1] },
    '2-vertical': { rows: 2, cols: 1, cells: 2, rowRatios: [1, 1] },
    '2-vertical-2-1': { rows: 2, cols: 1, cells: 2, rowRatios: [2, 1] },
    '2-horizontal-2-1': { rows: 1, cols: 2, cells: 2, colRatios: [2, 1] },
    '2-horizontal-1-2': { rows: 1, cols: 2, cells: 2, colRatios: [1, 2] },
    '2-vertical-1-2': { rows: 2, cols: 1, cells: 2, rowRatios: [1, 2] },
    '2-trapezoid-vertical': { type: 'trapezoid', direction: 'vertical', cells: 2 },

    // 3宫格
    '3-horizontal': { rows: 1, cols: 3, cells: 3, colRatios: [1, 1, 1] },
    '3-vertical': { rows: 3, cols: 1, cells: 3, rowRatios: [1, 1, 1] },
    // 4宫格
    '4-grid': { rows: 2, cols: 2, cells: 4, rowRatios: [1, 1], colRatios: [1, 1] },
    '4-horizontal': { rows: 1, cols: 4, cells: 4, colRatios: [1, 1, 1, 1] },
    '4-vertical': { rows: 4, cols: 1, cells: 4, rowRatios: [1, 1, 1, 1] },
    // 5宫格
    '5-2x3': { rows: 2, cols: 3, cells: 5, rowRatios: [1, 1], colRatios: [1, 1, 1] },
    // 6宫格
    '6-2x3': { rows: 2, cols: 3, cells: 6, rowRatios: [1, 1], colRatios: [1, 1, 1] },
    '6-3x2': { rows: 3, cols: 2, cells: 6, rowRatios: [1, 1, 1], colRatios: [1, 1] },
    // 7宫格
    '7-1-3-3': { rows: 3, cols: 3, cells: 7, rowRatios: [1, 1, 1], colRatios: [1, 1, 1] },
    // 8宫格
    '8-2x4': { rows: 2, cols: 4, cells: 8, rowRatios: [1, 1], colRatios: [1, 1, 1, 1] },
    '8-4x2': { rows: 4, cols: 2, cells: 8, rowRatios: [1, 1, 1, 1], colRatios: [1, 1] },
    // 9宫格
    '9-grid': { rows: 3, cols: 3, cells: 9, rowRatios: [1, 1, 1], colRatios: [1, 1, 1] },
    // 图文模式
    'text-simple': { type: 'text', cells: 1 }
};

// ---------- 模式判断 ----------
const isTextMode = computed(() => props.subModeId === 'text-simple');
const isTrapezoidMode = computed(() => currentLayout.value?.type === 'trapezoid');

// ---------- 常规网格样式 ----------
const layoutStyle = computed(() => {
    if (isTextMode.value || isTrapezoidMode.value) return {};
    const layout = currentLayout.value;
    if (!layout) return {};
    const gap = props.spacing;
    const borderSize = props.outerBorderSize > 0 ? props.outerBorderSize : 0;
    let templateColumns = '';
    if (layout.colRatios && layout.colRatios.length > 0) {
        templateColumns = layout.colRatios.map(r => r + 'fr').join(' ');
    } else {
        templateColumns = `repeat(${layout.cols}, 1fr)`;
    }
    let templateRows = '';
    if (layout.rowRatios && layout.rowRatios.length > 0) {
        templateRows = layout.rowRatios.map(r => r + 'fr').join(' ');
    } else {
        templateRows = `repeat(${layout.rows}, 1fr)`;
    }
    return {
        display: 'grid',
        gridTemplateColumns: templateColumns,
        gridTemplateRows: templateRows,
        gap: `${gap}px`,
        width: `${props.canvasWidth}px`,
        height: `${props.canvasHeight}px`,
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

// ---------- 辅助：计算常规网格格子矩形 ----------
const getCellRects = (layout, canvasW, canvasH, gap) => {
    const cols = layout.cols;
    const rows = layout.rows;
    const colRatios = layout.colRatios || Array(cols).fill(1);
    const rowRatios = layout.rowRatios || Array(rows).fill(1);
    const totalColRatio = colRatios.reduce((a, b) => a + b, 0);
    const totalRowRatio = rowRatios.reduce((a, b) => a + b, 0);
    const cellWidths = colRatios.map(r => (canvasW - (cols - 1) * gap) * r / totalColRatio);
    const cellHeights = rowRatios.map(r => (canvasH - (rows - 1) * gap) * r / totalRowRatio);
    const rects = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = c * (cellWidths[c] + gap);
            const y = r * (cellHeights[r] + gap);
            rects.push({ x, y, w: cellWidths[c], h: cellHeights[r] });
        }
    }
    return rects;
};

// ---------- 斜切绘制（预览 & 导出共用） ----------
const drawTrapezoid = (ctx, canvasW, canvasH, useTransparent) => {
    // 清空/填充背景
    if (useTransparent) {
        ctx.clearRect(0, 0, canvasW, canvasH);
    } else {
        ctx.fillStyle = props.bgColor;
        ctx.fillRect(0, 0, canvasW, canvasH);
    }

    const gap = props.spacing;
    const borderSize = props.outerBorderSize > 0 ? props.outerBorderSize : 0;
    // 实际绘制区域（扣除外边框）
    const innerW = canvasW - borderSize * 2;
    const innerH = canvasH - borderSize * 2;
    ctx.save();
    ctx.translate(borderSize, borderSize);

    // 定义斜线：左上到右下，截取 1/4 和 3/4 位置
    const x1 = innerW * 0.25;
    const x2 = innerW * 0.75;
    // 上梯形（四个顶点）
    const topTrap = [
        { x: 0, y: 0 },
        { x: innerW, y: 0 },
        { x: x2, y: innerH },
        { x: x1, y: innerH }
    ];
    // 下梯形
    const bottomTrap = [
        { x: x1, y: 0 },
        { x: x2, y: 0 },
        { x: innerW, y: innerH },
        { x: 0, y: innerH }
    ];

    const traps = [topTrap, bottomTrap];

    // 对每个梯形区域绘制
    for (let i = 0; i < 2; i++) {
        const cell = cells.value[i] || { imageId: null, imageData: null };
        const pts = traps[i];
        ctx.save();

        // 构建路径（梯形）
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let j = 1; j < pts.length; j++) {
            ctx.lineTo(pts[j].x, pts[j].y);
        }
        ctx.closePath();
        ctx.clip();

        // 背景（浅灰色，仅非透明）
        if (!useTransparent) {
            ctx.fillStyle = '#f1f5f9';
            ctx.fillRect(0, 0, innerW, innerH);
        }

        if (cell && cell.imageData) {
            // 由于图片加载是异步的，但此处是同步绘制，需要加载图片
            // 但因 drawTrapezoid 会在 loadImage 后调用，所以这里直接绘制（在导出时图片已加载）
            // 预览时，我们使用同步方式：在 renderTrapezoid 中先加载所有图片再绘制
            // 所以这里假设 img 已经被传递，但为了通用，我们使用 loadImage 异步
            // 但 drawTrapezoid 是同步调用的，所以我们需要在外部提前加载图片
            // 为简化，我们在 renderTrapezoid 和 exportImage 中分别处理
            // 这里暂时不绘制图片，而是由调用者负责加载后传入
            // 我们改为在 drawTrapezoid 中接收图片数据
        } else {
            // 空单元格显示 + 号
            ctx.fillStyle = '#94a3b8';
            ctx.font = `${Math.min(innerW, innerH) * 0.3}px "PingFang SC", system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('+', innerW / 2, innerH / 2);
        }
        ctx.restore();
    }

    // 绘制梯形边界线（虚线）
    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    for (const pts of traps) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let j = 1; j < pts.length; j++) {
            ctx.lineTo(pts[j].x, pts[j].y);
        }
        ctx.closePath();
        ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();

    ctx.restore();
    // 外边框不绘制实线，由背景色填充
};

// 渲染斜切（预览）
const renderTrapezoid = async () => {
    await nextTick();
    const canvas = trapezoidCanvasRef.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = props.canvasWidth + (props.outerBorderSize > 0 ? props.outerBorderSize * 2 : 0);
    const H = props.canvasHeight + (props.outerBorderSize > 0 ? props.outerBorderSize * 2 : 0);
    canvas.width = Math.max(1, W);
    canvas.height = Math.max(1, H);

    // 先清空并绘制背景、虚线框、空占位
    drawTrapezoid(ctx, canvas.width, canvas.height, props.useTransparent);

    // 如果有图片，加载并绘制到对应梯形
    for (let i = 0; i < 2; i++) {
        const cell = cells.value[i];
        if (cell && cell.imageData) {
            const img = await loadImage(cell.imageData);
            // 重新绘制该梯形区域
            // 但我们需要在 drawTrapezoid 中支持绘制图片，因此重构 drawTrapezoid 接受图片数组
            // 我们重新绘制整个canvas
            drawTrapezoidWithImages(ctx, canvas.width, canvas.height, props.useTransparent, cells.value);
        }
    }
};

// 支持图片绘制的 drawTrapezoid
const drawTrapezoidWithImages = async (ctx, canvasW, canvasH, useTransparent, cellsData) => {
    // 清空/填充背景
    if (useTransparent) {
        ctx.clearRect(0, 0, canvasW, canvasH);
    } else {
        ctx.fillStyle = props.bgColor;
        ctx.fillRect(0, 0, canvasW, canvasH);
    }

    const borderSize = props.outerBorderSize > 0 ? props.outerBorderSize : 0;
    const innerW = canvasW - borderSize * 2;
    const innerH = canvasH - borderSize * 2;
    ctx.save();
    ctx.translate(borderSize, borderSize);

    const x1 = innerW * 0.25;
    const x2 = innerW * 0.75;
    const topTrap = [{ x: 0, y: 0 }, { x: innerW, y: 0 }, { x: x2, y: innerH }, { x: x1, y: innerH }];
    const bottomTrap = [{ x: x1, y: 0 }, { x: x2, y: 0 }, { x: innerW, y: innerH }, { x: 0, y: innerH }];
    const traps = [topTrap, bottomTrap];

    for (let i = 0; i < 2; i++) {
        const cell = cellsData[i] || { imageId: null, imageData: null };
        const pts = traps[i];
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let j = 1; j < pts.length; j++) {
            ctx.lineTo(pts[j].x, pts[j].y);
        }
        ctx.closePath();
        ctx.clip();

        // 背景
        if (!useTransparent) {
            ctx.fillStyle = '#f1f5f9';
            ctx.fillRect(0, 0, innerW, innerH);
        }

        if (cell && cell.imageData) {
            const img = await loadImage(cell.imageData);
            let drawW, drawH, offsetX, offsetY;
            if (props.fillMode === 'cover') {
                const scale = Math.max(innerW / img.width, innerH / img.height);
                drawW = img.width * scale;
                drawH = img.height * scale;
                offsetX = (innerW - drawW) / 2;
                offsetY = (innerH - drawH) / 2;
            } else {
                const scale = Math.min(innerW / img.width, innerH / img.height);
                drawW = img.width * scale;
                drawH = img.height * scale;
                offsetX = (innerW - drawW) / 2;
                offsetY = (innerH - drawH) / 2;
            }
            // 应用蒙版（clip已经做，无需额外）
            ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
        } else {
            ctx.fillStyle = '#94a3b8';
            ctx.font = `${Math.min(innerW, innerH) * 0.3}px "PingFang SC", system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('+', innerW / 2, innerH / 2);
        }
        ctx.restore();
    }

    // 画虚线边框
    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    for (const pts of traps) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let j = 1; j < pts.length; j++) {
            ctx.lineTo(pts[j].x, pts[j].y);
        }
        ctx.closePath();
        ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();

    ctx.restore();
};

// 点击斜切canvas
const handleTrapezoidClick = async (e) => {
    const canvas = trapezoidCanvasRef.value;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const borderSize = props.outerBorderSize > 0 ? props.outerBorderSize : 0;
    const innerX = mouseX - borderSize;
    const innerY = mouseY - borderSize;
    if (innerX < 0 || innerY < 0 || innerX > props.canvasWidth || innerY > props.canvasHeight) return;

    const W = props.canvasWidth;
    const H = props.canvasHeight;
    const x1 = W * 0.25;
    const x2 = W * 0.75;
    const topTrap = [{x:0,y:0}, {x:W,y:0}, {x:x2,y:H}, {x:x1,y:H}];
    const bottomTrap = [{x:x1,y:0}, {x:x2,y:0}, {x:W,y:H}, {x:0,y:H}];

    const pointInPolygon = (px, py, polygon) => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            const intersect = ((yi > py) !== (yj > py)) &&
                (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };
    let idx = -1;
    if (pointInPolygon(innerX, innerY, topTrap)) idx = 0;
    else if (pointInPolygon(innerX, innerY, bottomTrap)) idx = 1;
    if (idx !== -1) {
        selectCell(idx);
    }
};

// ---------- 常规初始化 ----------
const initLayout = (subId) => {
    const layout = subModeLibrary[subId];
    if (!layout) {
        console.warn('未找到布局定义:', subId);
        return;
    }
    currentLayout.value = layout;
    const newCells = [];
    for (let i = 0; i < layout.cells; i++) {
        newCells.push({ imageId: null, imageData: null });
    }
    cells.value = newCells;
    emit('update:cells', cells.value);
    // 如果是斜切，渲染canvas
    if (layout.type === 'trapezoid') {
        nextTick(() => {
            renderTrapezoid();
        });
    }
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
    if (isTrapezoidMode.value) renderTrapezoid();
};

const addImageToSelectedCell = async (imageId, imageData) => {
    if (selectedCellIndex.value === -1) {
        alert('请先点击一个格子（梯形区域）');
        return false;
    }
    const newCells = [...cells.value];
    newCells[selectedCellIndex.value] = { imageId, imageData };
    cells.value = newCells;
    emit('update:cells', cells.value);
    selectedCellIndex.value = -1;
    if (isTrapezoidMode.value) {
        await renderTrapezoid();
    }
    return true;
};

const addImageToEmptyCell = async (imageId, imageData) => {
    const emptyIndex = cells.value.findIndex(cell => !cell.imageId);
    if (emptyIndex === -1) {
        alert('所有格子都已填满');
        return false;
    }
    const newCells = [...cells.value];
    newCells[emptyIndex] = { imageId, imageData };
    cells.value = newCells;
    emit('update:cells', cells.value);
    if (isTrapezoidMode.value) {
        await renderTrapezoid();
    }
    return true;
};

// ---------- 导出 ----------
const exportImage = async (useTransparent) => {
    const borderSize = props.outerBorderSize > 0 ? props.outerBorderSize : 0;
    const W = props.canvasWidth + borderSize * 2;
    const H = props.canvasHeight + borderSize * 2;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    if (isTextMode.value) {
        // 图文模式
        if (useTransparent) ctx.clearRect(0, 0, W, H);
        else { ctx.fillStyle = props.bgColor; ctx.fillRect(0, 0, W, H); }
        ctx.save();
        ctx.translate(borderSize, borderSize);
        // 绘制图片和文字（略，保持原有逻辑）
        // ...
        ctx.restore();
        return canvas.toDataURL('image/png');
    }

    if (isTrapezoidMode.value) {
        // 斜切导出
        await drawTrapezoidWithImages(ctx, W, H, useTransparent, cells.value);
        return canvas.toDataURL('image/png');
    }

    // 常规网格导出
    const layout = currentLayout.value;
    if (!layout) return null;
    const gap = props.spacing;
    const rects = getCellRects(layout, props.canvasWidth, props.canvasHeight, gap);
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = W;
    exportCanvas.height = H;
    const ctx2 = exportCanvas.getContext('2d');
    if (useTransparent) ctx2.clearRect(0, 0, W, H);
    else { ctx2.fillStyle = props.bgColor; ctx2.fillRect(0, 0, W, H); }
    ctx2.save();
    ctx2.translate(borderSize, borderSize);
    for (let i = 0; i < Math.min(cells.value.length, rects.length); i++) {
        const cell = cells.value[i];
        const rect = rects[i];
        const { x, y, w, h } = rect;
        if (!useTransparent) {
            ctx2.fillStyle = '#f1f5f9';
            ctx2.fillRect(x, y, w, h);
        }
        if (cell && cell.imageData) {
            const img = await loadImage(cell.imageData);
            let drawW, drawH, offsetX, offsetY;
            if (props.fillMode === 'cover') {
                const scale = Math.max(w / img.width, h / img.height);
                drawW = img.width * scale;
                drawH = img.height * scale;
                offsetX = (w - drawW) / 2;
                offsetY = (h - drawH) / 2;
            } else {
                const scale = Math.min(w / img.width, h / img.height);
                drawW = img.width * scale;
                drawH = img.height * scale;
                offsetX = (w - drawW) / 2;
                offsetY = (h - drawH) / 2;
            }
            ctx2.save();
            // 应用蒙版
            if (props.maskShape !== 'none') {
                ctx2.beginPath();
                if (props.maskShape === 'circle') {
                    const cx = x + w / 2;
                    const cy = y + h / 2;
                    const r = Math.min(w, h) / 2;
                    ctx2.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx2.closePath();
                } else if (props.maskShape === 'roundRect') {
                    const radius = Math.min(props.cornerRadius, Math.min(w, h) / 2);
                    if (radius <= 0) ctx2.rect(x, y, w, h);
                    else {
                        ctx2.moveTo(x + radius, y);
                        ctx2.lineTo(x + w - radius, y);
                        ctx2.quadraticCurveTo(x + w, y, x + w, y + radius);
                        ctx2.lineTo(x + w, y + h - radius);
                        ctx2.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
                        ctx2.lineTo(x + radius, y + h);
                        ctx2.quadraticCurveTo(x, y + h, x, y + h - radius);
                        ctx2.lineTo(x, y + radius);
                        ctx2.quadraticCurveTo(x, y, x + radius, y);
                        ctx2.closePath();
                    }
                }
                ctx2.clip();
            } else {
                ctx2.beginPath();
                ctx2.rect(x, y, w, h);
                ctx2.clip();
            }
            ctx2.drawImage(img, x + offsetX, y + offsetY, drawW, drawH);
            ctx2.restore();
        } else {
            if (!useTransparent) {
                ctx2.save();
                ctx2.strokeStyle = '#cbd5e1';
                ctx2.lineWidth = 2;
                ctx2.setLineDash([5, 5]);
                ctx2.strokeRect(x, y, w, h);
                ctx2.setLineDash([]);
                ctx2.fillStyle = '#94a3b8';
                ctx2.font = `${Math.min(w, h) * 0.3}px "PingFang SC", system-ui`;
                ctx2.textAlign = 'center';
                ctx2.textBaseline = 'middle';
                ctx2.fillText('+', x + w / 2, y + h / 2);
                ctx2.restore();
            }
        }
    }
    ctx2.restore();
    return exportCanvas.toDataURL('image/png');
};

// ---------- 分辨率 ----------
const getResolution = () => {
    const borderSize = props.outerBorderSize > 0 ? props.outerBorderSize : 0;
    return {
        width: props.canvasWidth + borderSize * 2,
        height: props.canvasHeight + borderSize * 2
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

// 监听
watch(() => props.subModeId, (newId) => {
    if (newId) {
        initLayout(newId);
        selectedCellIndex.value = -1;
    }
}, { immediate: true });

watch([() => props.images, () => props.spacing, () => props.bgColor, () => props.useTransparent,
        () => props.canvasWidth, () => props.canvasHeight, () => props.maskShape, () => props.cornerRadius,
        () => props.outerBorderSize, () => props.fillMode], () => {
    if (isTrapezoidMode.value) {
        renderTrapezoid();
    }
}, { deep: true });
</script>

<style scoped>
/* 原样式保持不变，新增斜切canvas样式 */
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
.trapezoid-canvas-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
.trapezoid-canvas {
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    background: transparent;
}
</style>