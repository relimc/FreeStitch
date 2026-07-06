// src/components/canvas/preset/usePresetRender.js

import { loadImage } from '../utils/canvasHelpers.js';
import { drawEmptyCell, applyMask } from './renderHelpers.js';

// 工具：根据文字模式调整矩形
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

                    const { imageRects, textRect } = getAdjustedRects(
                        layout,
                        props.canvasWidth,
                        props.canvasHeight,
                        gap,
                        props.textMode,
                        props.textBarSize
                    );

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
                            // 叠加模式：相对于画布中心+偏移
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
                            // 叠加模式下位置使用 'center' 固定，但可以增加拖拽偏移
                            const pos = positions['center'];
                            const offX = textOffsetX?.value || 0;
                            const offY = textOffsetY?.value || 0;
                            cx = pos.x + offX;
                            cy = pos.y + offY;
                        } else {
                            // 独立条模式
                            if (!textRect) { ctx.restore(); return; }
                            cx = textRect.x + textRect.w / 2;
                            cy = textRect.y + textRect.h / 2;
                        }
                        ctx.fillText(text, cx, cy);
                        ctx.restore();
                    }

                    ctx.restore(); // 取消 translate
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