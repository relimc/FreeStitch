// src/components/canvas/preset/usePresetState.js

import { ref, computed } from 'vue';

export function usePresetState(props, emit) {
    // ---------- 核心状态 ----------
    const cells = ref([]);                // 格子数组，每个元素 { type: 'image', imageId, imageData, offsetX, offsetY }
    const selectedCellIndex = ref(-1);    // 当前选中的格子索引
    const currentLayout = ref(null);      // 当前布局对象
    const imageOffsets = ref(new Map());  // 图片偏移映射（备用，实际已存储在 cell 中）
    const imageCache = new Map();         // 图片缓存 (imageId -> Image 对象)
    const deleteButtonRects = ref([]);    // 删除按钮区域（用于点击检测）
    
    // 文字叠加偏移（用于拖拽）
    const textOffsetX = ref(0);
    const textOffsetY = ref(0);

    // ---------- 计算属性 ----------
    const isTextMode = computed(() => props.subModeId === 'text-simple'); // 保留兼容（可能无此模式）
    const isTrapezoidMode = computed(() => currentLayout.value?.type === 'trapezoid');

    // ---------- 布局初始化 ----------
    const initLayout = (layout) => {
        currentLayout.value = layout;
        const newCells = [];
        // 所有格子均为图片类型（文字已改为叠加层）
        for (let i = 0; i < layout.cells; i++) {
            newCells.push({
                type: 'image',
                imageId: null,
                imageData: null,
                offsetX: 0,
                offsetY: 0
            });
        }
        cells.value = newCells;
        emit('update:cells', cells.value);
        // 重置偏移
        imageOffsets.value.clear();
        // 重置文字偏移
        textOffsetX.value = 0;
        textOffsetY.value = 0;
        return true;
    };

    // ---------- 格子操作 ----------
    const selectCell = (idx) => {
        if (idx >= -1 && idx < cells.value.length) {
            selectedCellIndex.value = idx;
            emit('select-cell', idx);
        }
    };

    const removeCellImage = (idx) => {
        if (idx < 0 || idx >= cells.value.length) return;
        const newCells = [...cells.value];
        const cell = newCells[idx];
        if (cell.type === 'image') {
            // 清除图片相关数据
            cell.imageId = null;
            cell.imageData = null;
            cell.offsetX = 0;
            cell.offsetY = 0;
        }
        cells.value = newCells;
        emit('update:cells', cells.value);
        if (selectedCellIndex.value === idx) {
            selectedCellIndex.value = -1;
        }
    };

    const addImageToCell = (idx, imageId, imageData) => {
        if (idx < 0 || idx >= cells.value.length) return false;
        const newCells = [...cells.value];
        const cell = newCells[idx];
        if (cell.type !== 'image') return false;
        cell.imageId = imageId;
        cell.imageData = imageData;
        cell.offsetX = 0;
        cell.offsetY = 0;
        cells.value = newCells;
        emit('update:cells', cells.value);
        return true;
    };

    const findEmptyCell = () => {
        return cells.value.findIndex(cell => cell.type === 'image' && !cell.imageId);
    };

    // ---------- 图片缓存 ----------
    const getCachedImage = (id) => imageCache.get(id);
    const setCachedImage = (id, img) => imageCache.set(id, img);
    const clearCache = () => imageCache.clear();

    // ---------- 重置所有状态 ----------
    const resetAll = () => {
        cells.value = [];
        selectedCellIndex.value = -1;
        currentLayout.value = null;
        imageOffsets.value.clear();
        imageCache.clear();
        deleteButtonRects.value = [];
        textOffsetX.value = 0;
        textOffsetY.value = 0;
    };

    return {
        // 状态
        cells,
        selectedCellIndex,
        currentLayout,
        imageOffsets,
        deleteButtonRects,
        textOffsetX,
        textOffsetY,
        // 计算属性
        isTextMode,
        isTrapezoidMode,
        // 方法
        initLayout,
        selectCell,
        removeCellImage,
        addImageToCell,
        findEmptyCell,
        getCachedImage,
        setCachedImage,
        clearCache,
        resetAll
    };
}