// src/components/canvas/preset/usePresetInteraction.js

export function usePresetInteraction(props, state, renderFn) {
    const {
        cells,
        imageOffsets,
        deleteButtonRects,
        currentLayout,
        isTextMode,
        isTrapezoidMode,
        textOffsetX,
        textOffsetY,
        selectedCellIndex,
    } = state;

    // ---------- 工具函数 ----------
    const getCanvasCoords = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

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

    // ---------- 简化版 getAdjustedRects（仅用于获取 textRect） ----------
    const getTextRect = (layout, canvasW, canvasH, gap) => {
        const textMode = props.textMode || 'none';
        const barSize = Math.min(props.textBarSize || 80, textMode === 'left' || textMode === 'right' ? canvasW : canvasH);

        if (textMode === 'none' || textMode === 'overlay') {
            return null;
        } else if (textMode === 'top') {
            return { x: 0, y: 0, w: canvasW, h: barSize };
        } else if (textMode === 'bottom') {
            return { x: 0, y: canvasH - barSize, w: canvasW, h: barSize };
        } else if (textMode === 'left') {
            return { x: 0, y: 0, w: barSize, h: canvasH };
        } else if (textMode === 'right') {
            return { x: canvasW - barSize, y: 0, w: barSize, h: canvasH };
        }
        return null;
    };

    // ---------- 点击检测 ----------
    const getCellIndexFromPoint = (x, y) => {
        const borderSize = Math.max(0, props.outerBorderSize);
        const innerX = x - borderSize;
        const innerY = y - borderSize;
        if (innerX < 0 || innerY < 0) return -1;

        const layout = currentLayout.value;
        if (!layout) return -1;

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

        const gap = props.spacing;
        // 独立文字条模式下，图片区域被压缩，需要获取压缩后的格子矩形
        // 这里我们简化处理：直接调用 layout.getRects 获取原始格子，然后应用偏移
        // 但为了准确，我们复用 usePresetRender 中的 getAdjustedRects 逻辑
        // 由于无法跨模块引用，这里使用简化版本（仅计算图片格子偏移）
        const barSize = Math.min(props.textBarSize || 80, props.textMode === 'left' || props.textMode === 'right' ? props.canvasWidth : props.canvasHeight);
        let imgOffsetX = 0, imgOffsetY = 0;
        let imgW = props.canvasWidth, imgH = props.canvasHeight;
        const textMode = props.textMode || 'none';
        if (textMode === 'top') {
            imgH = Math.max(1, props.canvasHeight - barSize - gap);
            imgOffsetY = barSize + gap;
        } else if (textMode === 'bottom') {
            imgH = Math.max(1, props.canvasHeight - barSize - gap);
            imgOffsetY = 0;
        } else if (textMode === 'left') {
            imgW = Math.max(1, props.canvasWidth - barSize - gap);
            imgOffsetX = barSize + gap;
        } else if (textMode === 'right') {
            imgW = Math.max(1, props.canvasWidth - barSize - gap);
            imgOffsetX = 0;
        }
        const rects = layout.getRects(imgW, imgH, gap);
        const adjustedRects = rects.map(r => ({
            ...r,
            x: r.x + imgOffsetX,
            y: r.y + imgOffsetY
        }));

        const tolerance = 2;
        for (let i = 0; i < adjustedRects.length; i++) {
            const r = adjustedRects[i];
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

    // ---------- 拖拽状态 ----------
    let isDragging = false;
    let dragTargetIndex = -1;
    let dragStartX = 0, dragStartY = 0;
    let startOffsetX = 0, startOffsetY = 0;

    // 文字拖拽状态
    let isDraggingText = false;
    let textDragStartX = 0, textDragStartY = 0;
    let textStartOffsetX = 0, textStartOffsetY = 0;

    // ---------- 设置拖拽事件 ----------
    const setupDrag = (canvas) => {
        const onMouseDown = (e) => {
            const { x, y } = getCanvasCoords(e, canvas);
            // 检测删除按钮
            const delIdx = getDeleteButtonIndex(x, y);
            if (delIdx !== -1) return;

            const textMode = props.textMode || 'none';
            const text = props.posterTextLine1;
            // 1. 检查是否点击到文字区域（叠加模式或独立条模式）
            if (textMode !== 'none' && text) {
                const fontSize = props.posterFontSize || 32;
                const vertical = props.textVertical || false;
                let area = null;
                if (textMode === 'overlay') {
                    const positions = {
                        'top-left': { x: 0, y: 0 },
                        'top-center': { x: props.canvasWidth / 2, y: 0 },
                        'top-right': { x: props.canvasWidth, y: 0 },
                        'center-left': { x: 0, y: props.canvasHeight / 2 },
                        'center': { x: props.canvasWidth / 2, y: props.canvasHeight / 2 },
                        'center-right': { x: props.canvasWidth, y: props.canvasHeight / 2 },
                        'bottom-left': { x: 0, y: props.canvasHeight },
                        'bottom-center': { x: props.canvasWidth / 2, y: props.canvasHeight },
                        'bottom-right': { x: props.canvasWidth, y: props.canvasHeight },
                    };
                    const basePos = positions[props.posterTextPosition] || positions['center'];
                    const offsetX = textOffsetX?.value || 0;
                    const offsetY = textOffsetY?.value || 0;
                    const cx = basePos.x + offsetX;
                    const cy = basePos.y + offsetY;
                    // 粗略估算文字区域
                    const halfW = (fontSize * 0.7) * text.length / 2;
                    const halfH = fontSize * 0.7;
                    area = { x: cx - halfW, y: cy - halfH, w: halfW * 2, h: halfH * 2 };
                } else {
                    // 独立条模式
                    const layout = currentLayout.value;
                    if (layout) {
                        const gap = props.spacing;
                        const textRect = getTextRect(layout, props.canvasWidth, props.canvasHeight, gap);
                        if (textRect) {
                            area = textRect;
                        }
                    }
                }
                if (area && x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h) {
                    isDraggingText = true;
                    textDragStartX = x;
                    textDragStartY = y;
                    textStartOffsetX = textOffsetX?.value || 0;
                    textStartOffsetY = textOffsetY?.value || 0;
                    canvas.style.cursor = 'grabbing';
                    e.preventDefault();
                    return;
                }
            }

            // 2. 检测格子（图片）
            const idx = getCellIndexFromPoint(x, y);
            if (idx === -1) return;
            const cell = cells.value[idx];
            if (!cell) return;
            if (cell.type === 'image' && !cell.imageData) return;

            isDragging = true;
            dragTargetIndex = idx;
            dragStartX = x;
            dragStartY = y;
            startOffsetX = cell.offsetX || 0;
            startOffsetY = cell.offsetY || 0;
            canvas.style.cursor = 'grabbing';
            e.preventDefault();
        };

        const onMouseMove = (e) => {
            if (isDraggingText) {
                const { x, y } = getCanvasCoords(e, canvas);
                const deltaX = x - textDragStartX;
                const deltaY = y - textDragStartY;
                textOffsetX.value = textStartOffsetX + deltaX;
                textOffsetY.value = textStartOffsetY + deltaY;
                renderFn();
                e.preventDefault();
                return;
            }

            if (isDragging && dragTargetIndex !== -1) {
                const { x, y } = getCanvasCoords(e, canvas);
                const deltaX = x - dragStartX;
                const deltaY = y - dragStartY;
                const cell = cells.value[dragTargetIndex];
                if (!cell) return;
                cell.offsetX = startOffsetX + deltaX;
                cell.offsetY = startOffsetY + deltaY;
                renderFn();
                e.preventDefault();
            }
        };

        const onMouseUp = () => {
            if (isDraggingText) {
                isDraggingText = false;
                canvas.style.cursor = 'default';
                return;
            }
            if (isDragging) {
                isDragging = false;
                dragTargetIndex = -1;
                canvas.style.cursor = 'default';
            }
        };

        canvas.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        return { onMouseDown, onMouseMove, onMouseUp };
    };

    let cleanupDrag = null;

    const mount = (canvasRef) => {
        if (canvasRef.value) {
            cleanupDrag = setupDrag(canvasRef.value);
        }
    };

    const unmount = (canvasRef) => {
        if (cleanupDrag && canvasRef.value) {
            canvasRef.value.removeEventListener('mousedown', cleanupDrag.onMouseDown);
            document.removeEventListener('mousemove', cleanupDrag.onMouseMove);
            document.removeEventListener('mouseup', cleanupDrag.onMouseUp);
        }
        isDragging = false;
        dragTargetIndex = -1;
        isDraggingText = false;
    };

    return {
        getCellIndexFromPoint,
        getDeleteButtonIndex,
        mount,
        unmount,
    };
}