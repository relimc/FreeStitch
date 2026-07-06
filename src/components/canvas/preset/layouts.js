// src/components/canvas/preset/layouts.js

export const presetLayouts = {
    // ---------- 2宫格 ----------
    '2-horizontal': {
        cells: 2,
        getRects: (cw, ch, gap) => {
            const w = (cw - gap) / 2;
            return [
                { x: 0, y: 0, w, h: ch },
                { x: w + gap, y: 0, w, h: ch }
            ];
        }
    },
    '2-vertical': {
        cells: 2,
        getRects: (cw, ch, gap) => {
            const h = (ch - gap) / 2;
            return [
                { x: 0, y: 0, w: cw, h },
                { x: 0, y: h + gap, w: cw, h }
            ];
        }
    },
    '2-vertical-2-1': {
        cells: 2,
        getRects: (cw, ch, gap) => {
            const topH = (ch - gap) * 2 / 3;
            const bottomH = (ch - gap) * 1 / 3;
            return [
                { x: 0, y: 0, w: cw, h: topH },
                { x: 0, y: topH + gap, w: cw, h: bottomH }
            ];
        }
    },
    '2-horizontal-2-1': {
        cells: 2,
        getRects: (cw, ch, gap) => {
            const leftW = (cw - gap) * 2 / 3;
            const rightW = (cw - gap) * 1 / 3;
            return [
                { x: 0, y: 0, w: leftW, h: ch },
                { x: leftW + gap, y: 0, w: rightW, h: ch }
            ];
        }
    },
    '2-horizontal-1-2': {
        cells: 2,
        getRects: (cw, ch, gap) => {
            const leftW = (cw - gap) * 1 / 3;
            const rightW = (cw - gap) * 2 / 3;
            return [
                { x: 0, y: 0, w: leftW, h: ch },
                { x: leftW + gap, y: 0, w: rightW, h: ch }
            ];
        }
    },
    '2-vertical-1-2': {
        cells: 2,
        getRects: (cw, ch, gap) => {
            const topH = (ch - gap) * 1 / 3;
            const bottomH = (ch - gap) * 2 / 3;
            return [
                { x: 0, y: 0, w: cw, h: topH },
                { x: 0, y: topH + gap, w: cw, h: bottomH }
            ];
        }
    },
    '2-trapezoid-horizontal': {
        type: 'trapezoid',
        cells: 2,
        // 无 getRects，由 drawTrapezoid 处理
    },

    // ---------- 3宫格 ----------
    '3-horizontal': {
        cells: 3,
        getRects: (cw, ch, gap) => {
            const w = (cw - gap * 2) / 3;
            return [
                { x: 0, y: 0, w, h: ch },
                { x: w + gap, y: 0, w, h: ch },
                { x: (w + gap) * 2, y: 0, w, h: ch }
            ];
        }
    },
    '3-vertical': {
        cells: 3,
        getRects: (cw, ch, gap) => {
            const h = (ch - gap * 2) / 3;
            return [
                { x: 0, y: 0, w: cw, h },
                { x: 0, y: h + gap, w: cw, h },
                { x: 0, y: (h + gap) * 2, w: cw, h }
            ];
        }
    },
    '3-1-2': {
        cells: 3,
        getRects: (cw, ch, gap) => {
            const topH = (ch - gap) * 2 / 3;
            const bottomH = (ch - gap) * 1 / 3;
            const bottomW = (cw - gap) / 2;
            return [
                { x: 0, y: 0, w: cw, h: topH },
                { x: 0, y: topH + gap, w: bottomW, h: bottomH },
                { x: bottomW + gap, y: topH + gap, w: bottomW, h: bottomH }
            ];
        }
    },
    '3-2-1': {
        cells: 3,
        getRects: (cw, ch, gap) => {
            const topH = (ch - gap) * 1 / 3;
            const bottomH = (ch - gap) * 2 / 3;
            const topW = (cw - gap) / 2;
            return [
                { x: 0, y: 0, w: topW, h: topH },
                { x: topW + gap, y: 0, w: topW, h: topH },
                { x: 0, y: topH + gap, w: cw, h: bottomH }
            ];
        }
    },
    '3-left-2-1': {
        cells: 3,
        getRects: (cw, ch, gap) => {
            const leftW = (cw - gap) * 1 / 3;
            const rightW = (cw - gap) * 2 / 3;
            const topH = (ch - gap) / 2;
            const bottomH = (ch - gap) / 2;
            return [
                { x: 0, y: 0, w: leftW, h: topH },
                { x: 0, y: topH + gap, w: leftW, h: bottomH },
                { x: leftW + gap, y: 0, w: rightW, h: ch }
            ];
        }
    },
    '3-left-1-2': {
        cells: 3,
        getRects: (cw, ch, gap) => {
            const leftW = (cw - gap) * 2 / 3;
            const rightW = (cw - gap) * 1 / 3;
            const topH = (ch - gap) / 2;
            const bottomH = (ch - gap) / 2;
            return [
                { x: 0, y: 0, w: leftW, h: ch },
                { x: leftW + gap, y: 0, w: rightW, h: topH },
                { x: leftW + gap, y: topH + gap, w: rightW, h: bottomH }
            ];
        }
    },

    // ---------- 4宫格 ----------
    '4-grid': {
        cells: 4,
        getRects: (cw, ch, gap) => {
            const w = (cw - gap) / 2;
            const h = (ch - gap) / 2;
            return [
                { x: 0, y: 0, w, h },
                { x: w + gap, y: 0, w, h },
                { x: 0, y: h + gap, w, h },
                { x: w + gap, y: h + gap, w, h }
            ];
        }
    },
    '4-horizontal': {
        cells: 4,
        getRects: (cw, ch, gap) => {
            const w = (cw - gap * 3) / 4;
            return [
                { x: 0, y: 0, w, h: ch },
                { x: w + gap, y: 0, w, h: ch },
                { x: (w + gap) * 2, y: 0, w, h: ch },
                { x: (w + gap) * 3, y: 0, w, h: ch }
            ];
        }
    },
    '4-vertical': {
        cells: 4,
        getRects: (cw, ch, gap) => {
            const h = (ch - gap * 3) / 4;
            return [
                { x: 0, y: 0, w: cw, h },
                { x: 0, y: h + gap, w: cw, h },
                { x: 0, y: (h + gap) * 2, w: cw, h },
                { x: 0, y: (h + gap) * 3, w: cw, h }
            ];
        }
    },
    '4-1-3': {
        cells: 4,
        getRects: (cw, ch, gap) => {
            const topH = (ch - gap) / 2;
            const bottomH = (ch - gap) / 2;
            const bottomW = (cw - gap * 2) / 3;
            return [
                { x: 0, y: 0, w: cw, h: topH },
                { x: 0, y: topH + gap, w: bottomW, h: bottomH },
                { x: bottomW + gap, y: topH + gap, w: bottomW, h: bottomH },
                { x: (bottomW + gap) * 2, y: topH + gap, w: bottomW, h: bottomH }
            ];
        }
    },
    '4-3-1': {
        cells: 4,
        getRects: (cw, ch, gap) => {
            const topH = (ch - gap) / 2;
            const bottomH = (ch - gap) / 2;
            const topW = (cw - gap * 2) / 3;
            return [
                { x: 0, y: 0, w: topW, h: topH },
                { x: topW + gap, y: 0, w: topW, h: topH },
                { x: (topW + gap) * 2, y: 0, w: topW, h: topH },
                { x: 0, y: topH + gap, w: cw, h: bottomH }
            ];
        }
    },
    '4-left-1-3': {
        cells: 4,
        getRects: (cw, ch, gap) => {
            const leftW = (cw - gap) / 2;
            const rightW = (cw - gap) / 2;
            const rightCellW = (rightW - gap * 2) / 3;
            return [
                { x: 0, y: 0, w: leftW, h: ch },
                { x: leftW + gap, y: 0, w: rightCellW, h: ch },
                { x: leftW + gap + rightCellW + gap, y: 0, w: rightCellW, h: ch },
                { x: leftW + gap + (rightCellW + gap) * 2, y: 0, w: rightCellW, h: ch }
            ];
        }
    },
    '4-left-3-1': {
        cells: 4,
        getRects: (cw, ch, gap) => {
            const leftW = (cw - gap) / 2;
            const rightW = (cw - gap) / 2;
            const leftCellW = (leftW - gap * 2) / 3;
            return [
                { x: 0, y: 0, w: leftCellW, h: ch },
                { x: leftCellW + gap, y: 0, w: leftCellW, h: ch },
                { x: (leftCellW + gap) * 2, y: 0, w: leftCellW, h: ch },
                { x: leftW + gap, y: 0, w: rightW, h: ch }
            ];
        }
    },
    '4-diagonal': {
        cells: 4,
        getRects: (cw, ch, gap) => {
            const h = (ch - gap) / 2;
            const w1 = (cw - gap) * 2 / 3;
            const w2 = (cw - gap) * 1 / 3;
            return [
                { x: 0, y: 0, w: w1, h },
                { x: w1 + gap, y: 0, w: w2, h },
                { x: 0, y: h + gap, w: w2, h },
                { x: w2 + gap, y: h + gap, w: w1, h }
            ];
        }
    },

    // ---------- 5宫格 ----------
    '5-2x3': {
        cells: 5,
        getRects: (cw, ch, gap) => {
            const w = (cw - gap * 2) / 3;
            const h = (ch - gap) / 2;
            return [
                { x: 0, y: 0, w, h },
                { x: w + gap, y: 0, w, h },
                { x: (w + gap) * 2, y: 0, w, h },
                { x: 0, y: h + gap, w, h },
                { x: w + gap, y: h + gap, w, h }
            ];
        }
    },
    '5-left-2-3': {
        cells: 5,
        getRects: (cw, ch, gap) => {
            const leftW = (cw - gap) / 2;
            const rightW = (cw - gap) / 2;
            const leftH = (ch - gap) / 2;
            const rightH = (ch - gap) / 2;
            const rightCellW = (rightW - gap * 2) / 3;
            return [
                { x: 0, y: 0, w: leftW, h: leftH },
                { x: 0, y: leftH + gap, w: leftW, h: leftH },
                { x: leftW + gap, y: 0, w: rightCellW, h: rightH },
                { x: leftW + gap + rightCellW + gap, y: 0, w: rightCellW, h: rightH },
                { x: leftW + gap + (rightCellW + gap) * 2, y: 0, w: rightCellW, h: rightH }
            ];
        }
    },
    '5-left-3-2': {
        cells: 5,
        getRects: (cw, ch, gap) => {
            const leftW = (cw - gap) / 2;
            const rightW = (cw - gap) / 2;
            const leftCellW = (leftW - gap * 2) / 3;
            const rightH = (ch - gap) / 2;
            return [
                { x: 0, y: 0, w: leftCellW, h: ch },
                { x: leftCellW + gap, y: 0, w: leftCellW, h: ch },
                { x: (leftCellW + gap) * 2, y: 0, w: leftCellW, h: ch },
                { x: leftW + gap, y: 0, w: rightW, h: rightH },
                { x: leftW + gap, y: rightH + gap, w: rightW, h: rightH }
            ];
        }
    },
    '5-top-2-3': {
        cells: 5,
        getRects: (cw, ch, gap) => {
            const topH = (ch - gap) / 2;
            const bottomH = (ch - gap) / 2;
            const topW = (cw - gap) / 2;
            const bottomW = (cw - gap * 2) / 3;
            return [
                { x: 0, y: 0, w: topW, h: topH },
                { x: topW + gap, y: 0, w: topW, h: topH },
                { x: 0, y: topH + gap, w: bottomW, h: bottomH },
                { x: bottomW + gap, y: topH + gap, w: bottomW, h: bottomH },
                { x: (bottomW + gap) * 2, y: topH + gap, w: bottomW, h: bottomH }
            ];
        }
    },
    '5-top-3-2': {
        cells: 5,
        getRects: (cw, ch, gap) => {
            const topH = (ch - gap) / 2;
            const bottomH = (ch - gap) / 2;
            const topW = (cw - gap * 2) / 3;
            const bottomW = (cw - gap) / 2;
            return [
                { x: 0, y: 0, w: topW, h: topH },
                { x: topW + gap, y: 0, w: topW, h: topH },
                { x: (topW + gap) * 2, y: 0, w: topW, h: topH },
                { x: 0, y: topH + gap, w: bottomW, h: bottomH },
                { x: bottomW + gap, y: topH + gap, w: bottomW, h: bottomH }
            ];
        }
    },

    // ---------- 6宫格 ----------
    '6-2x3': {
        cells: 6,
        getRects: (cw, ch, gap) => {
            const w = (cw - gap * 2) / 3;
            const h = (ch - gap) / 2;
            return [
                { x: 0, y: 0, w, h },
                { x: w + gap, y: 0, w, h },
                { x: (w + gap) * 2, y: 0, w, h },
                { x: 0, y: h + gap, w, h },
                { x: w + gap, y: h + gap, w, h },
                { x: (w + gap) * 2, y: h + gap, w, h }
            ];
        }
    },
    '6-3x2': {
        cells: 6,
        getRects: (cw, ch, gap) => {
            const w = (cw - gap) / 2;
            const h = (ch - gap * 2) / 3;
            return [
                { x: 0, y: 0, w, h },
                { x: w + gap, y: 0, w, h },
                { x: 0, y: h + gap, w, h },
                { x: w + gap, y: h + gap, w, h },
                { x: 0, y: (h + gap) * 2, w, h },
                { x: w + gap, y: (h + gap) * 2, w, h }
            ];
        }
    },
    '6-top-2-4': {
        cells: 6,
        getRects: (cw, ch, gap) => {
            const topH = (ch - gap) / 2;
            const bottomH = (ch - gap) / 2;
            const topW = (cw - gap) / 2;
            const bottomW = (cw - gap * 3) / 4;
            return [
                { x: 0, y: 0, w: topW, h: topH },
                { x: topW + gap, y: 0, w: topW, h: topH },
                { x: 0, y: topH + gap, w: bottomW, h: bottomH },
                { x: bottomW + gap, y: topH + gap, w: bottomW, h: bottomH },
                { x: (bottomW + gap) * 2, y: topH + gap, w: bottomW, h: bottomH },
                { x: (bottomW + gap) * 3, y: topH + gap, w: bottomW, h: bottomH }
            ];
        }
    },
    '6-top-4-2': {
        cells: 6,
        getRects: (cw, ch, gap) => {
            const topH = (ch - gap) / 2;
            const bottomH = (ch - gap) / 2;
            const topW = (cw - gap * 3) / 4;
            const bottomW = (cw - gap) / 2;
            return [
                { x: 0, y: 0, w: topW, h: topH },
                { x: topW + gap, y: 0, w: topW, h: topH },
                { x: (topW + gap) * 2, y: 0, w: topW, h: topH },
                { x: (topW + gap) * 3, y: 0, w: topW, h: topH },
                { x: 0, y: topH + gap, w: bottomW, h: bottomH },
                { x: bottomW + gap, y: topH + gap, w: bottomW, h: bottomH }
            ];
        }
    },
    '6-left-4-2': {
        cells: 6,
        getRects: (cw, ch, gap) => {
            const leftW = (cw - gap) / 2;
            const rightW = (cw - gap) / 2;
            const leftH = (ch - gap * 3) / 4;
            const rightH = (ch - gap) / 2;
            return [
                { x: 0, y: 0, w: leftW, h: leftH },
                { x: 0, y: leftH + gap, w: leftW, h: leftH },
                { x: 0, y: (leftH + gap) * 2, w: leftW, h: leftH },
                { x: 0, y: (leftH + gap) * 3, w: leftW, h: leftH },
                { x: leftW + gap, y: 0, w: rightW, h: rightH },
                { x: leftW + gap, y: rightH + gap, w: rightW, h: rightH }
            ];
        }
    },
    '6-left-2-4': {
        cells: 6,
        getRects: (cw, ch, gap) => {
            const leftW = (cw - gap) / 2;
            const rightW = (cw - gap) / 2;
            const leftH = (ch - gap) / 2;
            const rightH = (ch - gap * 3) / 4;
            return [
                { x: 0, y: 0, w: leftW, h: leftH },
                { x: 0, y: leftH + gap, w: leftW, h: leftH },
                { x: leftW + gap, y: 0, w: rightW, h: rightH },
                { x: leftW + gap, y: rightH + gap, w: rightW, h: rightH },
                { x: leftW + gap, y: (rightH + gap) * 2, w: rightW, h: rightH },
                { x: leftW + gap, y: (rightH + gap) * 3, w: rightW, h: rightH }
            ];
        }
    },

    // ---------- 7宫格 ----------
    '7-1-3-3': {
        cells: 7,
        getRects: (cw, ch, gap) => {
            const w = (cw - gap * 2) / 3;
            const h = (ch - gap * 2) / 3;
            const rects = [];
            for (let c = 0; c < 3; c++) rects.push({ x: c * (w + gap), y: 0, w, h });
            for (let c = 0; c < 3; c++) rects.push({ x: c * (w + gap), y: h + gap, w, h });
            const thirdY = (h + gap) * 2;
            const thirdW = (cw - gap) / 2;
            rects.push({ x: (cw - thirdW) / 2, y: thirdY, w: thirdW, h });
            return rects;
        }
    },
    '7-top-4-3': {
        cells: 7,
        getRects: (cw, ch, gap) => {
            const topH = (ch - gap) / 2;
            const bottomH = (ch - gap) / 2;
            const topW = (cw - gap * 3) / 4;
            const bottomW = (cw - gap * 2) / 3;
            return [
                { x: 0, y: 0, w: topW, h: topH },
                { x: topW + gap, y: 0, w: topW, h: topH },
                { x: (topW + gap) * 2, y: 0, w: topW, h: topH },
                { x: (topW + gap) * 3, y: 0, w: topW, h: topH },
                { x: 0, y: topH + gap, w: bottomW, h: bottomH },
                { x: bottomW + gap, y: topH + gap, w: bottomW, h: bottomH },
                { x: (bottomW + gap) * 2, y: topH + gap, w: bottomW, h: bottomH }
            ];
        }
    },
    '7-top-3-4': {
        cells: 7,
        getRects: (cw, ch, gap) => {
            const topH = (ch - gap) / 2;
            const bottomH = (ch - gap) / 2;
            const topW = (cw - gap * 2) / 3;
            const bottomW = (cw - gap * 3) / 4;
            return [
                { x: 0, y: 0, w: topW, h: topH },
                { x: topW + gap, y: 0, w: topW, h: topH },
                { x: (topW + gap) * 2, y: 0, w: topW, h: topH },
                { x: 0, y: topH + gap, w: bottomW, h: bottomH },
                { x: bottomW + gap, y: topH + gap, w: bottomW, h: bottomH },
                { x: (bottomW + gap) * 2, y: topH + gap, w: bottomW, h: bottomH },
                { x: (bottomW + gap) * 3, y: topH + gap, w: bottomW, h: bottomH }
            ];
        }
    },
    '7-3-1-3': {
        cells: 7,
        getRects: (cw, ch, gap) => {
            const h = (ch - gap * 2) / 3;
            const w = (cw - gap * 2) / 3;
            return [
                { x: 0, y: 0, w, h },
                { x: w + gap, y: 0, w, h },
                { x: (w + gap) * 2, y: 0, w, h },
                { x: 0, y: h + gap, w: cw, h },
                { x: 0, y: (h + gap) * 2, w, h },
                { x: w + gap, y: (h + gap) * 2, w, h },
                { x: (w + gap) * 2, y: (h + gap) * 2, w, h }
            ];
        }
    },
    '7-3-2-2': {
        cells: 7,
        getRects: (cw, ch, gap) => {
            const h = (ch - gap * 2) / 3;
            const topW = (cw - gap * 2) / 3;
            const midW = (cw - gap) / 2;
            const bottomW = (cw - gap) / 2;
            return [
                { x: 0, y: 0, w: topW, h },
                { x: topW + gap, y: 0, w: topW, h },
                { x: (topW + gap) * 2, y: 0, w: topW, h },
                { x: 0, y: h + gap, w: midW, h },
                { x: midW + gap, y: h + gap, w: midW, h },
                { x: 0, y: (h + gap) * 2, w: bottomW, h },
                { x: bottomW + gap, y: (h + gap) * 2, w: bottomW, h }
            ];
        }
    },
    '7-1-3-3-h2': {
        cells: 7,
        getRects: (cw, ch, gap) => {
            const totalH = ch - gap * 2;
            const topH = totalH * 2 / 4;
            const midH = totalH * 1 / 4;
            const bottomH = totalH * 1 / 4;
            const w = (cw - gap * 2) / 3;
            return [
                { x: 0, y: 0, w: cw, h: topH },
                { x: 0, y: topH + gap, w, h: midH },
                { x: w + gap, y: topH + gap, w, h: midH },
                { x: (w + gap) * 2, y: topH + gap, w, h: midH },
                { x: 0, y: topH + gap + midH + gap, w, h: bottomH },
                { x: w + gap, y: topH + gap + midH + gap, w, h: bottomH },
                { x: (w + gap) * 2, y: topH + gap + midH + gap, w, h: bottomH }
            ];
        }
    },
    '7-2-3-2': {
        cells: 7,
        getRects: (cw, ch, gap) => {
            const h = (ch - gap * 2) / 3;
            const topTotalW = cw - gap;
            const topW1 = topTotalW * 2 / 3;
            const topW2 = topTotalW * 1 / 3;
            const midW = (cw - gap * 2) / 3;
            const bottomTotalW = cw - gap;
            const bottomW1 = bottomTotalW * 1 / 3;
            const bottomW2 = bottomTotalW * 2 / 3;
            return [
                { x: 0, y: 0, w: topW1, h },
                { x: topW1 + gap, y: 0, w: topW2, h },
                { x: 0, y: h + gap, w: midW, h },
                { x: midW + gap, y: h + gap, w: midW, h },
                { x: (midW + gap) * 2, y: h + gap, w: midW, h },
                { x: 0, y: (h + gap) * 2, w: bottomW1, h },
                { x: bottomW1 + gap, y: (h + gap) * 2, w: bottomW2, h }
            ];
        }
    },
    '7-3-3-1': {
        cells: 7,
        getRects: (cw, ch, gap) => {
            const totalH = ch - gap * 2;
            const topH = totalH * 1 / 3;
            const midH = totalH * 1 / 3;
            const bottomH = totalH * 1 / 3;
            const w = (cw - gap * 2) / 3;
            return [
                { x: 0, y: 0, w, h: topH },
                { x: w + gap, y: 0, w, h: topH },
                { x: (w + gap) * 2, y: 0, w, h: topH },
                { x: 0, y: topH + gap, w, h: midH },
                { x: w + gap, y: topH + gap, w, h: midH },
                { x: (w + gap) * 2, y: topH + gap, w, h: midH },
                { x: 0, y: topH + gap + midH + gap, w: cw, h: bottomH }
            ];
        }
    },

    // ---------- 8宫格 ----------
    '8-2x4': {
        cells: 8,
        getRects: (cw, ch, gap) => {
            const w = (cw - gap * 3) / 4;
            const h = (ch - gap) / 2;
            const rects = [];
            for (let r = 0; r < 2; r++) {
                for (let c = 0; c < 4; c++) {
                    rects.push({ x: c * (w + gap), y: r * (h + gap), w, h });
                }
            }
            return rects;
        }
    },
    '8-4x2': {
        cells: 8,
        getRects: (cw, ch, gap) => {
            const w = (cw - gap) / 2;
            const h = (ch - gap * 3) / 4;
            const rects = [];
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 2; c++) {
                    rects.push({ x: c * (w + gap), y: r * (h + gap), w, h });
                }
            }
            return rects;
        }
    },
    '8-3-2-3': {
        cells: 8,
        getRects: (cw, ch, gap) => {
            const h = (ch - gap * 2) / 3;
            const topW = (cw - gap * 2) / 3;
            const midW = (cw - gap) / 2;
            const bottomW = (cw - gap * 2) / 3;
            return [
                { x: 0, y: 0, w: topW, h },
                { x: topW + gap, y: 0, w: topW, h },
                { x: (topW + gap) * 2, y: 0, w: topW, h },
                { x: 0, y: h + gap, w: midW, h },
                { x: midW + gap, y: h + gap, w: midW, h },
                { x: 0, y: (h + gap) * 2, w: bottomW, h },
                { x: bottomW + gap, y: (h + gap) * 2, w: bottomW, h },
                { x: (bottomW + gap) * 2, y: (h + gap) * 2, w: bottomW, h }
            ];
        }
    },
    '8-1-3-4': {
        cells: 8,
        getRects: (cw, ch, gap) => {
            const totalH = ch - gap * 2;
            const topH = totalH * 2 / 4;
            const midH = totalH * 1 / 4;
            const bottomH = totalH * 1 / 4;
            const midTotalW = cw - gap * 2;
            const midW1 = midTotalW * 1 / 4;
            const midW2 = midTotalW * 1 / 4;
            const midW3 = midTotalW * 2 / 4;
            const bottomW = (cw - gap * 3) / 4;
            return [
                { x: 0, y: 0, w: cw, h: topH },
                { x: 0, y: topH + gap, w: midW1, h: midH },
                { x: midW1 + gap, y: topH + gap, w: midW2, h: midH },
                { x: midW1 + gap + midW2 + gap, y: topH + gap, w: midW3, h: midH },
                { x: 0, y: topH + gap + midH + gap, w: bottomW, h: bottomH },
                { x: bottomW + gap, y: topH + gap + midH + gap, w: bottomW, h: bottomH },
                { x: (bottomW + gap) * 2, y: topH + gap + midH + gap, w: bottomW, h: bottomH },
                { x: (bottomW + gap) * 3, y: topH + gap + midH + gap, w: bottomW, h: bottomH }
            ];
        }
    },
    '8-3-2-3-h': {
        cells: 8,
        getRects: (cw, ch, gap) => {
            const colW = (cw - gap * 2) / 3;
            const leftH = (ch - gap * 2) / 3;
            const midH = (ch - gap) / 2;
            const rightH = (ch - gap * 2) / 3;
            const rects = [];
            for (let i = 0; i < 3; i++) {
                rects.push({ x: 0, y: i * (leftH + gap), w: colW, h: leftH });
            }
            for (let i = 0; i < 2; i++) {
                rects.push({ x: colW + gap, y: i * (midH + gap), w: colW, h: midH });
            }
            for (let i = 0; i < 3; i++) {
                rects.push({ x: (colW + gap) * 2, y: i * (rightH + gap), w: colW, h: rightH });
            }
            return rects;
        }
    },

    // ---------- 9宫格 ----------
    '9-grid': {
        cells: 9,
        getRects: (cw, ch, gap) => {
            const w = (cw - gap * 2) / 3;
            const h = (ch - gap * 2) / 3;
            const rects = [];
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    rects.push({ x: c * (w + gap), y: r * (h + gap), w, h });
                }
            }
            return rects;
        }
    },
    '9-1-4-4': {
        cells: 9,
        getRects: (cw, ch, gap) => {
            const totalH = ch - gap * 2;
            const topH = totalH * 2 / 4;
            const midH = totalH * 1 / 4;
            const bottomH = totalH * 1 / 4;
            const midW = (cw - gap * 3) / 4;
            const bottomW = (cw - gap * 3) / 4;
            return [
                { x: 0, y: 0, w: cw, h: topH },
                { x: 0, y: topH + gap, w: midW, h: midH },
                { x: midW + gap, y: topH + gap, w: midW, h: midH },
                { x: (midW + gap) * 2, y: topH + gap, w: midW, h: midH },
                { x: (midW + gap) * 3, y: topH + gap, w: midW, h: midH },
                { x: 0, y: topH + gap + midH + gap, w: bottomW, h: bottomH },
                { x: bottomW + gap, y: topH + gap + midH + gap, w: bottomW, h: bottomH },
                { x: (bottomW + gap) * 2, y: topH + gap + midH + gap, w: bottomW, h: bottomH },
                { x: (bottomW + gap) * 3, y: topH + gap + midH + gap, w: bottomW, h: bottomH }
            ];
        }
    },
    '9-3-3-3-col': {
        cells: 9,
        getRects: (cw, ch, gap) => {
            const h = (ch - gap * 2) / 3;
            const totalW = cw - gap * 2;
            const col1 = totalW * 1 / 4;
            const col2 = totalW * 2 / 4;
            const col3 = totalW * 1 / 4;
            const rects = [];
            for (let r = 0; r < 3; r++) {
                const y = r * (h + gap);
                rects.push({ x: 0, y, w: col1, h });
                rects.push({ x: col1 + gap, y, w: col2, h });
                rects.push({ x: col1 + gap + col2 + gap, y, w: col3, h });
            }
            return rects;
        }
    },
    '9-4-1-4': {
        cells: 9,
        getRects: (cw, ch, gap) => {
            const totalH = ch - gap * 2;
            const topH = totalH * 1 / 4;
            const midH = totalH * 2 / 4;
            const bottomH = totalH * 1 / 4;
            const topW = (cw - gap * 3) / 4;
            const bottomW = (cw - gap * 3) / 4;
            return [
                { x: 0, y: 0, w: topW, h: topH },
                { x: topW + gap, y: 0, w: topW, h: topH },
                { x: (topW + gap) * 2, y: 0, w: topW, h: topH },
                { x: (topW + gap) * 3, y: 0, w: topW, h: topH },
                { x: 0, y: topH + gap, w: cw, h: midH },
                { x: 0, y: topH + gap + midH + gap, w: bottomW, h: bottomH },
                { x: bottomW + gap, y: topH + gap + midH + gap, w: bottomW, h: bottomH },
                { x: (bottomW + gap) * 2, y: topH + gap + midH + gap, w: bottomW, h: bottomH },
                { x: (bottomW + gap) * 3, y: topH + gap + midH + gap, w: bottomW, h: bottomH }
            ];
        }
    },
    '9-1-2-3-3': {
        cells: 9,
        getRects: (cw, ch, gap) => {
            const totalH = ch - gap * 3;
            const rowH = totalH / 4;
            const row2W = (cw - gap) / 2;
            const row3W = (cw - gap * 2) / 3;
            const row4W = (cw - gap * 2) / 3;
            let y = 0;
            const rects = [];
            rects.push({ x: 0, y, w: cw, h: rowH });
            y += rowH + gap;
            rects.push({ x: 0, y, w: row2W, h: rowH });
            rects.push({ x: row2W + gap, y, w: row2W, h: rowH });
            y += rowH + gap;
            for (let c = 0; c < 3; c++) {
                rects.push({ x: c * (row3W + gap), y, w: row3W, h: rowH });
            }
            y += rowH + gap;
            for (let c = 0; c < 3; c++) {
                rects.push({ x: c * (row4W + gap), y, w: row4W, h: rowH });
            }
            return rects;
        }
    },
    '9-3-3-3-var': {
        cells: 9,
        getRects: (cw, ch, gap) => {
            const h = (ch - gap * 2) / 3;
            const totalW = cw - gap * 2;
            const topRatios = [2, 1, 1];
            const midRatios = [1, 1, 2];
            const bottomRatios = [1, 2, 1];
            const sumTop = topRatios.reduce((a, b) => a + b, 0);
            const sumMid = midRatios.reduce((a, b) => a + b, 0);
            const sumBottom = bottomRatios.reduce((a, b) => a + b, 0);
            const topW = topRatios.map(r => totalW * r / sumTop);
            const midW = midRatios.map(r => totalW * r / sumMid);
            const bottomW = bottomRatios.map(r => totalW * r / sumBottom);
            const rects = [];
            let y = 0;
            let x = 0;
            for (let c = 0; c < 3; c++) {
                rects.push({ x, y, w: topW[c], h });
                x += topW[c] + gap;
            }
            y += h + gap;
            x = 0;
            for (let c = 0; c < 3; c++) {
                rects.push({ x, y, w: midW[c], h });
                x += midW[c] + gap;
            }
            y += h + gap;
            x = 0;
            for (let c = 0; c < 3; c++) {
                rects.push({ x, y, w: bottomW[c], h });
                x += bottomW[c] + gap;
            }
            return rects;
        }
    }
};