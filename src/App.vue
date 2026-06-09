<template>
    <div class="app-layout">
        <Sidebar 
            :images="galleryImages"
            :selectedIds="selectedImageIds"
            @upload="handleUpload"
            @remove="handleRemoveImage"
            @add-to-canvas="addToCanvas"
            @clear-gallery="clearGallery"
        />
        
        <div class="main-area">
            <ControlBar 
                :mode="mode"
                :spacing="spacing"
                :bgColor="bgColor"
                :useTransparent="useTransparent"
                :canvasWidth="canvasWidth"
                :canvasHeight="canvasHeight"
                :gridRows="gridRows"
                :gridCols="gridCols"
                :masonryCols="masonryCols"
                :fixedHeightEnabled="fixedHeightEnabled"
                :fixedHeight="fixedHeight"
                :fixedWidthEnabled="fixedWidthEnabled"
                :fixedWidth="fixedWidth"
                :masonryColumnWidth="masonryColumnWidth"
                :cellWidth="cellWidth"
                :cellHeight="cellHeight"
                :fillMode="fillMode"
                :maskShape="maskShape"
                :cornerRadius="cornerRadius"
                @mode-change="mode = $event"
                @spacing-change="spacing = $event"
                @bg-color-change="bgColor = $event"
                @toggle-transparent="useTransparent = $event"
                @canvas-width-change="canvasWidth = $event"
                @canvas-height-change="canvasHeight = $event"
                @update-grid-rows="gridRows = $event"
                @update-grid-cols="gridCols = $event"
                @update-masonry-cols="masonryCols = $event"
                @update-fixed-height-enabled="fixedHeightEnabled = $event"
                @update-fixed-height="fixedHeight = $event"
                @update-fixed-width-enabled="fixedWidthEnabled = $event"
                @update-fixed-width="fixedWidth = $event"
                @update-masonry-column-width="masonryColumnWidth = $event"
                @update-cell-width="cellWidth = $event"
                @update-cell-height="cellHeight = $event"
                @update-fill-mode="fillMode = $event"
                @update-mask-shape="maskShape = $event"
                @update-corner-radius="cornerRadius = $event"
                @clear-canvas="clearCanvas"
            />
            
            <CanvasArea 
                ref="canvasAreaRef"
                :mode="mode"
                :images="canvasImages"
                :spacing="spacing"
                :bgColor="bgColor"
                :useTransparent="useTransparent"
                :canvasWidth="canvasWidth"
                :canvasHeight="canvasHeight"
                :gridRows="gridRows"
                :gridCols="gridCols"
                :masonryCols="masonryCols"
                :fixedHeightEnabled="fixedHeightEnabled"
                :fixedHeight="fixedHeight"
                :fixedWidthEnabled="fixedWidthEnabled"
                :fixedWidth="fixedWidth"
                :masonryColumnWidth="masonryColumnWidth"
                :cellWidth="cellWidth"
                :cellHeight="cellHeight"
                :fillMode="fillMode"
                :maskShape="maskShape"
                :cornerRadius="cornerRadius"
                @remove="removeFromCanvas"
                @update:images="handleCanvasImagesUpdate"
            />
            
            <div class="export-wrapper">
                <button class="export-btn" @click="handleExport">⬇️ 导出图片</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Sidebar from './components/Sidebar.vue';
import CanvasArea from './components/CanvasArea.vue';
import ControlBar from './components/ControlBar.vue';

const galleryImages = ref([]);
const canvasImages = ref([]);
const selectedImageIds = ref([]);
const mode = ref('free');
const spacing = ref(12);
const bgColor = ref('#ffffff');
const useTransparent = ref(true);
const canvasWidth = ref(800);
const canvasHeight = ref(600);
const gridRows = ref(3);
const gridCols = ref(3);
const masonryCols = ref(3);
// 默认值修改
const fixedHeightEnabled = ref(true);
const fixedHeight = ref(500);
const fixedWidthEnabled = ref(true);
const fixedWidth = ref(500);
const masonryColumnWidth = ref(360);
const cellWidth = ref(500);
const cellHeight = ref(500);
const fillMode = ref('cover');
const maskShape = ref('none');
const cornerRadius = ref(20);
const useOriginalSizeInFree = ref(false);
let nextId = 1;
const canvasAreaRef = ref(null);

const handleUpload = (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
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
};

const handleRemoveImage = (id) => {
    galleryImages.value = galleryImages.value.filter(img => img.id !== id);
    selectedImageIds.value = selectedImageIds.value.filter(iid => iid !== id);
    canvasImages.value = canvasImages.value.filter(img => img.id !== id);
};

const addToCanvas = (imageId) => {
    const img = galleryImages.value.find(i => i.id === imageId);
    if (!img) return;
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

const clearCanvas = () => {
    if (canvasImages.value.length === 0) return;
    canvasImages.value = [];
    selectedImageIds.value = [];
};

const clearGallery = () => {
    if (galleryImages.value.length === 0) return;
    galleryImages.value = [];
    canvasImages.value = [];
    selectedImageIds.value = [];
};

const handleExport = async () => {
    if (canvasImages.value.length === 0) {
        alert('请先添加图片到画布');
        return;
    }
    const dataURL = await canvasAreaRef.value?.exportImage(useOriginalSizeInFree.value, useTransparent.value);
    if (dataURL) {
        const link = document.createElement('a');
        link.download = `stitch_${mode.value}_${Date.now()}.png`;
        link.href = dataURL;
        link.click();
    }
};

const handleBeforeUnload = (e) => {
    if (galleryImages.value.length > 0 || canvasImages.value.length > 0) {
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
.main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    gap: 10px;
    padding: 10px 0;
}
.export-wrapper {
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    margin: 10px 20px;
}
.export-btn {
    background: #10b981;
    border: none;
    padding: 10px 30px;
    border-radius: 40px;
    font-weight: 600;
    font-size: 1rem;
    color: white;
    cursor: pointer;
    transition: 0.2s;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
.export-btn:hover {
    background: #059669;
    transform: translateY(-1px);
}
</style>