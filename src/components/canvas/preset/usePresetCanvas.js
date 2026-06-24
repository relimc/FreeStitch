// src/components/canvas/preset/usePresetCanvas.js

import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { loadImage } from '../utils/canvasHelpers.js';
import { presetLayouts } from './layouts.js';
import { drawEmptyCell, applyMask } from './renderHelpers.js';

export function usePresetCanvas(props, emit) {
    // ---------- 状态 ----------
    const cells = ref([]);
    const selectedCellIndex = ref(-1);
    const currentLayout = ref(null);
    const canvasRef = ref(null);

    const imageOffsets = ref(new Map());
    const imageCache = new Map();
    const deleteButtonRects = ref([]);

    // ---------- 计算属性 ----------
    const isTextMode = computed(() => props.subModeId === 'text-simple');
    const isTrapezoidMode = computed(() => currentLayout.value?.type === 'trapezoid');

    // ---------- 布局初始化 ----------
    const initLayout = (subId) => {
        const layout = presetLayouts[subId];
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
        imageOffsets.value.clear();
        imageCache.clear();
        renderCanvas();
    };

    // ---------- 计算格子矩形（支持比例，整数化） ----------
    const getCellRects = (layout, canvasW, canvasH, gap) => {
        const cols = layout.cols;
        const rows = layout.rows;
        const colRatios = layout.colRatios || Array(cols).fill(1);
        const rowRatios = layout.rowRatios || Array(rows).fill(1);
        const totalColRatio = colRatios.reduce((a, b) => a + b, 0);
        const totalRowRatio = rowRatios.reduce((a, b) => a + b, 0);
        // 计算每个单元格的宽高（减去间距）
        const cellWidths = colRatios.map(r => (canvasW - (cols - 1) * gap) * r / totalColRatio);
        const cellHeights = rowRatios.map(r => (canvasH - (rows - 1) * gap) * r / totalRowRatio);
        const rects = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // 累加宽度和高度，使用整数避免浮点误差
                let x = 0, y = 0;
                for (let i = 0; i < c; i++) {
                    x += cellWidths[i] + gap;
                }
                for (let i = 0; i < r; i++) {
                    y += cellHeights[i] + gap;
                }
                rects.push({
                    x: Math.round(x),
                    y: Math.round(y),
                    w: Math.round(cellWidths[c]),
                    h: Math.round(cellHeights[r])
                });
            }
        }
        return rects;
    };

    // ---------- 多边形包含检测（用于斜切） ----------
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

    // ---------- 绘制删除按钮 ----------
    const drawDeleteButton = (ctx, x, y, w, h) => {
        const btnSize = Math.min(20, Math.min(w, h) * 0.15);
        const btnX = x + w - btnSize - 4;
        const btnY = y + 4;
        const radius = btnSize / 2;
        const cx = btnX + radius;
        const cy = btnY + radius;

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#e74c3c';
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${btnSize * 0.7}px "Arial", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('×', cx, cy + 1);

        ctx.restore();

        return { x: btnX, y: btnY, w: btnSize, h: btnSize };
    };

    // ---------- 绘制斜切（横向梯形） ----------
    const drawTrapezoid = async (ctx, canvasW, canvasH, useTransparent, cellsData) => {
        if (useTransparent) {
            ctx.clearRect(0, 0, canvasW, canvasH);
        } else {
            ctx.fillStyle = props.bgColor;
            ctx.fillRect(0, 0, canvasW, canvasH);
        }

        const borderSize = Math.max(0, props.outerBorderSize);
        const innerW = canvasW - borderSize * 2;
        const innerH = canvasH - borderSize * 2;
        if (innerW <= 0 || innerH <= 0) return;

        ctx.save();
        ctx.translate(borderSize, borderSize);

        const x1 = innerW * 0.25;
        const x2 = innerW * 0.75;

        const leftTrap = [
            { x: 0, y: 0 },
            { x: x1, y: 0 },
            { x: x2, y: innerH },
            { x: 0, y: innerH }
        ];
        const rightTrap = [
            { x: x1, y: 0 },
            { x: innerW, y: 0 },
            { x: innerW, y: innerH },
            { x: x2, y: innerH }
        ];
        const traps = [leftTrap, rightTrap];
        window.__trapezoidPolys = traps;

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

            if (!useTransparent) {
                ctx.fillStyle = '#f1f5f9';
                ctx.fillRect(0, 0, innerW, innerH);
            }

            if (cell && cell.imageData) {
                let img = imageCache.get(cell.imageId);
                if (!img) {
                    img = await loadImage(cell.imageData);
                    imageCache.set(cell.imageId, img);
                }
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
                const off = imageOffsets.value.get(cell.imageId) || { offsetX: 0, offsetY: 0 };
                ctx.drawImage(img, offsetX + off.offsetX, offsetY + off.offsetY, drawW, drawH);
            } else {
                ctx.fillStyle = '#94a3b8';
                ctx.font = `${Math.min(innerW, innerH) * 0.3}px "PingFang SC", system-ui`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                let cx = 0, cy = 0;
                for (const p of pts) { cx += p.x; cy += p.y; }
                cx /= pts.length;
                cy /= pts.length;
                ctx.fillText('+', cx, cy);
            }
            ctx.restore();
        }

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

    // ---------- 绘制图文模式 ----------
    const drawTextMode = async (ctx, canvasW, canvasH, useTransparent) => {
        if (useTransparent) {
            ctx.clearRect(0, 0, canvasW, canvasH);
        } else {
            ctx.fillStyle = props.bgColor;
            ctx.fillRect(0, 0, canvasW, canvasH);
        }
        const borderSize = Math.max(0, props.outerBorderSize);
        ctx.save();
        ctx.translate(borderSize, borderSize);

        const cell = cells.value[0];
        if (cell && cell.imageData) {
            let img = imageCache.get(cell.imageId);
            if (!img) {
                img = await loadImage(cell.imageData);
                imageCache.set(cell.imageId, img);
            }
            const imgH = props.canvasHeight * 0.7;
            const imgW = (img.width / img.height) * imgH;
            const imgX = (props.canvasWidth - imgW) / 2;
            ctx.save();
            if (props.maskShape !== 'none') {
                applyMask(ctx, props.maskShape, props.cornerRadius, imgX, 0, imgW, imgH);
            }
            ctx.drawImage(img, imgX, 0, imgW, imgH);
            ctx.restore();
        }

        ctx.fillStyle = props.posterTextColor;
        ctx.font = `${props.posterFontSize}px "PingFang SC"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(props.posterText, props.canvasWidth / 2, props.canvasHeight - 30);
        if (props.posterDateFormat !== 'none') {
            ctx.font = `14px sans-serif`;
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.textBaseline = 'bottom';
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            let dateStr = '';
            if (props.posterDateFormat === 'YYYY-MM-DD') dateStr = `${y}-${m}-${d}`;
            else if (props.posterDateFormat === 'YYYY/MM/DD') dateStr = `${y}/${m}/${d}`;
            else if (props.posterDateFormat === 'DD/MM/YYYY') dateStr = `${d}/${m}/${y}`;
            else if (props.posterDateFormat === 'MM/DD/YYYY') dateStr = `${m}/${d}/${y}`;
            ctx.fillText(dateStr, props.canvasWidth / 2, props.canvasHeight - 8);
        }
        ctx.restore();
    };

    // ---------- 主渲染 ----------
    let renderRequestId = null;

    const renderCanvas = async () => {
        if (renderRequestId) {
            cancelAnimationFrame(renderRequestId);
            renderRequestId = null;
        }

        return new Promise((resolve) => {
            renderRequestId = requestAnimationFrame(async () => {
                const canvas = canvasRef.value;
                if (!canvas) {
                    resolve();
                    return;
                }
                const ctx = canvas.getContext('2d');

                const borderSize = Math.max(0, props.outerBorderSize);
                const W = props.canvasWidth + borderSize * 2;
                const H = props.canvasHeight + borderSize * 2;
                canvas.width = Math.max(1, W);
                canvas.height = Math.max(1, H);

                deleteButtonRects.value = [];

                if (isTextMode.value) {
                    await drawTextMode(ctx, W, H, props.useTransparent);
                } else if (isTrapezoidMode.value) {
                    await drawTrapezoid(ctx, W, H, props.useTransparent, cells.value);
                } else {
                    const layout = currentLayout.value;
                    if (!layout) {
                        resolve();
                        return;
                    }
                    const gap = props.spacing;
                    const rects = getCellRects(layout, props.canvasWidth, props.canvasHeight, gap);

                    if (props.useTransparent) {
                        ctx.clearRect(0, 0, W, H);
                    } else {
                        ctx.fillStyle = props.bgColor;
                        ctx.fillRect(0, 0, W, H);
                    }

                    ctx.save();
                    ctx.translate(borderSize, borderSize);

                    // 循环绘制每个格子
                    for (let i = 0; i < Math.min(cells.value.length, rects.length); i++) {
                        const cell = cells.value[i];
                        const rect = rects[i];
                        const { x, y, w, h } = rect;

                        // 绘制单元格背景
                        if (!props.useTransparent) {
                            ctx.fillStyle = '#f1f5f9';
                            ctx.fillRect(x, y, w, h);
                        }

                        // 如果有图片，绘制图片
                        if (cell && cell.imageData) {
                            let img = imageCache.get(cell.imageId);
                            if (!img) {
                                img = await loadImage(cell.imageData);
                                imageCache.set(cell.imageId, img);
                            }
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

                            const off = imageOffsets.value.get(cell.imageId) || { offsetX: 0, offsetY: 0 };
                            let maxOffsetX = 0, maxOffsetY = 0;
                            if (props.fillMode === 'cover') {
                                maxOffsetX = Math.max(0, drawW - w);
                                maxOffsetY = Math.max(0, drawH - h);
                            } else {
                                maxOffsetX = Math.max(0, w - drawW);
                                maxOffsetY = Math.max(0, h - drawH);
                            }
                            const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, off.offsetX));
                            const clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, off.offsetY));
                            if (clampedX !== off.offsetX || clampedY !== off.offsetY) {
                                imageOffsets.value.set(cell.imageId, { offsetX: clampedX, offsetY: clampedY });
                            }

                            const drawX = x + offsetX + clampedX;
                            const drawY = y + offsetY + clampedY;

                            ctx.save();
                            ctx.beginPath();
                            ctx.rect(x, y, w, h);
                            ctx.clip();

                            if (props.maskShape !== 'none') {
                                applyMask(ctx, props.maskShape, props.cornerRadius, x, y, w, h);
                            }

                            ctx.drawImage(img, drawX, drawY, drawW, drawH);
                            ctx.restore();

                            // 绘制删除按钮
                            const btnRect = drawDeleteButton(ctx, x, y, w, h);
                            deleteButtonRects.value.push({
                                index: i,
                                x: btnRect.x,
                                y: btnRect.y,
                                w: btnRect.w,
                                h: btnRect.h
                            });
                        } else {
                            drawEmptyCell(ctx, x, y, w, h, props.useTransparent);
                        }

                        // 高亮选中的格子
                        if (selectedCellIndex.value === i) {
                            ctx.save();
                            ctx.strokeStyle = '#e74c3c';
                            ctx.lineWidth = 3;
                            ctx.setLineDash([]);
                            ctx.strokeRect(x, y, w, h);
                            ctx.restore();
                        }
                    }

                    ctx.restore();
                }

                renderRequestId = null;
                resolve();
            });
        });
    };

    // ---------- 拖拽 ----------
    let isDragging = false;
    let dragTargetId = null;
    let dragStartX = 0, dragStartY = 0;
    let startOffsetX = 0, startOffsetY = 0;

    const getCanvasCoords = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    // ---------- 点击检测 ----------
    const getCellIndexFromPoint = (x, y) => {
        const borderSize = Math.max(0, props.outerBorderSize);
        const innerX = x - borderSize;
        const innerY = y - borderSize;
        if (innerX < 0 || innerY < 0) return -1;

        const layout = currentLayout.value;
        if (!layout) return -1;

        // 斜切模式使用多边形检测
        if (isTrapezoidMode.value) {
            const polys = window.__trapezoidPolys;
            if (!polys) return -1;
            for (let i = 0; i < polys.length; i++) {
                if (pointInPolygon(innerX, innerY, polys[i])) {
                    return i;
                }
            }
            return -1;
        }

        // 常规网格
        const gap = props.spacing;
        const rects = getCellRects(layout, props.canvasWidth, props.canvasHeight, gap);
        // 容差2px，避免浮点误差
        const tolerance = 2;
        for (let i = 0; i < rects.length; i++) {
            const r = rects[i];
            if (innerX >= r.x - tolerance && innerX <= r.x + r.w + tolerance &&
                innerY >= r.y - tolerance && innerY <= r.y + r.h + tolerance) {
                return i;
            }
        }
        return -1;
    };

    const getDeleteButtonIndex = (x, y) => {
        for (const rect of deleteButtonRects.value) {
            if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
                return rect.index;
            }
        }
        return -1;
    };

    // ---------- 拖拽事件绑定 ----------
    const setupDrag = (canvas) => {
        const onMouseDown = (e) => {
            const { x, y } = getCanvasCoords(e, canvas);
            const delIdx = getDeleteButtonIndex(x, y);
            if (delIdx !== -1) return; // 由主组件处理删除
            const idx = getCellIndexFromPoint(x, y);
            if (idx === -1) return;
            const cell = cells.value[idx];
            if (!cell || !cell.imageData) return;
            const off = imageOffsets.value.get(cell.imageId);
            if (!off) return;

            isDragging = true;
            dragTargetId = cell.imageId;
            dragStartX = x;
            dragStartY = y;
            startOffsetX = off.offsetX;
            startOffsetY = off.offsetY;
            canvas.style.cursor = 'grabbing';
            e.preventDefault();
        };

        const onMouseMove = (e) => {
            if (!isDragging || dragTargetId === null) return;
            const { x, y } = getCanvasCoords(e, canvas);
            const deltaX = x - dragStartX;
            const deltaY = y - dragStartY;
            const off = imageOffsets.value.get(dragTargetId);
            if (!off) return;

            off.offsetX = startOffsetX + deltaX;
            off.offsetY = startOffsetY + deltaY;
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

        return { onMouseDown, onMouseMove, onMouseUp };
    };

    let cleanupDrag = null;

    onMounted(() => {
        if (canvasRef.value) {
            cleanupDrag = setupDrag(canvasRef.value);
        }
    });

    onUnmounted(() => {
        if (cleanupDrag && canvasRef.value) {
            canvasRef.value.removeEventListener('mousedown', cleanupDrag.onMouseDown);
            document.removeEventListener('mousemove', cleanupDrag.onMouseMove);
            document.removeEventListener('mouseup', cleanupDrag.onMouseUp);
        }
        if (renderRequestId) {
            cancelAnimationFrame(renderRequestId);
            renderRequestId = null;
        }
        delete window.__trapezoidPolys;
    });

    // ---------- 对外接口 ----------
    const selectCell = (idx) => {
        selectedCellIndex.value = idx;
        emit('select-cell', idx);
        renderCanvas();
    };

    const removeCellImage = (idx) => {
        const newCells = [...cells.value];
        newCells[idx] = { imageId: null, imageData: null };
        cells.value = newCells;
        emit('update:cells', cells.value);
        if (selectedCellIndex.value === idx) selectedCellIndex.value = -1;
        renderCanvas();
    };

    const addImageToSelectedCell = async (imageId, imageData) => {
        if (selectedCellIndex.value === -1) {
            alert('请先点击一个格子');
            return false;
        }
        const newCells = [...cells.value];
        newCells[selectedCellIndex.value] = { imageId, imageData };
        cells.value = newCells;
        emit('update:cells', cells.value);
        if (!imageOffsets.value.has(imageId)) {
            imageOffsets.value.set(imageId, { offsetX: 0, offsetY: 0 });
        }
        selectedCellIndex.value = -1;
        await renderCanvas();
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
        if (!imageOffsets.value.has(imageId)) {
            imageOffsets.value.set(imageId, { offsetX: 0, offsetY: 0 });
        }
        await renderCanvas();
        return true;
    };

    const exportImage = async (useTransparent) => {
        const canvas = document.createElement('canvas');
        const borderSize = Math.max(0, props.outerBorderSize);
        canvas.width = props.canvasWidth + borderSize * 2;
        canvas.height = props.canvasHeight + borderSize * 2;
        const ctx = canvas.getContext('2d');

        if (isTextMode.value) {
            await drawTextMode(ctx, canvas.width, canvas.height, useTransparent);
        } else if (isTrapezoidMode.value) {
            await drawTrapezoid(ctx, canvas.width, canvas.height, useTransparent, cells.value);
        } else {
            const layout = currentLayout.value;
            if (!layout) return null;
            const gap = props.spacing;
            const rects = getCellRects(layout, props.canvasWidth, props.canvasHeight, gap);
            if (useTransparent) ctx.clearRect(0, 0, canvas.width, canvas.height);
            else { ctx.fillStyle = props.bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height); }
            ctx.save();
            ctx.translate(borderSize, borderSize);
            for (let i = 0; i < Math.min(cells.value.length, rects.length); i++) {
                const cell = cells.value[i];
                const rect = rects[i];
                const { x, y, w, h } = rect;
                if (!useTransparent) {
                    ctx.fillStyle = '#f1f5f9';
                    ctx.fillRect(x, y, w, h);
                }
                if (cell && cell.imageData) {
                    let img = imageCache.get(cell.imageId);
                    if (!img) {
                        img = await loadImage(cell.imageData);
                        imageCache.set(cell.imageId, img);
                    }
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
                    const off = imageOffsets.value.get(cell.imageId) || { offsetX: 0, offsetY: 0 };
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(x, y, w, h);
                    ctx.clip();
                    if (props.maskShape !== 'none') {
                        applyMask(ctx, props.maskShape, props.cornerRadius, x, y, w, h);
                    }
                    ctx.drawImage(img, x + offsetX + off.offsetX, y + offsetY + off.offsetY, drawW, drawH);
                    ctx.restore();
                } else {
                    drawEmptyCell(ctx, x, y, w, h, useTransparent);
                }
            }
            ctx.restore();
        }
        return canvas.toDataURL('image/png');
    };

    const getResolution = () => {
        const borderSize = Math.max(0, props.outerBorderSize);
        return {
            width: props.canvasWidth + borderSize * 2,
            height: props.canvasHeight + borderSize * 2
        };
    };

    const hasImages = () => cells.value.some(c => c.imageId);

    // ---------- 监听 ----------
    watch(() => props.subModeId, (newId) => {
        if (newId) {
            initLayout(newId);
            selectedCellIndex.value = -1;
        }
    }, { immediate: true });

    watch([() => props.spacing, () => props.bgColor, () => props.useTransparent,
        () => props.canvasWidth, () => props.canvasHeight, () => props.maskShape,
        () => props.cornerRadius, () => props.outerBorderSize, () => props.fillMode,
        () => props.posterText, () => props.posterDateFormat, () => props.posterTextColor,
        () => props.posterFontSize], () => {
        if (currentLayout.value) {
            renderCanvas();
        }
    }, { deep: true });

    return {
        cells,
        selectedCellIndex,
        canvasRef,
        initLayout,
        selectCell,
        removeCellImage,
        addImageToSelectedCell,
        addImageToEmptyCell,
        exportImage,
        getResolution,
        hasImages,
        renderCanvas,
        getCellIndexFromPoint,
        getDeleteButtonIndex,
        isTextMode,
        isTrapezoidMode,
    };
}