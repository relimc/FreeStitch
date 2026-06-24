// src/components/canvas/preset/usePresetExport.js

import { loadImage } from '../utils/canvasHelpers.js';
import { drawEmptyCell, applyMask } from './renderHelpers.js';

export function usePresetExport(props, state, drawFunctions) {
    const { cells, currentLayout, imageOffsets, isTextMode, isTrapezoidMode } = state;
    const { drawTrapezoid, drawTextMode } = drawFunctions;

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
            if (!layout || !layout.getRects) return null;
            const gap = props.spacing;
            const rects = layout.getRects(props.canvasWidth, props.canvasHeight, gap);
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
                    let img = state.getCachedImage(cell.imageId);
                    if (!img) {
                        img = await loadImage(cell.imageData);
                        state.setCachedImage(cell.imageId, img);
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

    return {
        exportImage,
        getResolution,
    };
}