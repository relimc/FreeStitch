// src/components/canvas/preset/usePresetRender.js

import { loadImage } from '../utils/canvasHelpers.js';
import { drawEmptyCell, applyMask } from './renderHelpers.js';

export function usePresetRender(props, state, drawFunctions, canvasRef) {
    const {
        cells,
        currentLayout,
        imageOffsets,
        deleteButtonRects,
        selectedCellIndex,
        isTextMode,
        isTrapezoidMode,
        getCachedImage,
        setCachedImage,
        textOffsetX,
        textOffsetY,
    } = state;

    const { drawTrapezoid, drawTextMode } = drawFunctions;

    let renderRequestId = null;

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

    // ---------- 根据文字模式计算图片区域和文字区域 ----------
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
            // 竖排：逐字纵向排列
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
                    if (!layout || !layout.getRects) {
                        resolve();
                        return;
                    }
                    const gap = props.spacing;
                    const { imageRects, textRect } = getAdjustedRects(layout, props.canvasWidth, props.canvasHeight, gap);

                    if (props.useTransparent) {
                        ctx.clearRect(0, 0, W, H);
                    } else {
                        ctx.fillStyle = props.bgColor;
                        ctx.fillRect(0, 0, W, H);
                    }

                    ctx.save();
                    ctx.translate(borderSize, borderSize);

                    // 绘制图片格子
                    for (let i = 0; i < Math.min(cells.value.length, imageRects.length); i++) {
                        const cell = cells.value[i];
                        const rect = imageRects[i];
                        const { x, y, w, h } = rect;

                        if (!props.useTransparent) {
                            ctx.fillStyle = '#f1f5f9';
                            ctx.fillRect(x, y, w, h);
                        }

                        if (cell.type === 'image' && cell.imageData) {
                            let img = getCachedImage(cell.imageId);
                            if (!img) {
                                try {
                                    img = await loadImage(cell.imageData);
                                    if (img) setCachedImage(cell.imageId, img);
                                } catch (err) {
                                    console.error('图片加载失败:', cell.imageId, err);
                                    img = null;
                                }
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
                                let maxOffsetX = 0, maxOffsetY = 0;
                                if (props.fillMode === 'cover') {
                                    maxOffsetX = Math.max(0, drawW - w);
                                    maxOffsetY = Math.max(0, drawH - h);
                                } else {
                                    maxOffsetX = Math.max(0, w - drawW);
                                    maxOffsetY = Math.max(0, h - drawH);
                                }
                                const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, cellOffX));
                                const clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, cellOffY));
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

                                // 删除按钮
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
                        } else {
                            drawEmptyCell(ctx, x, y, w, h, props.useTransparent);
                        }
                    }

                    // 选中高亮
                    ctx.save();
                    for (let i = 0; i < Math.min(cells.value.length, imageRects.length); i++) {
                        if (selectedCellIndex.value === i) {
                            const rect = imageRects[i];
                            ctx.strokeStyle = '#e74c3c';
                            ctx.lineWidth = 3;
                            ctx.setLineDash([]);
                            ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
                        }
                    }
                    ctx.restore();

                    // ---------- 绘制文字（统一使用 drawText） ----------
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
                            // 独立条模式：使用 textRect 中心
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

                    ctx.restore(); // 取消 translate (borderSize)
                }

                renderRequestId = null;
                resolve();
            });
        });
    };

    const cancelRender = () => {
        if (renderRequestId) {
            cancelAnimationFrame(renderRequestId);
            renderRequestId = null;
        }
    };

    return {
        renderCanvas,
        cancelRender,
    };
}