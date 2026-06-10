<template>
    <div class="sidebar">
        <!-- 标题区 -->
        <div class="sidebar-header">
            <h2>🖼️ 随心拼</h2>
            <p>自由拼接 | 创意无限</p>
        </div>
        
        <!-- 待选图片区 -->
        <div class="gallery-section">
            <div class="section-header">
                <span>📁 图片素材库</span>
                <label class="upload-trigger">
                    <span>+ 导入</span>
                    <input type="file" accept="image/*" multiple @change="handleFileSelect" style="display:none">
                </label>
            </div>
            <div class="image-grid">
                <div v-for="img in images" :key="img.id" 
                    class="gallery-item" 
                    :class="{ selected: selectedIds.includes(img.id) }"
                    @click="$emit('add-to-canvas', img.id)">
                    <img :src="img.dataURL" :alt="img.name">
                    <div class="gallery-item-name">{{ img.name.slice(0, 12) }}</div>
                    <div class="gallery-item-remove" @click.stop="$emit('remove', img.id)">✖</div>
                    <div v-if="selectedIds.includes(img.id)" class="selected-mark">✓</div>
                </div>
                <div v-if="images.length === 0" class="empty-gallery">
                    ✨ 点击「+ 导入」添加图片
                </div>
            </div>
            <div v-if="images.length > 0" class="clear-gallery" @click="$emit('clear-gallery')">
                🗑️ 清空图库
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    images: { type: Array, default: () => [] },
    selectedIds: { type: Array, default: () => [] }
});

const emit = defineEmits(['upload', 'remove', 'add-to-canvas', 'clear-gallery']);

const handleFileSelect = (e) => {
    if (e.target.files.length) {
        emit('upload', Array.from(e.target.files));
        e.target.value = '';
    }
};
</script>

<style scoped>
/* 样式从原 App.vue 中复制 .sidebar 相关样式 */
.sidebar {
    width: 320px;
    background: #ffffff;
    border-right: 1px solid #e8ecf0;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: visible;
}
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
</style>