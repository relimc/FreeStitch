// src/components/canvas/preset/usePresetInteraction.js

export function usePresetInteraction(props, state, renderFn) {
    const { cells, deleteButtonRects, currentLayout, isTextMode, isTrapezoidMode } = state;

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

    // 复制 getAdjustedRects 函数（避免依赖）
    function getAdjustedRects(layout, canvasW, canvasH, gap, textMode, textBarSize) {
        const originalRects = layout.getRects(canvasW, canvasH, gap);
        let imageRects = [];
        let textRect = null;

        if (textMode === 'none' || textMode === 'overlay') {
            return { imageRects: originalRects, textRect: null };
        }

        const barSize = Math.min(textBarSize, textMode === 'left' || textMode === 'right' ? canvasW : canvasH);
        let offsetX = 0, offsetY = 0;
        let imgW = canvasW, imgH = canvasH;

        if (textMode === 'top') {
            imgH = canvasH - barSize - gap;
            offsetY = barSize + gap;
        } else if (textMode === 'bottom') {
            imgH = canvasH - barSize - gap;
            offsetY = 0;
        } else if (textMode === 'left') {
            imgW = canvasW - barSize - gap;
            offsetX = barSize + gap;
        } else if (textMode === 'right') {
            imgW = canvasW - barSize - gap;
            offsetX = 0;
        }

        const adjustedRects = layout.getRects(imgW, imgH, gap);
        imageRects = adjustedRects.map(r => ({
            ...r,
            x: r.x + offsetX,
            y: r.y + offsetY
        }));

        let tx, ty, tw, th;
        if (textMode === 'top') {
            tx = 0; ty = 0; tw = canvasW; th = barSize;
        } else if (textMode === 'bottom') {
            tx = 0; ty = canvasH - barSize; tw = canvasW; th = barSize;
        } else if (textMode === 'left') {
            tx = 0; ty = 0; tw = barSize; th = canvasH;
        } else if (textMode === 'right') {
            tx = canvasW - barSize; ty = 0; tw = barSize; th = canvasH;
        }
        textRect = { x: tx, y: ty, w: tw, h: th };

        return { imageRects, textRect };
    }

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
        if (!layout.getRects) return -1;

        // 使用调整后的矩形
        const { imageRects } = getAdjustedRects(
            layout,
            props.canvasWidth,
            props.canvasHeight,
            gap,
            props.textMode,
            props.textBarSize
        );

        const tolerance = 2;
        for (let i = 0; i < imageRects.length; i++) {
            const r = imageRects[i];
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

    // 拖拽逻辑（不变）
    let isDragging = false;
    let dragTargetIndex = -1;
    let dragStartX = 0, dragStartY = 0;
    let startOffsetX = 0, startOffsetY = 0;

    const setupDrag = (canvas) => {
        const onMouseDown = (e) => {
            const { x, y } = getCanvasCoords(e, canvas);
            const delIdx = getDeleteButtonIndex(x, y);
            if (delIdx !== -1) return;

            const idx = getCellIndexFromPoint(x, y);
            if (idx === -1) return;
            const cell = cells.value[idx];
            if (!cell || (cell.type === 'image' && !cell.imageData)) return;

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
            if (!isDragging || dragTargetIndex === -1) return;
            const { x, y } = getCanvasCoords(e, canvas);
            const deltaX = x - dragStartX;
            const deltaY = y - dragStartY;
            const cell = cells.value[dragTargetIndex];
            if (!cell) return;

            cell.offsetX = startOffsetX + deltaX;
            cell.offsetY = startOffsetY + deltaY;
            renderFn();
            e.preventDefault();
        };

        const onMouseUp = () => {
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
    };

    return {
        getCellIndexFromPoint,
        getDeleteButtonIndex,
        mount,
        unmount,
    };
}