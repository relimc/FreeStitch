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

    // 2. 绘制函数（斜切、图文）
    const drawFunctions = usePresetDrawFunctions(props, state);

    // 3. Canvas 引用
    const canvasRef = ref(null);

    // 4. 渲染模块
    const renderModule = usePresetRender(props, state, drawFunctions, canvasRef);
    const { renderCanvas, cancelRender } = renderModule;

    // 5. 交互模块
    const interaction = usePresetInteraction(props, state, renderCanvas);

    // 6. 导出模块
    const exportModule = usePresetExport(props, state, drawFunctions);

    // 7. 初始化布局
    const initLayout = (subId) => {
        const ok = state.initLayout(presetLayouts, subId);
        if (ok) {
            renderCanvas();
        }
    };

    // 8. 封装方法
    const selectCell = (idx) => {
        state.selectCell(idx);
        renderCanvas(); // 刷新高亮
    };

    const removeCellImage = (idx) => {
        state.removeCellImage(idx);
        renderCanvas();
    };

    const addImageToSelectedCell = async (imageId, imageData) => {
        const idx = state.selectedCellIndex.value;
        if (idx === -1) {
            alert('请先点击一个格子');
            return false;
        }
        const ok = state.addImageToCell(idx, imageId, imageData);
        if (ok) {
            state.selectCell(-1);
            await renderCanvas();
            return true;
        }
        return false;
    };

    const addImageToEmptyCell = async (imageId, imageData) => {
        const idx = state.findEmptyCell();
        if (idx === -1) {
            alert('所有格子都已填满');
            return false;
        }
        const ok = state.addImageToCell(idx, imageId, imageData);
        if (ok) {
            await renderCanvas();
            return true;
        }
        return false;
    };

    const hasImages = () => state.cells.value.some(c => c.imageId);

    // 9. 生命周期
    onMounted(() => {
        interaction.mount(canvasRef);
    });

    onUnmounted(() => {
        interaction.unmount(canvasRef);
        cancelRender();
        // 清理斜切多边形
        delete window.__trapezoidPolys;
    });

    // 10. 监听
    watch(() => props.subModeId, (newId) => {
        if (newId) {
            initLayout(newId);
            state.selectCell(-1);
        }
    }, { immediate: true });

    watch([() => props.spacing, () => props.bgColor, () => props.useTransparent,
        () => props.canvasWidth, () => props.canvasHeight, () => props.maskShape,
        () => props.cornerRadius, () => props.outerBorderSize, () => props.fillMode,
        () => props.posterText, () => props.posterDateFormat, () => props.posterTextColor,
        () => props.posterFontSize], () => {
        if (state.currentLayout.value) {
            renderCanvas();
        }
    }, { deep: true });

    // 11. 暴露接口
    return {
        // 状态
        cells: state.cells,
        selectedCellIndex: state.selectedCellIndex,
        canvasRef,
        // 方法
        initLayout,
        selectCell,
        removeCellImage,
        addImageToSelectedCell,
        addImageToEmptyCell,
        exportImage: exportModule.exportImage,
        getResolution: exportModule.getResolution,
        hasImages,
        renderCanvas,
        // 用于主组件点击检测
        getCellIndexFromPoint: interaction.getCellIndexFromPoint,
        getDeleteButtonIndex: interaction.getDeleteButtonIndex,
        // 计算属性
        isTextMode: state.isTextMode,
        isTrapezoidMode: state.isTrapezoidMode,
    };
}