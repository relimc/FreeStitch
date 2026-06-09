<template>
    <div class="sidebar">
        <div class="sidebar-header">
            <h2>🖼️ 随心拼</h2>
            <p>点击图片添加至画布 | 支持多选导入</p>
        </div>
        
        <div class="upload-area">
            <label class="upload-btn">
                📤 导入图片
                <input type="file" accept="image/*" multiple @change="handleFileSelect">
            </label>
        </div>
        
        <!-- 图片列表区域：可滚动，flex 自动填充剩余空间 -->
        <div class="image-gallery">
            <div v-for="img in images" :key="img.id" 
                 class="gallery-item" 
                 :class="{ selected: isSelected(img.id) }"
                 @click="$emit('add-to-canvas', img.id)">
                <div class="gallery-img-wrapper">
                    <img :src="img.dataURL" :alt="img.name">
                </div>
                <div class="gallery-item-name">{{ img.name.slice(0, 14) }}</div>
                <div class="gallery-actions">
                    <div class="gallery-btn remove-btn" @click.stop="$emit('remove', img.id)">✖</div>
                </div>
                <div v-if="isSelected(img.id)" class="selected-mark">✓</div>
            </div>
            <div v-if="images.length === 0" class="empty-gallery">
                ✨ 暂无图片，点击导入
            </div>
        </div>
        
        <!-- 清空图库按钮：固定在底部 -->
        <div class="clear-gallery-wrapper" v-if="images.length > 0">
            <button class="clear-gallery-btn" @click="$emit('clear-gallery')">🗑️ 清空图库</button>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    images: { type: Array, default: () => [] },
    selectedIds: { type: Array, default: () => [] }
});
const emit = defineEmits(['upload', 'remove', 'add-to-canvas', 'clear-gallery']);

const isSelected = (id) => props.selectedIds.includes(id);

const handleFileSelect = (e) => {
    if (e.target.files.length) {
        emit('upload', Array.from(e.target.files));
        e.target.value = '';
    }
};
</script>

<style scoped>
.sidebar {
    width: 280px;
    background: #ffffff;
    border-right: 1px solid #e8ecf0;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
}

.sidebar-header {
    padding: 1.5rem 1.2rem 0.8rem;
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
    margin-top: 6px;
}

.upload-area {
    padding: 1rem;
    flex-shrink: 0;
}

.upload-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #f0f7ff;
    padding: 10px 0;
    border-radius: 60px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    border: 1px solid #dce5f0;
    color: #3b82f6;
}

.upload-btn:hover {
    background: #e6f0fe;
    transform: scale(0.98);
}

input[type="file"] {
    display: none;
}

/* 图片列表区域：可滚动，自动填充剩余空间 */
.image-gallery {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    align-content: flex-start;
}

.gallery-item {
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    border: 1px solid #eef2f6;
    transition: all 0.2s;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    height: 160px;
    display: flex;
    flex-direction: column;
}

.gallery-item.selected {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
    background: #eff6ff;
}

.gallery-item:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.gallery-img-wrapper {
    flex: 1;
    overflow: hidden;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
}

.gallery-img-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.gallery-item-name {
    font-size: 0.6rem;
    padding: 6px 6px;
    text-align: center;
    background: #fafcfc;
    color: #374151;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
    flex-shrink: 0;
}

.gallery-actions {
    position: absolute;
    top: 4px;
    right: 4px;
    display: flex;
    gap: 6px;
}

.gallery-btn {
    background: rgba(255,255,255,0.9);
    border-radius: 30px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    cursor: pointer;
    backdrop-filter: blur(2px);
    color: #374151;
    transition: 0.1s;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.gallery-btn.remove-btn:hover {
    background: #fee2e2;
    color: #dc2626;
}

.selected-mark {
    position: absolute;
    bottom: 4px;
    left: 4px;
    background: #3b82f6;
    border-radius: 20px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
    color: white;
}

.empty-gallery {
    grid-column: span 2;
    text-align: center;
    color: #9ca3af;
    padding: 40px 0;
}

/* 清空图库按钮：固定在底部，不影响滚动区域 */
.clear-gallery-wrapper {
    flex-shrink: 0;
    padding: 12px 16px;
    border-top: 1px solid #eef2f6;
    background: #ffffff;
}

.clear-gallery-btn {
    width: 100%;
    background: #ef4444;
    border: none;
    padding: 8px 12px;
    border-radius: 40px;
    font-weight: 500;
    color: white;
    cursor: pointer;
    transition: 0.2s;
}

.clear-gallery-btn:hover {
    background: #dc2626;
    transform: scale(0.98);
}
</style>