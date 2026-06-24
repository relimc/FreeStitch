// src/components/canvas/preset/usePresetInteraction.js

import { onUnmounted } from 'vue';

export function usePresetInteraction(props, state, renderFn) {
    const { cells, imageOffsets, deleteButtonRects, currentLayout, isTextMode, isTrapezoidMode } = state;

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

    // ---------- 点击检测 ----------
    const getCellIndexFromPoint = (x, y) => {
        const borderSize = Math.max(0, props.outerBorderSize);
        const innerX = x - borderSize;
        const innerY = y - borderSize;
        if (innerX < 0 || innerY < 0) return -1;

        const layout = currentLayout.value;
        if (!layout) return -1;

        // 斜切
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
        if (!layout.getRects) return -1;
        const rects = layout.getRects(props.canvasWidth, props.canvasHeight, gap);
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

    // ---------- 拖拽 ----------
    let isDragging = false;
    let dragTargetId = null;
    let dragStartX = 0, dragStartY = 0;
    let startOffsetX = 0, startOffsetY = 0;

    const setupDrag = (canvas) => {
        const onMouseDown = (e) => {
            const { x, y } = getCanvasCoords(e, canvas);
            // 先检测删除
            const delIdx = getDeleteButtonIndex(x, y);
            if (delIdx !== -1) return; // 由外部处理删除
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
            renderFn(); // 重新渲染
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
        dragTargetId = null;
    };

    return {
        getCellIndexFromPoint,
        getDeleteButtonIndex,
        mount,
        unmount,
    };
}