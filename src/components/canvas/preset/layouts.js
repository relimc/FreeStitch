// src/components/canvas/preset/layouts.js

export const presetLayouts = {
    // 2宫格
    '2-horizontal': { rows: 1, cols: 2, cells: 2, colRatios: [1, 1] },
    '2-vertical': { rows: 2, cols: 1, cells: 2, rowRatios: [1, 1] },
    '2-vertical-2-1': { rows: 2, cols: 1, cells: 2, rowRatios: [2, 1] },
    '2-horizontal-2-1': { rows: 1, cols: 2, cells: 2, colRatios: [2, 1] },
    '2-horizontal-1-2': { rows: 1, cols: 2, cells: 2, colRatios: [1, 2] },
    '2-vertical-1-2': { rows: 2, cols: 1, cells: 2, rowRatios: [1, 2] },
    '2-trapezoid-horizontal': { type: 'trapezoid', direction: 'horizontal', cells: 2 },

    // 3宫格
    '3-horizontal': { rows: 1, cols: 3, cells: 3, colRatios: [1, 1, 1] },
    '3-vertical': { rows: 3, cols: 1, cells: 3, rowRatios: [1, 1, 1] },

    // 4宫格
    '4-grid': { rows: 2, cols: 2, cells: 4, rowRatios: [1, 1], colRatios: [1, 1] },
    '4-horizontal': { rows: 1, cols: 4, cells: 4, colRatios: [1, 1, 1, 1] },
    '4-vertical': { rows: 4, cols: 1, cells: 4, rowRatios: [1, 1, 1, 1] },

    // 5宫格
    '5-2x3': { rows: 2, cols: 3, cells: 5, rowRatios: [1, 1], colRatios: [1, 1, 1] },

    // 6宫格
    '6-2x3': { rows: 2, cols: 3, cells: 6, rowRatios: [1, 1], colRatios: [1, 1, 1] },
    '6-3x2': { rows: 3, cols: 2, cells: 6, rowRatios: [1, 1, 1], colRatios: [1, 1] },

    // 7宫格
    '7-1-3-3': { rows: 3, cols: 3, cells: 7, rowRatios: [1, 1, 1], colRatios: [1, 1, 1] },

    // 8宫格
    '8-2x4': { rows: 2, cols: 4, cells: 8, rowRatios: [1, 1], colRatios: [1, 1, 1, 1] },
    '8-4x2': { rows: 4, cols: 2, cells: 8, rowRatios: [1, 1, 1, 1], colRatios: [1, 1] },

    // 9宫格
    '9-grid': { rows: 3, cols: 3, cells: 9, rowRatios: [1, 1, 1], colRatios: [1, 1, 1] },

    // 图文模式
    'text-simple': { type: 'text', cells: 1 }
};