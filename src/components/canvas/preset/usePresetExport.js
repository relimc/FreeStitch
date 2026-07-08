// src/components/canvas/preset/usePresetExport.js

import { loadImage } from '../utils/canvasHelpers.js';
import { drawEmptyCell, applyMask } from './renderHelpers.js';

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

    // 与渲染完全相同的调整逻辑
    const getAdjustedRects = (layout, canvasW, canvasH, gap) => {
        const textMode = props.textMode || 'none';
        const barSize = Math.min(props.textBarSize || 80, textMode === 'left' || textMode === 'right' ? canvasW : canvasH);

        let imgOffsetX = 0, imgOffsetY = 0;
        let imgW = canvasW, imgH = canvasH;
        let textRect = null;

        if (textMode === 'none' || textMode === 'overlay') {
            const rects = layout.getRects(canvasW, canvasH, gap);
            return { imageRects: rects, textRect: null };
        } else if (textMode === 'top') {
            imgH = Math.max(1, canvasH - barSize - gap);
            imgOffsetY = barSize + gap;
            textRect = { x: 0, y: 0, w: canvasW, h: barSize };
        } else if (textMode === 'bottom') {
            imgH = Math.max(1, canvasH - barSize - gap);
            imgOffsetY = 0;
            textRect = { x: 0, y: canvasH - barSize, w: canvasW, h: barSize };
        } else if (textMode === 'left') {
            imgW = Math.max(1, canvasW - barSize - gap);
            imgOffsetX = barSize + gap;
            textRect = { x: 0, y: 0, w: barSize, h: canvasH };
        } else if (textMode === 'right') {
            imgW = Math.max(1, canvasW - barSize - gap);
            imgOffsetX = 0;
            textRect = { x: canvasW - barSize, y: 0, w: barSize, h: canvasH };
        }

        const rects = layout.getRects(imgW, imgH, gap);
        const imageRects = rects.map(r => ({
            ...r,
            x: r.x + imgOffsetX,
            y: r.y + imgOffsetY
        }));

        return { imageRects, textRect };
    };

    // ---------- 统一的文字绘制函数 ----------
    const drawText = (ctx, text, posX, posY, fontSize, color, vertical) => {
        if (!text) return;
        ctx.save();
        ctx.fillStyle = color;
        ctx.font = `bold ${fontSize}px "PingFang SC", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (vertical) {
            const chars = text.split('');
            const totalHeight = chars.length * fontSize * 0.9;
            const startY = posY - totalHeight / 2;
            chars.forEach((char, index) => {
                const y = startY + index * fontSize * 0.9 + fontSize / 2;
                ctx.fillText(char, posX, y);
            });
        } else {
            ctx.fillText(text, posX, posY);
        }
        ctx.restore();
    };

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
        const { imageRects, textRect } = getAdjustedRects(layout, props.canvasWidth, props.canvasHeight, gap);

        if (useTransparent) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = props.bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.save();
        ctx.translate(borderSize, borderSize);

        // 绘制图片格子
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

        // ---------- 文字绘制（使用统一函数） ----------
        const textMode = props.textMode || 'none';
        const text = props.posterTextLine1;
        if (textMode !== 'none' && text) {
            const fontSize = props.posterFontSize || 32;
            const color = props.posterTextColor || '#ffffff';
            const vertical = props.textVertical || false;

            let posX, posY;
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
                posX = basePos.x + offsetX;
                posY = basePos.y + offsetY;
            } else {
                if (textRect) {
                    posX = textRect.x + textRect.w / 2;
                    posY = textRect.y + textRect.h / 2;
                } else {
                    posX = props.canvasWidth / 2;
                    posY = props.canvasHeight / 2;
                }
            }

            drawText(ctx, text, posX, posY, fontSize, color, vertical);
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