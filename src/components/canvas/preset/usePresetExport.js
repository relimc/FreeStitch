// src/components/canvas/preset/usePresetExport.js

import { loadImage } from '../utils/canvasHelpers.js';
import { drawEmptyCell, applyMask } from './renderHelpers.js';

// 复用 getAdjustedRects（与渲染一致）
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

export function usePresetExport(props, state, drawFunctions) {
    const {
        cells,
        currentLayout,
        imageOffsets,
        isTextMode,
        isTrapezoidMode,
        getCachedImage,
        setCachedImage,
        textOffsetX,
        textOffsetY,
    } = state;
    const { drawTrapezoid, drawTextMode } = drawFunctions;

    const exportImage = async (useTransparent) => {
        const borderSize = Math.max(0, props.outerBorderSize);
        const W = props.canvasWidth + borderSize * 2;
        const H = props.canvasHeight + borderSize * 2;
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, W);
        canvas.height = Math.max(1, H);
        const ctx = canvas.getContext('2d');

        if (isTextMode.value) {
            await drawTextMode(ctx, W, H, useTransparent);
            return canvas.toDataURL('image/png');
        }

        if (isTrapezoidMode.value) {
            await drawTrapezoid(ctx, W, H, useTransparent, cells.value);
            return canvas.toDataURL('image/png');
        }

        const layout = currentLayout.value;
        if (!layout || !layout.getRects) return null;
        const gap = props.spacing;

        const { imageRects, textRect } = getAdjustedRects(
            layout,
            props.canvasWidth,
            props.canvasHeight,
            gap,
            props.textMode,
            props.textBarSize
        );

        if (useTransparent) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = props.bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.save();
        ctx.translate(borderSize, borderSize);

        // 绘制图片
        for (let i = 0; i < Math.min(cells.value.length, imageRects.length); i++) {
            const cell = cells.value[i];
            const rect = imageRects[i];
            const { x, y, w, h } = rect;

            if (!useTransparent) {
                ctx.fillStyle = '#f1f5f9';
                ctx.fillRect(x, y, w, h);
            }

            if (cell.type === 'image' && cell.imageData) {
                let img = getCachedImage(cell.imageId);
                if (!img) {
                    img = await loadImage(cell.imageData);
                    setCachedImage(cell.imageId, img);
                }
                if (img && img.width > 0 && img.height > 0) {
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
                    const cellOffX = cell.offsetX || 0;
                    const cellOffY = cell.offsetY || 0;
                    const drawX = x + offsetX + cellOffX;
                    const drawY = y + offsetY + cellOffY;

                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(x, y, w, h);
                    ctx.clip();
                    if (props.maskShape !== 'none') {
                        applyMask(ctx, props.maskShape, props.cornerRadius, x, y, w, h);
                    }
                    ctx.drawImage(img, drawX, drawY, drawW, drawH);
                    ctx.restore();
                } else {
                    drawEmptyCell(ctx, x, y, w, h, useTransparent);
                }
            } else {
                drawEmptyCell(ctx, x, y, w, h, useTransparent);
            }
        }

        // 绘制文字
        if (props.textMode !== 'none' && props.posterTextLine1) {
            ctx.save();
            const text = props.posterTextLine1;
            const fontSize = props.posterFontSize || 32;
            const color = props.posterTextColor || '#ffffff';
            ctx.fillStyle = color;
            ctx.font = `bold ${fontSize}px "PingFang SC", system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            let cx, cy;
            if (props.textMode === 'overlay') {
                const offX = textOffsetX?.value || 0;
                const offY = textOffsetY?.value || 0;
                cx = props.canvasWidth / 2 + offX;
                cy = props.canvasHeight / 2 + offY;
            } else {
                if (!textRect) { ctx.restore(); return; }
                cx = textRect.x + textRect.w / 2;
                cy = textRect.y + textRect.h / 2;
            }
            ctx.fillText(text, cx, cy);
            ctx.restore();
        }

        ctx.restore();
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