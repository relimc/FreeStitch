<template>
    <div class="grid-canvas-container" ref="containerRef">
        <canvas ref="canvasRef" class="preview-canvas"></canvas>
    </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { loadImage, calculateFit } from './utils/canvasHelpers.js';

const props = defineProps({
    images: { type: Array, default: () => [] },
    spacing: { type: Number, default: 12 },
    bgColor: { type: String, default: '#ffffff' },
    useTransparent: { type: Boolean, default: true },
    gridRows: { type: Number, default: 3 },
    gridCols: { type: Number, default: 3 },
    gridLayout: { type: String, default: 'grid' },
    cellWidth: { type: Number, default: 0 },
    cellHeight: { type: Number, default: 0 },
    fillMode: { type: String, default: 'cover' },
    maskShape: { type: String, default: 'none' },
    cornerRadius: { type: Number, default: 20 },
    outerBorderSize: { type: Number, default: 0 }
});

const canvasRef = ref(null);
const containerRef = ref(null);
const emit = defineEmits(['update:images', 'render-complete']);

// ---------- 图片偏移状态 ----------
// 使用 Map 存储每个图片的偏移量 { offsetX, offsetY }
const imageOffsets = ref(new Map());

// 初始化偏移量
const initOffsets = (images) => {
    const currentIds = new Set(images.map(i => i.id));
    // 删除不再存在的图片偏移
    for (let key of imageOffsets.value.keys()) {
        if (!currentIds.has(key)) {
            imageOffsets.value.delete(key);
        }
    }
    // 为新图片添加偏移（默认0）
    images.forEach(img => {
        if (!imageOffsets.value.has(img.id)) {
            imageOffsets.value.set(img.id, { offsetX: 0, offsetY: 0 });
        }
    });
};

// ---------- 拖拽状态 ----------
let isDragging = false;
let dragTargetId = null;
let dragStartX = 0, dragStartY = 0;
let startOffsetX = 0, startOffsetY = 0;

// ---------- 计算格子信息 ----------
const getGridInfo = () => {
    let rows = props.gridRows, cols = props.gridCols;
    if (props.gridLayout === 'horizontal') { rows = 1; cols = Math.max(props.gridCols, 1); }
    else if (props.gridLayout === 'vertical') { cols = 1; rows = Math.max(props.gridRows, 1); }

    let cellW = props.cellWidth;
    let cellH = props.cellHeight;
    if (!cellW || cellW <= 0) cellW = 200;
    if (!cellH || cellH <= 0) cellH = 200;

    // 如果有图片，根据图片调整（但用户指定优先）
    // 这里只返回基础信息，实际渲染时再计算尺寸
    return { rows, cols, cellW, cellH };
};

// ---------- 渲染 ----------
const renderCanvas = async () => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // 1. 确定行列数
    let rows = props.gridRows, cols = props.gridCols;
    if (props.gridLayout === 'horizontal') { rows = 1; cols = Math.max(props.gridCols, 1); }
    else if (props.gridLayout === 'vertical') { cols = 1; rows = Math.max(props.gridRows, 1); }

    // 2. 单元格尺寸
    let cellW = props.cellWidth;
    let cellH = props.cellHeight;
    if (!cellW || cellW <= 0) cellW = 200;
    if (!cellH || cellH <= 0) cellH = 200;

    // 3. 加载图片
    let loadedImages = [];
    let hasImages = props.images && props.images.length > 0;
    if (hasImages) {
        for (const item of props.images) {
            const img = await loadImage(item.dataURL);
            loadedImages.push({ img, origW: item.width, origH: item.height, id: item.id });
        }
        // 如果用户未指定单元格尺寸，则根据图片自动计算
        if (!props.cellWidth || props.cellWidth <= 0) {
            let maxW = 0;
            for (const item of loadedImages) maxW = Math.max(maxW, item.origW);
            cellW = maxW > 0 ? maxW : 200;
        }
        if (!props.cellHeight || props.cellHeight <= 0) {
            let maxH = 0;
            for (const item of loadedImages) maxH = Math.max(maxH, item.origH);
            cellH = maxH > 0 ? maxH : 200;
        }
        if (props.gridLayout === 'horizontal') {
            rows = 1;
            cols = loadedImages.length;
        } else if (props.gridLayout === 'vertical') {
            cols = 1;
            rows = loadedImages.length;
        }
    }

    // 4. 计算画布尺寸
    const gap = props.spacing;
    const borderSize = Math.max(0, props.outerBorderSize);
    const contentWidth = cols * cellW + (cols - 1) * gap;
    const contentHeight = rows * cellH + (rows - 1) * gap;
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

    // 5. 绘制网格
    const totalCells = rows * cols;
    // 初始化偏移（确保所有图片都有偏移）
    initOffsets(props.images);

    for (let i = 0; i < totalCells; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = col * (cellW + gap);
        const y = row * (cellH + gap);

        // 单元格背景
        if (!props.useTransparent) {
            ctx.fillStyle = '#f1f5f9';
            ctx.fillRect(x, y, cellW, cellH);
        }

        const imgData = (hasImages && i < loadedImages.length) ? loadedImages[i] : null;

        if (imgData) {
            // 计算图片绘制尺寸（基于 fillMode）
            const { drawW, drawH, offsetX: fitOffsetX, offsetY: fitOffsetY } = calculateFit(
                imgData.origW, imgData.origH,
                cellW, cellH,
                props.fillMode
            );
            // 注意：calculateFit 返回的是相对于单元格的偏移（留白），我们在此基础上增加用户拖拽偏移
            const off = imageOffsets.value.get(imgData.id) || { offsetX: 0, offsetY: 0 };
            // 应用用户偏移
            const finalOffsetX = fitOffsetX + off.offsetX;
            const finalOffsetY = fitOffsetY + off.offsetY;

            // 限制偏移范围，防止图片露出空白（对于 cover/contain 模式）
            // 对于 cover，图片应始终覆盖单元格，所以偏移不能导致边缘露出
            // 对于 contain，图片完全可见，偏移可能导致留白移动，但也可以限制
            // 我们统一限制：偏移后图片仍完全覆盖单元格（即图片边缘不能进入单元格内部）
            // 但 cover 模式下图片尺寸 >= 单元格，所以可移动范围是 (drawW - cellW) 和 (drawH - cellH)
            // 如果 drawW >= cellW 且 drawH >= cellH，则限制偏移范围
            // 如果 drawW < cellW 或 drawH < cellH（contain 模式可能出现），则允许图片在单元格内移动，但图片不能完全移出
            // 简化：限制偏移使得图片的四个角不能同时露出
            // 通用方法：限制偏移使得图片至少覆盖单元格
            // 但为了更直观，我们允许用户拖拽到任意位置，只要图片边缘不进入单元格内部（即图片始终完全覆盖单元格）
            // 这个限制比较复杂，我们简单处理：允许任意偏移，但不允许图片完全移出（至少覆盖一部分）
            // 更安全的方式：限制偏移使得图片在单元格内可见面积最大
            // 我们采用较宽松的限制：允许偏移，但确保图片与单元格有重叠
            // 这需要计算图片与单元格的相交区域，如果相交区域为0则限制
            // 为简化实现，我们使用如下边界：
            // 对于 cover 模式，偏移范围在 (drawW - cellW) 和 (drawH - cellH) 内
            // 对于 contain 模式，偏移范围在 (drawW + cellW) 和 (drawH + cellH) 内？实际上 contain 图片小于等于单元格，可以任意移动，但可能出现留白，我们允许
            // 所以我们以更通用的方式：偏移量使得图片至少覆盖单元格的 10% 面积？太复杂。
            // 我们暂时采用简单限制：覆盖模式，偏移范围限制在 (drawW - cellW) 和 (drawH - cellH) 内，如果 drawW < cellW 则偏移范围为0（即不能移动）
            // 对于 contain，因为图片通常小于单元格，限制偏移不能超过 (cellW - drawW) 和 (cellH - drawH) ？那样图片就会固定在角落，不符合拖拽意图。
            // 我决定：对于所有模式，用户拖拽的偏移量不受限制（但为防图片完全移出，我们可以限制偏移使得图片至少与单元格有重叠）
            // 更简单：取消边界限制，让用户自由拖拽，即使图片完全移出也没关系（但用户可以通过拖拽回来）
            // 但为了体验，我们限制偏移使得图片始终可见一部分（即图片与单元格的交集非空）
            // 计算限制：偏移不能使得图片完全移出单元格。
            // 对于 cover，图片尺寸 >= 单元格，只要偏移在 (drawW - cellW) 和 (drawH - cellH) 内，图片就完全覆盖单元格。
            // 对于 contain，图片尺寸 <= 单元格，偏移在 (cellW - drawW) 和 (cellH - drawH) 内，图片完全在单元格内。
            // 我们统一采用：偏移范围在 (drawW - cellW) 到 (cellW - drawW) 之间？这适用于两种模式：
            // 最大偏移 = max(drawW, cellW) - min(drawW, cellW) ？
            // 实际上，我们希望偏移后的图片能够展示任意部分，但保留一定的可视区域。
            // 我决定采用通用算法：限制偏移使得图片的至少一个像素在单元格内。
            // 实现：计算图片的左边界、右边界、上边界、下边界，如果所有边界都在单元格外部，则限制。
            // 但这样计算复杂，我们采用简单范围限制：偏移范围在 -(drawW - cellW) 到 (drawW - cellW) 之间，但仅当 drawW > cellW 时有效。
            // 对于 contain，drawW < cellW，则范围是 -(cellW - drawW) 到 (cellW - drawW)，这样图片可以在单元格内自由移动，但不会完全移出（因为图片小于单元格，移出后就没有内容了）
            // 但实际上 contain 模式用户可能希望图片在单元格内移动，但不希望图片完全移出，所以限制偏移使得图片完全在单元格内是合理的。
            // 我们区分模式：
            // - 对于 cover：偏移范围在 ±(drawW - cellW) 和 ±(drawH - cellH) 内（图片必须覆盖单元格）
            // - 对于 contain：偏移范围在 ±(cellW - drawW) 和 ±(cellH - drawH) 内（图片完全在单元格内）
            // 但用户可能希望 contain 模式下也能拖拽出留白，但这样会显示背景色，可能不是用户想要的，但可以允许。
            // 为了简化，我们不区分模式，统一使用：偏移范围在 -(Math.max(drawW, cellW) - Math.min(drawW, cellW)) 到 +(Math.max(drawW, cellW) - Math.min(drawW, cellW))
            // 这样对于 cover 模式，范围是 ±(drawW - cellW)，对于 contain 模式，范围是 ±(cellW - drawW)
            // 但这样 contain 模式下图片仍然完全在单元格内，不能超出。
            // 我们直接使用：偏移范围在 -(drawW) 到 (drawW) 和 -(drawH) 到 (drawH)？这样图片可能完全移出。
            // 为了安全且简单，我们采用如下边界限制：
            // 限制偏移使得图片的至少 50% 面积在单元格内？太复杂。
            // 我决定，我们允许用户无限制拖拽，但提供一个“重置”按钮？不，用户希望的是展示想要的区域，所以最好有边界，避免图片完全消失。
            // 因此，我采取保守策略：对于 cover 模式，限制偏移范围在 (drawW - cellW) 和 (drawH - cellH) 内（图片完全覆盖单元格）
            // 对于 contain 模式，限制偏移范围在 (cellW - drawW) 和 (cellH - drawH) 内（图片完全在单元格内，可移动展示不同部分）
            // 这样用户可以在 contain 模式下看到图片的不同部分（如果图片小于单元格，移动会显示留白，但至少不会移出）。
            // 我们使用 fillMode 来判断：
            let maxOffsetX = 0, maxOffsetY = 0;
            if (props.fillMode === 'cover') {
                // 图片必须覆盖单元格，所以偏移不能使图片边缘进入单元格内部
                maxOffsetX = Math.max(0, drawW - cellW);
                maxOffsetY = Math.max(0, drawH - cellH);
            } else { // contain
                // 图片必须完全在单元格内，所以偏移不能使图片边缘超出单元格
                maxOffsetX = Math.max(0, cellW - drawW);
                maxOffsetY = Math.max(0, cellH - drawH);
            }
            // 应用限制
            let clampedOffsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, off.offsetX));
            let clampedOffsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, off.offsetY));
            if (clampedOffsetX !== off.offsetX || clampedOffsetY !== off.offsetY) {
                imageOffsets.value.set(imgData.id, { offsetX: clampedOffsetX, offsetY: clampedOffsetY });
            }

            const drawX = x + fitOffsetX + clampedOffsetX;
            const drawY = y + fitOffsetY + clampedOffsetY;

            ctx.save();
            // 裁剪单元格区域
            ctx.beginPath();
            ctx.rect(x, y, cellW, cellH);
            ctx.clip();

            // 应用蒙版
            if (props.maskShape !== 'none') {
                ctx.save();
                if (props.maskShape === 'circle') {
                    const cx = x + cellW / 2;
                    const cy = y + cellH / 2;
                    const r = Math.min(cellW, cellH) / 2;
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.clip();
                } else if (props.maskShape === 'roundRect') {
                    const radius = Math.min(props.cornerRadius, Math.min(cellW, cellH) / 2);
                    ctx.beginPath();
                    ctx.moveTo(x + radius, y);
                    ctx.lineTo(x + cellW - radius, y);
                    ctx.quadraticCurveTo(x + cellW, y, x + cellW, y + radius);
                    ctx.lineTo(x + cellW, y + cellH - radius);
                    ctx.quadraticCurveTo(x + cellW, y + cellH, x + cellW - radius, y + cellH);
                    ctx.lineTo(x + radius, y + cellH);
                    ctx.quadraticCurveTo(x, y + cellH, x, y + cellH - radius);
                    ctx.lineTo(x, y + radius);
                    ctx.quadraticCurveTo(x, y, x + radius, y);
                    ctx.closePath();
                    ctx.clip();
                }
            }

            ctx.drawImage(imgData.img, drawX, drawY, drawW, drawH);

            if (props.maskShape !== 'none') {
                ctx.restore();
            }
            ctx.restore();
        } else {
            // 空单元格绘制虚线框和加号
            ctx.save();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(x, y, cellW, cellH);
            ctx.setLineDash([]);
            ctx.fillStyle = '#94a3b8';
            ctx.font = `${Math.min(cellW, cellH) * 0.3}px "PingFang SC", system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('+', x + cellW / 2, y + cellH / 2);
            ctx.restore();
        }
    }

    ctx.restore();

    emit('render-complete');
};

// ---------- 拖拽事件绑定 ----------
const setupDragEvents = () => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const getCanvasCoords = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    // 检测点击到哪个格子，返回图片id或null
    const getTargetImageId = (x, y) => {
        // 计算行列
        const borderSize = Math.max(0, props.outerBorderSize);
        const innerX = x - borderSize;
        const innerY = y - borderSize;
        if (innerX < 0 || innerY < 0) return null;

        let rows = props.gridRows, cols = props.gridCols;
        if (props.gridLayout === 'horizontal') { rows = 1; cols = Math.max(props.gridCols, 1); }
        else if (props.gridLayout === 'vertical') { cols = 1; rows = Math.max(props.gridRows, 1); }

        let cellW = props.cellWidth;
        let cellH = props.cellHeight;
        if (!cellW || cellW <= 0) cellW = 200;
        if (!cellH || cellH <= 0) cellH = 200;

        const gap = props.spacing;
        // 计算格子索引
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x1 = c * (cellW + gap);
                const y1 = r * (cellH + gap);
                const x2 = x1 + cellW;
                const y2 = y1 + cellH;
                if (innerX >= x1 && innerX <= x2 && innerY >= y1 && innerY <= y2) {
                    const idx = r * cols + c;
                    const images = props.images;
                    if (idx < images.length) {
                        return images[idx].id;
                    }
                }
            }
        }
        return null;
    };

    const onMouseDown = (e) => {
        const { x, y } = getCanvasCoords(e);
        const targetId = getTargetImageId(x, y);
        if (!targetId) return;
        const off = imageOffsets.value.get(targetId);
        if (!off) return;

        isDragging = true;
        dragTargetId = targetId;
        dragStartX = x;
        dragStartY = y;
        startOffsetX = off.offsetX;
        startOffsetY = off.offsetY;
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
    };

    const onMouseMove = (e) => {
        if (!isDragging || dragTargetId === null) return;
        const { x, y } = getCanvasCoords(e);
        const deltaX = x - dragStartX;
        const deltaY = y - dragStartY;
        const off = imageOffsets.value.get(dragTargetId);
        if (!off) return;

        // 计算新的偏移（暂不限制，由渲染时限制）
        let newOffsetX = startOffsetX + deltaX;
        let newOffsetY = startOffsetY + deltaY;

        // 更新偏移
        off.offsetX = newOffsetX;
        off.offsetY = newOffsetY;
        // 重新渲染
        renderCanvas();
        e.preventDefault();
    };

    const onMouseUp = () => {
        if (isDragging) {
            isDragging = false;
            dragTargetId = null;
            canvas.style.cursor = 'default';
        }
    };

    canvas.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    // 保存引用以便清理
    return { onMouseDown, onMouseMove, onMouseUp };
};

let cleanupDrag = null;

onMounted(() => {
    cleanupDrag = setupDragEvents();
});

onUnmounted(() => {
    if (cleanupDrag) {
        const canvas = canvasRef.value;
        if (canvas) {
            canvas.removeEventListener('mousedown', cleanupDrag.onMouseDown);
            document.removeEventListener('mousemove', cleanupDrag.onMouseMove);
            document.removeEventListener('mouseup', cleanupDrag.onMouseUp);
        }
    }
});

// ---------- 导出 ----------
const exportImage = async (useTransparent) => {
    await renderCanvas();
    return canvasRef.value?.toDataURL('image/png');
};

const getResolution = () => {
    const canvas = canvasRef.value;
    if (canvas && canvas.width > 0 && canvas.height > 0) {
        return { width: canvas.width, height: canvas.height };
    }
    return { width: 600, height: 400 };
};

// ---------- 监听变化 ----------
watch([() => props.images, () => props.spacing, () => props.bgColor, () => props.useTransparent,
        () => props.gridRows, () => props.gridCols, () => props.gridLayout,
        () => props.cellWidth, () => props.cellHeight, () => props.fillMode,
        () => props.maskShape, () => props.cornerRadius, () => props.outerBorderSize], () => {
    nextTick(() => renderCanvas());
}, { deep: true, immediate: true });

defineExpose({ exportImage, getResolution });
</script>

<style scoped>
.grid-canvas-container {
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
    cursor: default;
}
</style>