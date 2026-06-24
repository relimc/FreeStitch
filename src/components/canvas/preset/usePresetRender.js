// src/components/canvas/preset/usePresetRender.js

import { loadImage } from '../utils/canvasHelpers.js';
import { drawEmptyCell, applyMask } from './renderHelpers.js';

export function usePresetRender(props, state, drawFunctions, canvasRef) {
    const { cells, currentLayout, imageOffsets, deleteButtonRects, isTextMode, isTrapezoidMode } = state;
    const { drawTrapezoid, drawTextMode } = drawFunctions;

    let renderRequestId = null;

    // 绘制删除按钮（内部函数）
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
                    const rects = layout.getRects(props.canvasWidth, props.canvasHeight, gap);

                    if (props.useTransparent) {
                        ctx.clearRect(0, 0, W, H);
                    } else {
                        ctx.fillStyle = props.bgColor;
                        ctx.fillRect(0, 0, W, H);
                    }

                    ctx.save();
                    ctx.translate(borderSize, borderSize);

                    for (let i = 0; i < Math.min(cells.value.length, rects.length); i++) {
                        const cell = cells.value[i];
                        const rect = rects[i];
                        const { x, y, w, h } = rect;

                        if (!props.useTransparent) {
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

                        // 选中高亮
                        if (state.selectedCellIndex.value === i) {
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