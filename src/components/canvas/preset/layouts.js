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
            const leftW = (cw - gap) * 1 / 3;   // 左边总宽（两个小格子）
            const rightW = (cw - gap) * 2 / 3;  // 右边大格子
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
            const leftW = (cw - gap) * 2 / 3;   // 左边大格子
            const rightW = (cw - gap) * 1 / 3;  // 右边总宽（两个小格子）
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
    // ✅ 新增：上一下三（上下高度1:1）
    '4-1-3': {
        cells: 4,
        getRects: (cw, ch, gap) => {
            const topH = (ch - gap) / 2;          // 上排高度
            const bottomH = (ch - gap) / 2;        // 下排高度
            const bottomW = (cw - gap * 2) / 3;    // 下排每个格子的宽度
            return [
                { x: 0, y: 0, w: cw, h: topH },                           // 上排1个
                { x: 0, y: topH + gap, w: bottomW, h: bottomH },          // 下排第1个
                { x: bottomW + gap, y: topH + gap, w: bottomW, h: bottomH }, // 下排第2个
                { x: (bottomW + gap) * 2, y: topH + gap, w: bottomW, h: bottomH } // 下排第3个
            ];
        }
    },

    // ✅ 新增：上三下一（上排3个，下排1个，宽度比1:1:1，下排大格子宽度与上排总宽一致）
    '4-3-1': {
        cells: 4,
        getRects: (cw, ch, gap) => {
            const topH = (ch - gap) / 2;
            const bottomH = (ch - gap) / 2;
            const topW = (cw - gap * 2) / 3; // 上排每个格子宽度
            return [
                { x: 0, y: 0, w: topW, h: topH },
                { x: topW + gap, y: 0, w: topW, h: topH },
                { x: (topW + gap) * 2, y: 0, w: topW, h: topH },
                { x: 0, y: topH + gap, w: cw, h: bottomH } // 下排占满宽度
            ];
        }
    },

    // ✅ 新增：左一右三（左边1个大格子，右边3个）
    '4-1-3-horizontal': {
        cells: 4,
        getRects: (cw, ch, gap) => {
            const leftW = (cw - gap) * 2 / 3;   // 左边大格子
            const rightW = (cw - gap) * 1 / 3;  // 右边总宽（3个小格子）
            const cellH = (ch - gap * 2) / 3;   // 右边每个格子高度
            return [
                { x: 0, y: 0, w: leftW, h: ch },                           // 左
                { x: leftW + gap, y: 0, w: rightW, h: cellH },            // 右上
                { x: leftW + gap, y: cellH + gap, w: rightW, h: cellH },  // 右中
                { x: leftW + gap, y: (cellH + gap) * 2, w: rightW, h: cellH } // 右下
            ];
        }
    },

    // ✅ 新增：左三右一（左边3个，右边1个大格子）
    '4-3-1-horizontal': {
        cells: 4,
        getRects: (cw, ch, gap) => {
            const leftW = (cw - gap) * 1 / 3;   // 左边总宽（3个小格子）
            const rightW = (cw - gap) * 2 / 3;  // 右边大格子
            const cellH = (ch - gap * 2) / 3;   // 左边每个格子高度
            return [
                { x: 0, y: 0, w: leftW, h: cellH },
                { x: 0, y: cellH + gap, w: leftW, h: cellH },
                { x: 0, y: (cellH + gap) * 2, w: leftW, h: cellH },
                { x: leftW + gap, y: 0, w: rightW, h: ch } // 右
            ];
        }
    },

    '4-diagonal': {
        cells: 4,
        getRects: (cw, ch, gap) => {
            const h = (ch - gap) / 2;
            const w1 = (cw - gap) * 2 / 3; // 大格宽度
            const w2 = (cw - gap) * 1 / 3; // 小格宽度
            return [
                { x: 0, y: 0, w: w1, h: h },                 // 左上（大）
                { x: w1 + gap, y: 0, w: w2, h: h },          // 右上（小）
                { x: 0, y: h + gap, w: w2, h: h },           // 左下（小）
                { x: w2 + gap, y: h + gap, w: w1, h: h }     // 右下（大）
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

    // ✅ 新增：左二右三（左二和右三整体宽度1:1）
    '5-left-2-3': {
        cells: 5,
        getRects: (cw, ch, gap) => {
            const leftW = (cw - gap) / 2;          // 左半宽
            const rightW = (cw - gap) / 2;         // 右半宽
            const leftCellH = (ch - gap) / 2;      // 左边上下各占一半
            const rightCellH = (ch - gap) / 3;     // 右边三个纵向均分
            return [
                // 左边两个：上下排列
                { x: 0, y: 0, w: leftW, h: leftCellH },
                { x: 0, y: leftCellH + gap, w: leftW, h: leftCellH },
                // 右边三个：纵向排列
                { x: leftW + gap, y: 0, w: rightW, h: rightCellH },
                { x: leftW + gap, y: rightCellH + gap, w: rightW, h: rightCellH },
                { x: leftW + gap, y: (rightCellH + gap) * 2, w: rightW, h: rightCellH }
            ];
        }
    },
    // ✅ 新增：左三右二（左三和右二整体宽度1:1）
    '5-left-3-2': {
        cells: 5,
        getRects: (cw, ch, gap) => {
            const leftW = (cw - gap) / 2;
            const rightW = (cw - gap) / 2;
            const leftCellH = (ch - gap) / 3;
            const rightCellH = (ch - gap) / 2;
            return [
                // 左边三个：纵向排列
                { x: 0, y: 0, w: leftW, h: leftCellH },
                { x: 0, y: leftCellH + gap, w: leftW, h: leftCellH },
                { x: 0, y: (leftCellH + gap) * 2, w: leftW, h: leftCellH },
                // 右边两个：上下排列
                { x: leftW + gap, y: 0, w: rightW, h: rightCellH },
                { x: leftW + gap, y: rightCellH + gap, w: rightW, h: rightCellH }
            ];
        }
    },
    // ✅ 新增：上二下三（上二和下三整体高度1:1）
    '5-top-2-3': {
        cells: 5,
        getRects: (cw, ch, gap) => {
            const topH = (ch - gap) / 2;
            const bottomH = (ch - gap) / 2;
            const topCellW = (cw - gap) / 2;       // 上排两个水平均分
            const bottomCellW = (cw - gap) / 3;    // 下排三个水平均分
            return [
                // 上排两个：水平排列
                { x: 0, y: 0, w: topCellW, h: topH },
                { x: topCellW + gap, y: 0, w: topCellW, h: topH },
                // 下排三个：水平排列
                { x: 0, y: topH + gap, w: bottomCellW, h: bottomH },
                { x: bottomCellW + gap, y: topH + gap, w: bottomCellW, h: bottomH },
                { x: (bottomCellW + gap) * 2, y: topH + gap, w: bottomCellW, h: bottomH }
            ];
        }
    },
    // ✅ 新增：上三下二（上三和下二整体高度1:1）
    '5-top-3-2': {
        cells: 5,
        getRects: (cw, ch, gap) => {
            const topH = (ch - gap) / 2;
            const bottomH = (ch - gap) / 2;
            const topCellW = (cw - gap) / 3;       // 上排三个水平均分
            const bottomCellW = (cw - gap) / 2;    // 下排两个水平均分
            return [
                // 上排三个：水平排列
                { x: 0, y: 0, w: topCellW, h: topH },
                { x: topCellW + gap, y: 0, w: topCellW, h: topH },
                { x: (topCellW + gap) * 2, y: 0, w: topCellW, h: topH },
                // 下排两个：水平排列
                { x: 0, y: topH + gap, w: bottomCellW, h: bottomH },
                { x: bottomCellW + gap, y: topH + gap, w: bottomCellW, h: bottomH }
            ];
        }
    },

    // ---------- 6宫格 ----------
    '6-2x3': { cells: 6, getRects: (cw, ch, gap) => { /* ... 2行3列 */ } },
    '6-3x2': { cells: 6, getRects: (cw, ch, gap) => { /* ... 3行2列 */ } },

    // ✅ 新增：上2下4（上下各占一半高度）
    '6-top-2-4': {
        cells: 6,
        getRects: (cw, ch, gap) => {
            const topH = (ch - gap) / 2;
            const bottomH = (ch - gap) / 2;
            // 上排：2个，宽度均分
            const topW = (cw - gap) / 2;
            // 下排：4个，宽度均分
            const bottomW = (cw - gap * 3) / 4;
            return [
                { x: 0, y: 0, w: topW, h: topH },
                { x: topW + gap, y: 0, w: topW, h: topH },
                // 下排4个
                { x: 0, y: topH + gap, w: bottomW, h: bottomH },
                { x: bottomW + gap, y: topH + gap, w: bottomW, h: bottomH },
                { x: (bottomW + gap) * 2, y: topH + gap, w: bottomW, h: bottomH },
                { x: (bottomW + gap) * 3, y: topH + gap, w: bottomW, h: bottomH }
            ];
        }
    },
    // ✅ 新增：上4下2（上下各占一半高度）
    '6-top-4-2': {
        cells: 6,
        getRects: (cw, ch, gap) => {
            const topH = (ch - gap) / 2;
            const bottomH = (ch - gap) / 2;
            // 上排：4个，宽度均分
            const topW = (cw - gap * 3) / 4;
            // 下排：2个，宽度均分
            const bottomW = (cw - gap) / 2;
            return [
                { x: 0, y: 0, w: topW, h: topH },
                { x: topW + gap, y: 0, w: topW, h: topH },
                { x: (topW + gap) * 2, y: 0, w: topW, h: topH },
                { x: (topW + gap) * 3, y: 0, w: topW, h: topH },
                // 下排2个
                { x: 0, y: topH + gap, w: bottomW, h: bottomH },
                { x: bottomW + gap, y: topH + gap, w: bottomW, h: bottomH }
            ];
        }
    },
    // ✅ 新增：左4右2（左右各占一半宽度）
    '6-left-4-2': {
        cells: 6,
        getRects: (cw, ch, gap) => {
            const leftW = (cw - gap) / 2;
            const rightW = (cw - gap) / 2;
            // 左列4个，高度均分
            const leftH = (ch - gap * 3) / 4;
            // 右列2个，高度均分
            const rightH = (ch - gap) / 2;
            return [
                // 左列4个
                { x: 0, y: 0, w: leftW, h: leftH },
                { x: 0, y: leftH + gap, w: leftW, h: leftH },
                { x: 0, y: (leftH + gap) * 2, w: leftW, h: leftH },
                { x: 0, y: (leftH + gap) * 3, w: leftW, h: leftH },
                // 右列2个
                { x: leftW + gap, y: 0, w: rightW, h: rightH },
                { x: leftW + gap, y: rightH + gap, w: rightW, h: rightH }
            ];
        }
    },
    // ✅ 新增：左2右4（左右各占一半宽度）
    '6-left-2-4': {
        cells: 6,
        getRects: (cw, ch, gap) => {
            const leftW = (cw - gap) / 2;
            const rightW = (cw - gap) / 2;
            // 左列2个，高度均分
            const leftH = (ch - gap) / 2;
            // 右列4个，高度均分
            const rightH = (ch - gap * 3) / 4;
            return [
                // 左列2个
                { x: 0, y: 0, w: leftW, h: leftH },
                { x: 0, y: leftH + gap, w: leftW, h: leftH },
                // 右列4个
                { x: leftW + gap, y: 0, w: rightW, h: rightH },
                { x: leftW + gap, y: rightH + gap, w: rightW, h: rightH },
                { x: leftW + gap, y: (rightH + gap) * 2, w: rightW, h: rightH },
                { x: leftW + gap, y: (rightH + gap) * 3, w: rightW, h: rightH }
            ];
        }
    },

    // ---------- 7宫格 ----------
    '7-1-3-3': { // 原有 1-3-3 高度均分
        cells: 7,
        getRects: (cw, ch, gap) => {
            const h = (ch - gap * 2) / 3;
            const w = (cw - gap * 2) / 3;
            const rects = [];
            // 第一行：1个占满
            rects.push({ x: 0, y: 0, w: cw, h });
            // 第二行：3个
            for (let c = 0; c < 3; c++) {
                rects.push({ x: c * (w + gap), y: h + gap, w, h });
            }
            // 第三行：3个
            for (let c = 0; c < 3; c++) {
                rects.push({ x: c * (w + gap), y: (h + gap) * 2, w, h });
            }
            return rects;
        }
    },

    // ✅ 新增：上4下3（高度1:1）
    '7-top-4-3': {
        cells: 7,
        getRects: (cw, ch, gap) => {
            const topH = (ch - gap) / 2;
            const bottomH = (ch - gap) / 2;
            const topW = (cw - gap * 3) / 4;
            const bottomW = (cw - gap * 2) / 3;
            return [
                // 上排4个
                { x: 0, y: 0, w: topW, h: topH },
                { x: topW + gap, y: 0, w: topW, h: topH },
                { x: (topW + gap) * 2, y: 0, w: topW, h: topH },
                { x: (topW + gap) * 3, y: 0, w: topW, h: topH },
                // 下排3个
                { x: 0, y: topH + gap, w: bottomW, h: bottomH },
                { x: bottomW + gap, y: topH + gap, w: bottomW, h: bottomH },
                { x: (bottomW + gap) * 2, y: topH + gap, w: bottomW, h: bottomH }
            ];
        }
    },
    // ✅ 新增：上3下4（高度1:1）
    '7-top-3-4': {
        cells: 7,
        getRects: (cw, ch, gap) => {
            const topH = (ch - gap) / 2;
            const bottomH = (ch - gap) / 2;
            const topW = (cw - gap * 2) / 3;
            const bottomW = (cw - gap * 3) / 4;
            return [
                // 上排3个
                { x: 0, y: 0, w: topW, h: topH },
                { x: topW + gap, y: 0, w: topW, h: topH },
                { x: (topW + gap) * 2, y: 0, w: topW, h: topH },
                // 下排4个
                { x: 0, y: topH + gap, w: bottomW, h: bottomH },
                { x: bottomW + gap, y: topH + gap, w: bottomW, h: bottomH },
                { x: (bottomW + gap) * 2, y: topH + gap, w: bottomW, h: bottomH },
                { x: (bottomW + gap) * 3, y: topH + gap, w: bottomW, h: bottomH }
            ];
        }
    },
    // ✅ 新增：3-1-3（上中下高度1:1:1）
    '7-3-1-3': {
        cells: 7,
        getRects: (cw, ch, gap) => {
            const h = (ch - gap * 2) / 3;
            const w = (cw - gap * 2) / 3;
            return [
                // 第一行：3个
                { x: 0, y: 0, w, h },
                { x: w + gap, y: 0, w, h },
                { x: (w + gap) * 2, y: 0, w, h },
                // 第二行：1个占满
                { x: 0, y: h + gap, w: cw, h },
                // 第三行：3个
                { x: 0, y: (h + gap) * 2, w, h },
                { x: w + gap, y: (h + gap) * 2, w, h },
                { x: (w + gap) * 2, y: (h + gap) * 2, w, h }
            ];
        }
    },
    // ✅ 新增：3-2-2（上中下高度1:1:1）
    '7-3-2-2': {
        cells: 7,
        getRects: (cw, ch, gap) => {
            const h = (ch - gap * 2) / 3;
            const topW = (cw - gap * 2) / 3;
            const midW = (cw - gap) / 2;
            const bottomW = (cw - gap) / 2;
            return [
                // 第一行：3个
                { x: 0, y: 0, w: topW, h },
                { x: topW + gap, y: 0, w: topW, h },
                { x: (topW + gap) * 2, y: 0, w: topW, h },
                // 第二行：2个
                { x: 0, y: h + gap, w: midW, h },
                { x: midW + gap, y: h + gap, w: midW, h },
                // 第三行：2个
                { x: 0, y: (h + gap) * 2, w: bottomW, h },
                { x: bottomW + gap, y: (h + gap) * 2, w: bottomW, h }
            ];
        }
    },
    // ✅ 新增：1-3-3（上中下高度2:1:1，上排占满宽度，中下各3个等宽）
    '7-1-3-3-h2': {
        cells: 7,
        getRects: (cw, ch, gap) => {
            const totalH = ch - gap * 2;
            const topH = totalH * 2 / 4;   // 2份
            const midH = totalH * 1 / 4;   // 1份
            const bottomH = totalH * 1 / 4; // 1份
            const w = (cw - gap * 2) / 3;
            return [
                // 第一行：1个占满
                { x: 0, y: 0, w: cw, h: topH },
                // 第二行：3个
                { x: 0, y: topH + gap, w, h: midH },
                { x: w + gap, y: topH + gap, w, h: midH },
                { x: (w + gap) * 2, y: topH + gap, w, h: midH },
                // 第三行：3个
                { x: 0, y: topH + gap + midH + gap, w, h: bottomH },
                { x: w + gap, y: topH + gap + midH + gap, w, h: bottomH },
                { x: (w + gap) * 2, y: topH + gap + midH + gap, w, h: bottomH }
            ];
        }
    },
    // ✅ 新增：2-3-2（上中下高度1:1:1，上排2个宽度比2:1，中排3个等宽，下排2个宽度比1:2）
    '7-2-3-2': {
        cells: 7,
        getRects: (cw, ch, gap) => {
            const h = (ch - gap * 2) / 3;
            // 上排2个，宽度比2:1
            const topTotalW = cw - gap;
            const topW1 = topTotalW * 2 / 3;
            const topW2 = topTotalW * 1 / 3;
            // 中排3个，等宽
            const midW = (cw - gap * 2) / 3;
            // 下排2个，宽度比1:2
            const bottomTotalW = cw - gap;
            const bottomW1 = bottomTotalW * 1 / 3;
            const bottomW2 = bottomTotalW * 2 / 3;
            return [
                // 上排
                { x: 0, y: 0, w: topW1, h },
                { x: topW1 + gap, y: 0, w: topW2, h },
                // 中排
                { x: 0, y: h + gap, w: midW, h },
                { x: midW + gap, y: h + gap, w: midW, h },
                { x: (midW + gap) * 2, y: h + gap, w: midW, h },
                // 下排
                { x: 0, y: (h + gap) * 2, w: bottomW1, h },
                { x: bottomW1 + gap, y: (h + gap) * 2, w: bottomW2, h }
            ];
        }
    },

    '7-3-3-1': {
        cells: 7,
        getRects: (cw, ch, gap) => {
            const totalH = ch - gap * 2;
            const topH = totalH * 1 / 4;    // 1份
            const midH = totalH * 1 / 4;    // 1份
            const bottomH = totalH * 2 / 4; // 2份
            const topW = (cw - gap * 2) / 3;
            const midW = (cw - gap * 2) / 3;
            return [
                // 上排3个
                { x: 0, y: 0, w: topW, h: topH },
                { x: topW + gap, y: 0, w: topW, h: topH },
                { x: (topW + gap) * 2, y: 0, w: topW, h: topH },
                // 中排3个
                { x: 0, y: topH + gap, w: midW, h: midH },
                { x: midW + gap, y: topH + gap, w: midW, h: midH },
                { x: (midW + gap) * 2, y: topH + gap, w: midW, h: midH },
                // 下排1个（占满宽度）
                { x: 0, y: topH + gap + midH + gap, w: cw, h: bottomH }
            ];
        }
    },    

    // ---------- 8宫格 ----------
    '8-2x4': { cells: 8, getRects: (cw, ch, gap) => { /* 2行4列，宽度均分 */ } },
    '8-4x2': { cells: 8, getRects: (cw, ch, gap) => { /* 4行2列，高度均分 */ } },

    // ✅ 新增：3-2-3（上中下 1:1:1）
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
    '8-3-3-2': {
        cells: 8,
        getRects: (cw, ch, gap) => {
            const totalH = ch - gap * 2;
            const topH = totalH * 1 / 4;
            const midH = totalH * 1 / 4;
            const bottomH = totalH * 2 / 4;
            const topW = (cw - gap * 2) / 3;
            const midW = (cw - gap * 2) / 3;
            const bottomW = (cw - gap) / 2;
            return [
                { x: 0, y: 0, w: topW, h: topH },
                { x: topW + gap, y: 0, w: topW, h: topH },
                { x: (topW + gap) * 2, y: 0, w: topW, h: topH },
                { x: 0, y: topH + gap, w: midW, h: midH },
                { x: midW + gap, y: topH + gap, w: midW, h: midH },
                { x: (midW + gap) * 2, y: topH + gap, w: midW, h: midH },
                { x: 0, y: topH + gap + midH + gap, w: bottomW, h: bottomH },
                { x: bottomW + gap, y: topH + gap + midH + gap, w: bottomW, h: bottomH }
            ];
        }
    },
    // ✅ 新增：1-3-4（上中下 2:1:1，中排宽度比1:1:2）
    '8-1-3-4': {
        cells: 8,
        getRects: (cw, ch, gap) => {
            const totalH = ch - gap * 2;
            const topH = totalH * 2 / 4;
            const midH = totalH * 1 / 4;
            const bottomH = totalH * 1 / 4;
            // 中排3个宽度比例1:1:2
            const midTotal = cw - gap * 2;
            const midW1 = midTotal * 1 / 4;
            const midW2 = midTotal * 1 / 4;
            const midW3 = midTotal * 2 / 4;
            // 下排4个等宽
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
            const colW = (cw - gap * 2) / 3; // 每列等宽
            // 左列3个，高度均分
            const leftH = (ch - gap * 2) / 3;
            // 中列2个，高度均分
            const midH = (ch - gap) / 2;
            // 右列3个，高度均分
            const rightH = (ch - gap * 2) / 3;
            const rects = [];
            // 左列3个
            for (let i = 0; i < 3; i++) {
                rects.push({ x: 0, y: i * (leftH + gap), w: colW, h: leftH });
            }
            // 中列2个
            for (let i = 0; i < 2; i++) {
                rects.push({ x: colW + gap, y: i * (midH + gap), w: colW, h: midH });
            }
            // 右列3个
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
    },

    // ---------- 图文模式 ----------
    'text-simple': {
        type: 'text',
        cells: 1
    }
};