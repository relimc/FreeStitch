<template>
    <div class="app-layout">
        <!-- 左侧边栏 -->
        <div class="sidebar">
            <!-- 1. 标题区 -->
            <div class="sidebar-header">
                <h2>🖼️ 随心拼</h2>
                <p>自由拼接 | 创意无限</p>
            </div>
            
            <!-- 2. 待选图片区 -->
            <div class="gallery-section">
                <div class="section-header">
                    <span>📁 图片素材库</span>
                    <label class="upload-trigger">
                        <span>+ 导入</span>
                        <input type="file" accept="image/*" multiple @change="handleUpload" style="display:none">
                    </label>
                </div>
                <div class="image-grid">
                    <div v-for="img in galleryImages" :key="img.id" 
                        class="gallery-item" 
                        :class="{ selected: selectedImageIds.includes(img.id) }"
                        @click="addToCanvas(img.id)">
                        <img :src="img.dataURL" :alt="img.name">
                        <div class="gallery-item-name">{{ img.name.slice(0, 12) }}</div>
                        <div class="gallery-item-remove" @click.stop="handleRemoveImage(img.id)">✖</div>
                        <div v-if="selectedImageIds.includes(img.id)" class="selected-mark">✓</div>
                    </div>
                    <div v-if="galleryImages.length === 0" class="empty-gallery">
                        ✨ 点击「+ 导入」添加图片
                    </div>
                </div>
                <div v-if="galleryImages.length > 0" class="clear-gallery" @click="clearGallery">
                    🗑️ 清空图库
                </div>
            </div>
            
            <!-- 3. 控制区 -->
            <ControlBar 
                :mode="mode"
                :spacing="spacing"
                :bgColor="bgColor"
                :useTransparent="useTransparent"
                :canvasWidth="canvasWidth"
                :canvasHeight="canvasHeight"
                :gridRows="gridRows"
                :gridCols="gridCols"
                :gridLayout="gridLayout"
                :masonryCols="masonryCols"
                :masonryColumnWidth="masonryColumnWidth"
                :cellWidth="cellWidth"
                :cellHeight="cellHeight"
                :fillMode="fillMode"
                :maskShape="maskShape"
                :cornerRadius="cornerRadius"
                :presetTemplateId="presetTemplateId"
                :showOuterBorder="showOuterBorder"
                @mode-change="mode = $event"
                @spacing-change="spacing = $event"
                @bg-color-change="bgColor = $event"
                @toggle-transparent="useTransparent = $event"
                @update-canvas-width="canvasWidth = $event"
                @update-canvas-height="canvasHeight = $event"
                @update-grid-rows="gridRows = $event"
                @update-grid-cols="gridCols = $event"
                @update-grid-layout="gridLayout = $event"
                @update-masonry-cols="masonryCols = $event"
                @update-masonry-column-width="masonryColumnWidth = $event"
                @update-cell-width="cellWidth = $event"
                @update-cell-height="cellHeight = $event"
                @update-fill-mode="fillMode = $event"
                @update-mask-shape="maskShape = $event"
                @update-corner-radius="cornerRadius = $event"
                @select-preset-template="presetTemplateId = $event"
                @update-show-outer-border="showOuterBorder = $event"
                @clear-canvas="clearCanvas"
                @export="handleExport"
            />
        </div>
        
        <!-- 右侧：拼接区 -->
        <div class="canvas-area">
            <div class="canvas-wrapper">
                <!-- 自由模式 -->
                <FreeModeCanvas 
                    v-if="mode === 'free'"
                    ref="freeCanvasRef"
                    :images="canvasImages"
                    :spacing="spacing"
                    :bgColor="bgColor"
                    :useTransparent="useTransparent"
                    :canvasWidth="canvasWidth"
                    :canvasHeight="canvasHeight"
                    :showOuterBorder="showOuterBorder"
                    @remove="removeFromCanvas"
                    @update:images="handleCanvasImagesUpdate"
                />
                
                <!-- 网格模式 -->
                <GridModeCanvas 
                    v-else-if="mode === 'grid'"
                    ref="gridCanvasRef"
                    :images="canvasImages"
                    :spacing="spacing"
                    :bgColor="bgColor"
                    :useTransparent="useTransparent"
                    :gridRows="gridRows"
                    :gridCols="gridCols"
                    :gridLayout="gridLayout"
                    :cellWidth="cellWidth"
                    :cellHeight="cellHeight"
                    :fillMode="fillMode"
                    :maskShape="maskShape"
                    :cornerRadius="cornerRadius"
                    :showOuterBorder="showOuterBorder"
                    @remove="removeFromCanvas"
                    @update:images="handleCanvasImagesUpdate"
                />
                
                <!-- 瀑布流模式 -->
                <MasonryModeCanvas 
                    v-else-if="mode === 'masonry'"
                    ref="masonryCanvasRef"
                    :images="canvasImages"
                    :spacing="spacing"
                    :bgColor="bgColor"
                    :useTransparent="useTransparent"
                    :masonryCols="masonryCols"
                    :masonryColumnWidth="masonryColumnWidth"
                    :maskShape="maskShape"
                    :cornerRadius="cornerRadius"
                    :showOuterBorder="showOuterBorder"
                    @remove="removeFromCanvas"
                    @update:images="handleCanvasImagesUpdate"
                />
                
                <!-- 预设模式 -->
                <PresetModeCanvas 
                    v-else-if="mode === 'preset'"
                    ref="presetCanvasRef"
                    :images="canvasImages"
                    :spacing="spacing"
                    :bgColor="bgColor"
                    :useTransparent="useTransparent"
                    :fillMode="fillMode"
                    :presetTemplateId="presetTemplateId"
                    :showOuterBorder="showOuterBorder"
                    @update:presetCells="handlePresetCellsUpdate"
                    @select-cell="setSelectedPresetCell"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, provide, onMounted, onUnmounted, watch } from 'vue';
import ControlBar from './components/ControlBar.vue';
import FreeModeCanvas from './components/canvas/FreeModeCanvas.vue';
import GridModeCanvas from './components/canvas/GridModeCanvas.vue';
import MasonryModeCanvas from './components/canvas/MasonryModeCanvas.vue';
import PresetModeCanvas from './components/canvas/PresetModeCanvas.vue';

// 状态定义
const galleryImages = ref([]);
const canvasImages = ref([]);
const selectedImageIds = ref([]);
const mode = ref('preset');
const spacing = ref(12);
const bgColor = ref('#ffffff');
const useTransparent = ref(true);
const canvasWidth = ref(800);
const canvasHeight = ref(600);
const gridRows = ref(3);
const gridCols = ref(3);
const gridLayout = ref('grid');
const masonryCols = ref(3);
const masonryColumnWidth = ref(360);
const cellWidth = ref(0);
const cellHeight = ref(0);
const fillMode = ref('cover');
const maskShape = ref('none');
const cornerRadius = ref(20);
const presetTemplateId = ref('grid-3x3');
const presetCells = ref([]);
const showOuterBorder = ref(false);
let nextId = 1;

// 画布组件的 ref
const freeCanvasRef = ref(null);
const gridCanvasRef = ref(null);
const masonryCanvasRef = ref(null);
const presetCanvasRef = ref(null);
const selectedPresetCellIndex = ref(-1);

// 提供图库数据
provide('galleryImages', galleryImages);

// 设置当前选中的预设格子
const setSelectedPresetCell = (index) => {
    selectedPresetCellIndex.value = index;
};

// 图片上传
const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataURL = e.target.result;
            const img = new Image();
            img.onload = () => {
                galleryImages.value.push({
                    id: nextId++,
                    name: file.name,
                    dataURL: dataURL,
                    width: img.width,
                    height: img.height
                });
            };
            img.src = dataURL;
        };
        reader.readAsDataURL(file);
    });
    e.target.value = '';
};

const handleRemoveImage = (id) => {
    galleryImages.value = galleryImages.value.filter(img => img.id !== id);
    selectedImageIds.value = selectedImageIds.value.filter(iid => iid !== id);
    canvasImages.value = canvasImages.value.filter(img => img.id !== id);
};

const addToCanvas = (imageId) => {
    const img = galleryImages.value.find(i => i.id === imageId);
    if (!img) return;
    
    if (mode.value === 'preset') {
        // 预设模式：通过方法添加图片到选中的格子
        if (presetCanvasRef.value && presetCanvasRef.value.addImageToSelectedCell) {
            const success = presetCanvasRef.value.addImageToSelectedCell(img.id, img.dataURL);
            if (!success) {
                alert('请先点击画布中的一个格子');
            }
        }
        return;
    }
    
    // 其他模式的原有逻辑
    const alreadyInCanvas = canvasImages.value.some(i => i.id === imageId);
    if (alreadyInCanvas) {
        canvasImages.value = canvasImages.value.filter(i => i.id !== imageId);
        selectedImageIds.value = selectedImageIds.value.filter(id => id !== imageId);
    } else {
        canvasImages.value.push({ ...img });
        if (!selectedImageIds.value.includes(imageId)) {
            selectedImageIds.value.push(imageId);
        }
    }
};

const removeFromCanvas = (imageId) => {
    canvasImages.value = canvasImages.value.filter(img => img.id !== imageId);
    selectedImageIds.value = selectedImageIds.value.filter(id => id !== imageId);
};

const handleCanvasImagesUpdate = (newImages) => {
    if (JSON.stringify(canvasImages.value.map(i => i.id)) !== JSON.stringify(newImages.map(i => i.id))) {
        canvasImages.value = newImages;
        selectedImageIds.value = canvasImages.value.map(img => img.id);
    }
};

const handlePresetCellsUpdate = (cells) => {
    presetCells.value = cells;
};

const clearCanvas = () => {
    if (mode.value === 'preset') {
        if (presetCanvasRef.value) {
            // 清空所有格子
            const newCells = presetCells.value.map(cell => ({ ...cell, imageId: null, imageData: null }));
            presetCells.value = newCells;
            presetCanvasRef.value?.$emit('update:presetCells', newCells);
        }
    } else {
        canvasImages.value = [];
        selectedImageIds.value = [];
    }
};

const clearGallery = () => {
    if (galleryImages.value.length === 0) return;
    galleryImages.value = [];
    canvasImages.value = [];
    selectedImageIds.value = [];
    presetCells.value = [];
};

const handleExport = async () => {
    if (mode.value === 'preset') {
        const hasImages = presetCells.value.some(cell => cell.imageId !== null);
        if (!hasImages) {
            alert('请先填充预设模板的图片');
            return;
        }
        if (presetCanvasRef.value) {
            const dataURL = await presetCanvasRef.value.exportImage(useTransparent.value);
            if (dataURL) {
                const link = document.createElement('a');
                link.download = `stitch_${mode.value}_${Date.now()}.png`;
                link.href = dataURL;
                link.click();
            }
        }
        return;
    }
    
    if (mode.value === 'free') {
        if (canvasImages.value.length === 0) {
            alert('请先添加图片到画布');
            return;
        }
        if (freeCanvasRef.value) {
            const dataURL = await freeCanvasRef.value.exportImage(useTransparent.value);
            if (dataURL) {
                const link = document.createElement('a');
                link.download = `stitch_${mode.value}_${Date.now()}.png`;
                link.href = dataURL;
                link.click();
            }
        }
        return;
    }
    
    if (mode.value === 'grid') {
        if (canvasImages.value.length === 0) {
            alert('请先添加图片到画布');
            return;
        }
        if (gridCanvasRef.value) {
            const dataURL = await gridCanvasRef.value.exportImage(useTransparent.value);
            if (dataURL) {
                const link = document.createElement('a');
                link.download = `stitch_${mode.value}_${Date.now()}.png`;
                link.href = dataURL;
                link.click();
            }
        }
        return;
    }
    
    if (mode.value === 'masonry') {
        if (canvasImages.value.length === 0) {
            alert('请先添加图片到画布');
            return;
        }
        if (masonryCanvasRef.value) {
            const dataURL = await masonryCanvasRef.value.exportImage(useTransparent.value);
            if (dataURL) {
                const link = document.createElement('a');
                link.download = `stitch_${mode.value}_${Date.now()}.png`;
                link.href = dataURL;
                link.click();
            }
        }
        return;
    }
};

const handleBeforeUnload = (e) => {
    if (galleryImages.value.length > 0 || canvasImages.value.length > 0 || presetCells.value.some(c => c.imageId)) {
        e.preventDefault();
        e.returnValue = '';
    }
};

onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
});
onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<style scoped>
.app-layout {
    display: flex;
    width: 100%;
    height: 100%;
    background: #f5f7fa;
}

/* 左侧边栏 */
.sidebar {
    width: 320px;
    background: #ffffff;
    border-right: 1px solid #e8ecf0;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: visible;
}

/* 标题区 */
.sidebar-header {
    padding: 20px 20px 12px;
    border-bottom: 1px solid #eef2f6;
    flex-shrink: 0;
}
.sidebar-header h2 {
    font-size: 1.4rem;
    font-weight: 700;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
}
.sidebar-header p {
    font-size: 0.7rem;
    color: #6b7280;
    margin-top: 4px;
}

/* 待选图片区 */
.gallery-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-bottom: 1px solid #eef2f6;
}
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f8fafc;
    font-size: 0.8rem;
    font-weight: 500;
    color: #475569;
    flex-shrink: 0;
}
.upload-trigger {
    cursor: pointer;
    color: #3b82f6;
    font-size: 0.75rem;
}
.image-grid {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    align-content: flex-start;
}
.gallery-item {
    background: #f8fafc;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    border: 1px solid #e2e8f0;
    transition: all 0.2s;
}
.gallery-item.selected {
    border-color: #3b82f6;
    background: #eff6ff;
}
.gallery-item img {
    width: 100%;
    aspect-ratio: 1/1;
    object-fit: cover;
    display: block;
}
.gallery-item-name {
    font-size: 0.6rem;
    padding: 6px;
    text-align: center;
    background: #ffffff;
    color: #374151;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.gallery-item-remove {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(0,0,0,0.6);
    border-radius: 20px;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    cursor: pointer;
    color: white;
}
.selected-mark {
    position: absolute;
    bottom: 4px;
    left: 4px;
    background: #3b82f6;
    border-radius: 20px;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    color: white;
}
.empty-gallery {
    grid-column: span 2;
    text-align: center;
    color: #9ca3af;
    padding: 40px 0;
}
.clear-gallery {
    padding: 10px 16px;
    text-align: center;
    background: #fef2f2;
    color: #dc2626;
    font-size: 0.7rem;
    cursor: pointer;
    flex-shrink: 0;
    border-top: 1px solid #fee2e2;
}

/* 右侧拼接区 */
.canvas-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 20px;
    overflow: hidden;
}
.canvas-wrapper {
    flex: 1;
    min-height: 0;
    overflow: hidden;
}
</style>