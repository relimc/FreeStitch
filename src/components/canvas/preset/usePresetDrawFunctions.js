// src/components/canvas/preset/usePresetDrawFunctions.js

import { loadImage } from '../utils/canvasHelpers.js';
import { drawEmptyCell, applyMask } from './renderHelpers.js';

export function usePresetDrawFunctions(props, state) {
    const { imageOffsets, getCachedImage, setCachedImage } = state;

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
                let img = getCachedImage(cell.imageId);
                if (!img) {
                    img = await loadImage(cell.imageData);
                    setCachedImage(cell.imageId, img);
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

        const cell = state.cells.value[0];
        if (cell && cell.imageData) {
            let img = getCachedImage(cell.imageId);
            if (!img) {
                img = await loadImage(cell.imageData);
                setCachedImage(cell.imageId, img);
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

    return {
        drawTrapezoid,
        drawTextMode,
    };
}