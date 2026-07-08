// src/components/canvas/preset/usePresetCanvas.js

import { ref, watch, onMounted, onUnmounted } from 'vue';
import { usePresetState } from './usePresetState.js';
import { usePresetDrawFunctions } from './usePresetDrawFunctions.js';
import { usePresetRender } from './usePresetRender.js';
import { usePresetInteraction } from './usePresetInteraction.js';
import { usePresetExport } from './usePresetExport.js';
import { presetLayouts } from './layouts.js';

export function usePresetCanvas(props, emit) {
    // 1. 状态管理
    const state = usePresetState(props, emit);

    const {
        cells,
        currentLayout,
        selectedCellIndex,
        isTextMode,
        isTrapezoidMode,
        textOffsetX,
        textOffsetY,
        selectCell: stateSelectCell,
        removeCellImage: stateRemoveCellImage,
        addImageToCell: stateAddImageToCell,
        clearCache,
    } = state;

    // 2. Canvas 引用
    const canvasRef = ref(null);

    // 3. 绘制函数
    const drawFunctions = usePresetDrawFunctions(props, state);

    // 4. 渲染模块
    const renderModule = usePresetRender(props, state, drawFunctions, canvasRef);
    const { renderCanvas, cancelRender } = renderModule;

    // 5. 交互模块
    const interaction = usePresetInteraction(props, state, renderCanvas);

    // 6. 导出模块
    const exportModule = usePresetExport(props, state, drawFunctions);

    // 7. 初始化布局
    const initLayout = (subId) => {
        const layout = presetLayouts[subId];
        if (!layout) {
            console.warn('未找到布局定义:', subId);
            return false;
        }
        state.initLayout(layout);
        textOffsetX.value = 0;
        textOffsetY.value = 0;
        renderCanvas();
        return true;
    };

    // 8. 封装方法
    const selectCell = (idx) => {
        stateSelectCell(idx);
        renderCanvas();
    };

    const removeCellImage = (idx) => {
        stateRemoveCellImage(idx);
        renderCanvas();
    };

    const addImageToSelectedCell = async (imageId, imageData) => {
        const idx = selectedCellIndex.value;
        if (idx === -1) {
            alert('请先点击一个格子');
            return false;
        }
        const cell = cells.value[idx];
        if (cell.type !== 'image') {
            alert('该格子不能添加图片');
            return false;
        }
        const ok = stateAddImageToCell(idx, imageId, imageData);
        if (ok) {
            stateSelectCell(-1);
            await renderCanvas();
            return true;
        }
        return false;
    };

    const addImageToEmptyCell = async (imageId, imageData) => {
        const emptyIndex = cells.value.findIndex(cell => cell.type === 'image' && !cell.imageId);
        if (emptyIndex === -1) {
            alert('没有可用的图片格子');
            return false;
        }
        const ok = stateAddImageToCell(emptyIndex, imageId, imageData);
        if (ok) {
            await renderCanvas();
            return true;
        }
        return false;
    };

    const hasImages = () => cells.value.some(c => c.imageId);

    // 9. 生命周期
    onMounted(() => {
        interaction.mount(canvasRef);
    });

    onUnmounted(() => {
        interaction.unmount(canvasRef);
        cancelRender();
        delete window.__trapezoidPolys;
    });

    // 10. 监听（加入 textMode 和 textBarSize）
    watch(() => props.subModeId, (newId) => {
        if (newId) {
            initLayout(newId);
            stateSelectCell(-1);
        }
    }, { immediate: true });

    // 关键：监听所有影响渲染的 props，包括文字模式
    watch([
        () => props.spacing,
        () => props.bgColor,
        () => props.useTransparent,
        () => props.canvasWidth,
        () => props.canvasHeight,
        () => props.maskShape,
        () => props.cornerRadius,
        () => props.outerBorderSize,
        () => props.fillMode,
        // 文字相关
        () => props.textMode,
        () => props.textBarSize,
        () => props.posterTextLine1,
        () => props.posterTextColor,
        () => props.posterFontSize,
        () => props.textVertical,
        // 格子变化
        () => cells.value,
        () => textOffsetX.value,
        () => textOffsetY.value,
    ], () => {
        if (currentLayout.value) {
            renderCanvas();
        }
    }, { deep: true });

    // 11. 暴露接口
    return {
        cells,
        selectedCellIndex,
        canvasRef,
        initLayout,
        selectCell,
        removeCellImage,
        addImageToSelectedCell,
        addImageToEmptyCell,
        exportImage: exportModule.exportImage,
        getResolution: exportModule.getResolution,
        hasImages,
        renderCanvas,
        getCellIndexFromPoint: interaction.getCellIndexFromPoint,
        getDeleteButtonIndex: interaction.getDeleteButtonIndex,
        isTextMode,
        isTrapezoidMode,
    };
}