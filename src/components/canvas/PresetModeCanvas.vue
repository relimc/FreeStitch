<template>
    <div class="preset-canvas">
        <div class="canvas-wrapper" ref="wrapperRef">
            <canvas 
                ref="canvasRef" 
                class="preset-canvas-element"
                @click="handleCanvasClick"
            ></canvas>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { usePresetCanvas } from './preset/usePresetCanvas.js';

const props = defineProps({
    subModeId: { type: String, default: '' },
    spacing: { type: Number, default: 12 },
    outerBorderSize: { type: Number, default: 0 },
    bgColor: { type: String, default: '#ffffff' },
    useTransparent: { type: Boolean, default: true },
    fillMode: { type: String, default: 'cover' },
    maskShape: { type: String, default: 'none' },
    cornerRadius: { type: Number, default: 20 },
    posterText: { type: String, default: '美好时光' },
    posterDateFormat: { type: String, default: 'YYYY-MM-DD' },
    posterTextColor: { type: String, default: '#ffffff' },
    posterFontSize: { type: Number, default: 24 },
    canvasWidth: { type: Number, default: 800 },
    canvasHeight: { type: Number, default: 600 }
});

const emit = defineEmits(['update:cells', 'select-cell']);

const wrapperRef = ref(null);

const {
    cells,
    selectedCellIndex,
    canvasRef,
    initLayout,
    selectCell,
    removeCellImage,
    addImageToSelectedCell,
    addImageToEmptyCell,
    exportImage,
    getResolution,
    hasImages,
    getCellIndexFromPoint,
    getDeleteButtonIndex,
} = usePresetCanvas(props, emit);

// 点击 canvas 处理
const handleCanvasClick = (e) => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // 检测删除按钮
    const delIdx = getDeleteButtonIndex(x, y);
    if (delIdx !== -1) {
        removeCellImage(delIdx);
        return;
    }

    // 选择格子
    const idx = getCellIndexFromPoint(x, y);
    if (idx !== -1) {
        selectCell(idx);
    }
};

// 暴露给父组件
defineExpose({
    exportImage,
    getResolution,
    addImageToSelectedCell,
    addImageToEmptyCell,
    hasImages,
});

// 初始化布局
watch(() => props.subModeId, (newId) => {
    if (newId) {
        initLayout(newId);
        selectedCellIndex.value = -1;
    }
}, { immediate: true });
</script>

<style scoped>
.preset-canvas {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
    background-color: transparent;
}
.canvas-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
.preset-canvas-element {
    cursor: default;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    background: transparent;
}
</style>