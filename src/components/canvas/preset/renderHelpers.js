// src/components/canvas/preset/renderHelpers.js

/**
 * 在 Canvas 上绘制一个空单元格（虚线框 + 加号）
 */
export function drawEmptyCell(ctx, x, y, w, h, useTransparent) {
    ctx.save();
    if (!useTransparent) {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(x, y, w, h);
    }
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${Math.min(w, h) * 0.3}px "PingFang SC", system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', x + w / 2, y + h / 2);
    ctx.restore();
}

/**
 * 应用蒙版到当前路径
 * 注意：调用前需确保已经 beginPath 并构建好路径，此函数会执行 clip()
 */
export function applyMask(ctx, maskShape, cornerRadius, x, y, w, h) {
    if (maskShape === 'none') return;
    if (maskShape === 'circle') {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const r = Math.min(w, h) / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
    } else if (maskShape === 'roundRect') {
        const radius = Math.min(cornerRadius, Math.min(w, h) / 2);
        if (radius <= 0) {
            ctx.rect(x, y, w, h);
            ctx.clip();
            return;
        }
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.clip();
    }
}