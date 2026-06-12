// src/components/canvas/utils/posterHelpers.js

async function drawPosterCell(ctx, x, y, w, h, cell, loadImage, fillMode = 'cover') {
    // 背景
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(x, y, w, h);
    
    // 虚线边框
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    
    if (cell && cell.imageData) {
        const img = await loadImage(cell.imageData);
        let drawW, drawH, dx, dy;
        if (fillMode === 'cover') {
            const scale = Math.max(w / img.width, h / img.height);
            drawW = img.width * scale;
            drawH = img.height * scale;
            dx = x + (w - drawW) / 2;
            dy = y + (h - drawH) / 2;
        } else {
            const scale = Math.min(w / img.width, h / img.height);
            drawW = img.width * scale;
            drawH = img.height * scale;
            dx = x + (w - drawW) / 2;
            dy = y + (h - drawH) / 2;
        }
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        ctx.drawImage(img, dx, dy, drawW, drawH);
        ctx.restore();
    } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = `${Math.min(w, h) * 0.3}px "PingFang SC", system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', x + w / 2, y + h / 2);
    }
    ctx.restore();
}

export async function drawGrid2x2(ctx, canvas, cells, loadImage, fillMode = 'cover', spacing = 12) {
    const totalWidth = canvas.width;
    const totalHeight = canvas.height;
    const cellW = (totalWidth - spacing) / 2;
    const cellH = (totalHeight - spacing) / 2;
    for (let i = 0; i < cells.length; i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = col * (cellW + spacing);
        const y = row * (cellH + spacing);
        await drawPosterCell(ctx, x, y, cellW, cellH, cells[i], loadImage, fillMode);
    }
}

export async function drawGrid3x3(ctx, canvas, cells, loadImage, fillMode = 'cover', spacing = 12) {
    const totalWidth = canvas.width;
    const totalHeight = canvas.height;
    const cellW = (totalWidth - spacing * 2) / 3;
    const cellH = (totalHeight - spacing * 2) / 3;
    for (let i = 0; i < cells.length; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = col * (cellW + spacing);
        const y = row * (cellH + spacing);
        await drawPosterCell(ctx, x, y, cellW, cellH, cells[i], loadImage, fillMode);
    }
}

export async function drawBigSmall(ctx, canvas, cells, loadImage, fillMode = 'cover', spacing = 12) {
    const totalWidth = canvas.width;
    const totalHeight = canvas.height;
    const bigW = totalWidth * 0.6;
    const smallW = totalWidth * 0.4 - spacing;
    const smallH = (totalHeight - spacing) / 2;
    const bigX = 0;
    const bigY = 0;
    const smallX = bigW + spacing;
    const smallTopY = 0;
    const smallBottomY = smallH + spacing;
    
    if (cells[0]) await drawPosterCell(ctx, bigX, bigY, bigW, totalHeight, cells[0], loadImage, fillMode);
    if (cells[1]) await drawPosterCell(ctx, smallX, smallTopY, smallW, smallH, cells[1], loadImage, fillMode);
    if (cells[2]) await drawPosterCell(ctx, smallX, smallBottomY, smallW, smallH, cells[2], loadImage, fillMode);
}

export async function drawTopBottom(ctx, canvas, cells, loadImage, fillMode = 'cover', spacing = 12) {
    const totalWidth = canvas.width;
    const totalHeight = canvas.height;
    const topH = totalHeight * 0.6 - spacing / 2;
    const bottomH = totalHeight * 0.4 - spacing / 2;
    const bottomW = (totalWidth - spacing) / 2;
    const topY = 0;
    const bottomY = topH + spacing;
    const leftX = 0;
    const rightX = bottomW + spacing;
    
    if (cells[0]) await drawPosterCell(ctx, 0, topY, totalWidth, topH, cells[0], loadImage, fillMode);
    if (cells[1]) await drawPosterCell(ctx, leftX, bottomY, bottomW, bottomH, cells[1], loadImage, fillMode);
    if (cells[2]) await drawPosterCell(ctx, rightX, bottomY, bottomW, bottomH, cells[2], loadImage, fillMode);
}

export async function drawThreeHorizontal(ctx, canvas, cells, loadImage, fillMode = 'cover', spacing = 12) {
    const totalWidth = canvas.width;
    const totalHeight = canvas.height;
    const cellW = (totalWidth - spacing * 2) / 3;
    const cellH = totalHeight;
    for (let i = 0; i < cells.length; i++) {
        const x = i * (cellW + spacing);
        await drawPosterCell(ctx, x, 0, cellW, cellH, cells[i], loadImage, fillMode);
    }
}

export async function drawBanner(ctx, canvas, cells, loadImage, fillMode = 'cover', spacing = 12) {
    const imgHeight = canvas.height * 0.7;
    if (cells[0]) await drawPosterCell(ctx, 0, 0, canvas.width, imgHeight, cells[0], loadImage, fillMode);
}

export async function drawMovie(ctx, canvas, cells, loadImage, fillMode = 'cover', spacing = 12) {
    if (cells[0]) await drawPosterCell(ctx, 0, 0, canvas.width, canvas.height, cells[0], loadImage, fillMode);
}

export async function drawLeftText(ctx, canvas, cells, loadImage, fillMode = 'cover', spacing = 12) {
    const imgW = canvas.width * 0.6;
    const imgH = canvas.height;
    const imgX = canvas.width - imgW;
    if (cells[0]) await drawPosterCell(ctx, imgX, 0, imgW, imgH, cells[0], loadImage, fillMode);
}

export async function drawPolaroid(ctx, canvas, cells, loadImage, fillMode = 'cover', spacing = 12) {
    const padding = 40;
    const imgW = canvas.width - padding * 2;
    const imgH = canvas.height - padding * 2;
    if (cells[0]) {
        await drawPosterCell(ctx, padding, padding, imgW, imgH, cells[0], loadImage, fillMode);
        // 模拟拍立得边框（白色边框效果）
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(padding, padding, imgW, imgH);
    }
}