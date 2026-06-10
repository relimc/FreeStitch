// 通用画布辅助函数
export const loadImage = (dataURL) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataURL;
});

// 计算适配尺寸
export const calculateFit = (originalW, originalH, containerW, containerH, fillMode) => {
    let drawW, drawH, offsetX = 0, offsetY = 0;
    if (fillMode === 'contain') {
        const scale = Math.min(containerW / originalW, containerH / originalH);
        drawW = originalW * scale;
        drawH = originalH * scale;
        offsetX = (containerW - drawW) / 2;
        offsetY = (containerH - drawH) / 2;
    } else {
        const scale = Math.max(containerW / originalW, containerH / originalH);
        drawW = originalW * scale;
        drawH = originalH * scale;
        offsetX = (containerW - drawW) / 2;
        offsetY = (containerH - drawH) / 2;
    }
    return { drawW, drawH, offsetX, offsetY };
};

// 应用蒙版
export const applyMask = (ctx, x, y, w, h, maskShape, cornerRadius) => {
    if (maskShape === 'circle') {
        const centerX = x + w / 2;
        const centerY = y + h / 2;
        const radius = Math.min(w, h) / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.clip();
    } else if (maskShape === 'roundRect') {
        const r = cornerRadius;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.clip();
    }
};