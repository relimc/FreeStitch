// src/components/canvas/preset/usePresetState.js

import { ref, computed } from 'vue';

export function usePresetState(props, emit) {
    const cells = ref([]);
    const selectedCellIndex = ref(-1);
    const currentLayout = ref(null);
    const imageOffsets = ref(new Map()); // key: imageId, value: { offsetX, offsetY }
    const imageCache = new Map(); // 图片缓存
    const deleteButtonRects = ref([]);

    const isTextMode = computed(() => props.subModeId === 'text-simple');
    const isTrapezoidMode = computed(() => currentLayout.value?.type === 'trapezoid');

    const initLayout = (layouts, subId) => {
        const layout = layouts[subId];
        if (!layout) {
            console.warn('未找到布局定义:', subId);
            return false;
        }
        currentLayout.value = layout;
        const newCells = [];
        for (let i = 0; i < layout.cells; i++) {
            newCells.push({ imageId: null, imageData: null });
        }
        cells.value = newCells;
        emit('update:cells', cells.value);
        imageOffsets.value.clear();
        imageCache.clear();
        return true;
    };

    const selectCell = (idx) => {
        selectedCellIndex.value = idx;
        emit('select-cell', idx);
    };

    const removeCellImage = (idx) => {
        if (idx < 0 || idx >= cells.value.length) return;
        const newCells = [...cells.value];
        newCells[idx] = { imageId: null, imageData: null };
        cells.value = newCells;
        emit('update:cells', cells.value);
        if (selectedCellIndex.value === idx) selectedCellIndex.value = -1;
    };

    const addImageToCell = (idx, imageId, imageData) => {
        if (idx < 0 || idx >= cells.value.length) return false;
        const newCells = [...cells.value];
        newCells[idx] = { imageId, imageData };
        cells.value = newCells;
        emit('update:cells', cells.value);
        if (!imageOffsets.value.has(imageId)) {
            imageOffsets.value.set(imageId, { offsetX: 0, offsetY: 0 });
        }
        return true;
    };

    const findEmptyCell = () => {
        return cells.value.findIndex(cell => !cell.imageId);
    };

    // 图片缓存操作
    const getCachedImage = (id) => imageCache.get(id);
    const setCachedImage = (id, img) => imageCache.set(id, img);

    return {
        // 状态
        cells,
        selectedCellIndex,
        currentLayout,
        imageOffsets,
        deleteButtonRects,
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
        // 清除
        clearCache: () => imageCache.clear(),
        resetOffsets: () => imageOffsets.value.clear(),
    };
}