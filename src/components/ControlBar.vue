<template>
    <div class="controls-section">
        <!-- 模式切换 -->
        <div class="mode-tabs">
            <button 
                v-for="opt in modeOptions" 
                :key="opt.value"
                :class="['mode-tab', { active: mode === opt.value }]"
                @click="$emit('mode-change', opt.value)"
            >
                {{ opt.icon }} {{ opt.label }}
            </button>
        </div>
        
        <!-- 通用参数：间距 + 背景 -->
        <div class="param-group">
            <div class="param-row">
                <span class="param-label">间距</span>
                <input type="range" :value="spacing" min="0" max="50" @input="$emit('spacing-change', parseInt($event.target.value))">
                <span class="param-value">{{ spacing }}px</span>
            </div>
            <div class="param-row">
                <span class="param-label">背景</span>
                <div class="bg-controls">
                    <input type="color" :value="bgColor" @click="onColorPickerClick" @input="onColorChange">
                    <button class="transparent-btn" :class="{ active: useTransparent }" @click="$emit('toggle-transparent', !useTransparent)">透明</button>
                </div>
            </div>
        </div>

        <!-- 高级选项容器（触发器 + 不可见连接区） -->
        <div class="advanced-container"
             @mouseenter="handleMouseEnter"
             @mouseleave="handleMouseLeave">
            <div class="advanced-trigger" ref="advancedTriggerRef">
                <span>⚙️ 高级设置</span>
                <span class="trigger-arrow">›</span>
            </div>
            
            <!-- 不可见连接区域（填补触发器和面板之间的空隙） -->
            <div class="advanced-gap"></div>
            
            <!-- 使用 Teleport 将悬浮面板传送到 body，避免被遮挡 -->
            <Teleport to="body">
                <div v-if="showAdvancedPanel" 
                     ref="advancedPanelRef"
                     class="advanced-panel-global"
                     :style="globalPanelStyle"
                     @mouseenter="handleMouseEnter"
                     @mouseleave="handleMouseLeave">
                    <div class="panel-header">
                        <span>高级设置 - {{ currentModeLabel }}</span>
                    </div>
                    <div class="panel-body">
                        <!-- 自由模式参数 -->
                        <div v-if="mode === 'free'" class="param-group-inline">
                            <div class="param-row">
                                <span class="param-label">画布宽</span>
                                <input type="number" :value="canvasWidth" @input="$emit('update-canvas-width', parseInt($event.target.value))" min="100" step="10">
                                <span>px</span>
                            </div>
                            <div class="param-row">
                                <span class="param-label">画布高</span>
                                <input type="number" :value="canvasHeight" @input="$emit('update-canvas-height', parseInt($event.target.value))" min="100" step="10">
                                <span>px</span>
                            </div>
                        </div>
                        
                        <!-- 网格模式参数 -->
                        <div v-if="mode === 'grid'" class="param-group-inline">
                            <div class="param-row">
                                <span class="param-label">布局</span>
                                <select :value="gridLayout" @input="$emit('update-grid-layout', $event.target.value)">
                                    <option value="grid">自由网格</option>
                                    <option value="horizontal">横向单行</option>
                                    <option value="vertical">纵向单列</option>
                                </select>
                            </div>
                            <div v-if="gridLayout === 'grid'" class="param-row">
                                <span class="param-label">行列</span>
                                <div class="size-inputs">
                                    <input type="number" :value="gridRows" @input="$emit('update-grid-rows', parseInt($event.target.value))" min="1">
                                    <span>×</span>
                                    <input type="number" :value="gridCols" @input="$emit('update-grid-cols', parseInt($event.target.value))" min="1">
                                </div>
                            </div>
                            <div class="param-row">
                                <span class="param-label">单元格</span>
                                <div class="size-inputs">
                                    <input type="number" :value="cellWidth" @input="$emit('update-cell-width', parseInt($event.target.value))" min="0" step="10" placeholder="自动">
                                    <span>×</span>
                                    <input type="number" :value="cellHeight" @input="$emit('update-cell-height', parseInt($event.target.value))" min="0" step="10" placeholder="自动">
                                </div>
                            </div>
                        </div>
                        
                        <!-- 瀑布流模式参数 -->
                        <div v-if="mode === 'masonry'" class="param-group-inline">
                            <div class="param-row">
                                <span class="param-label">列数</span>
                                <input type="number" :value="masonryCols" @input="$emit('update-masonry-cols', parseInt($event.target.value))" min="1" max="6">
                            </div>
                            <div class="param-row">
                                <span class="param-label">列宽</span>
                                <input type="number" :value="masonryColumnWidth" @input="$emit('update-masonry-column-width', parseInt($event.target.value))" min="50" step="10">
                                <span>px</span>
                            </div>
                        </div>
                        
                        <!-- 预设模式参数 -->
                        <div v-if="mode === 'preset'" class="param-group-inline">
                            <div class="preset-templates">
                                <button 
                                    v-for="tmpl in presetTemplates" 
                                    :key="tmpl.id"
                                    :class="['preset-btn', { active: presetTemplateId === tmpl.id }]"
                                    @click="$emit('select-preset-template', tmpl.id)"
                                >
                                    {{ tmpl.name }}
                                </button>
                            </div>
                        </div>

                        <div class="param-divider"></div>
                        <div class="param-row">
                            <span class="param-label">外框</span>
                            <label class="border-checkbox">
                                <input type="checkbox" :checked="showOuterBorder" @change="$emit('update-show-outer-border', $event.target.checked)">
                            </label>
                        </div>
                        <div class="param-row">
                            <span class="param-label">蒙版</span>
                            <select :value="maskShape" @input="$emit('update-mask-shape', $event.target.value)">
                                <option value="none">无</option>
                                <option value="circle">圆形</option>
                                <option value="roundRect">圆角矩形</option>
                            </select>
                        </div>
                        <div v-if="maskShape === 'roundRect'" class="param-row">
                            <span class="param-label">圆角</span>
                            <input type="number" :value="cornerRadius" @input="$emit('update-corner-radius', parseInt($event.target.value))" min="0" step="5">
                            <span>px</span>
                        </div>
                        <div class="param-row">
                            <span class="param-label">填充</span>
                            <select :value="fillMode" @input="$emit('update-fill-mode', $event.target.value)">
                                <option value="contain">contain (留白)</option>
                                <option value="cover">cover (裁剪)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </Teleport>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
            <button class="action-btn clear-btn" @click="$emit('clear-canvas')">清空画布</button>
            <button class="action-btn export-btn" @click="$emit('export')">导出图片</button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
    mode: { type: String, default: 'preset' },
    spacing: { type: Number, default: 12 },
    bgColor: { type: String, default: '#ffffff' },
    useTransparent: { type: Boolean, default: true },
    canvasWidth: { type: Number, default: 800 },
    canvasHeight: { type: Number, default: 600 },
    gridRows: { type: Number, default: 3 },
    gridCols: { type: Number, default: 3 },
    gridLayout: { type: String, default: 'grid' },
    masonryCols: { type: Number, default: 3 },
    masonryColumnWidth: { type: Number, default: 360 },
    cellWidth: { type: Number, default: 0 },
    cellHeight: { type: Number, default: 0 },
    fillMode: { type: String, default: 'cover' },
    maskShape: { type: String, default: 'none' },
    cornerRadius: { type: Number, default: 20 },
    presetTemplateId: { type: String, default: 'grid-3x3' },
    showOuterBorder: { type: Boolean, default: false }
});

const emit = defineEmits([
    'mode-change', 'spacing-change', 'bg-color-change', 'toggle-transparent',
    'update-canvas-width', 'update-canvas-height',
    'update-grid-rows', 'update-grid-cols', 'update-grid-layout',
    'update-masonry-cols', 'update-masonry-column-width',
    'update-cell-width', 'update-cell-height', 'update-fill-mode',
    'update-mask-shape', 'update-corner-radius',
    'select-preset-template', 'clear-canvas', 'export', 'update-show-outer-border'
]);

const modeOptions = [
    { value: 'preset', label: '预设', icon: '🎨' },
    { value: 'free', label: '自由', icon: '✨' },
    { value: 'grid', label: '网格', icon: '🔲' },
    { value: 'masonry', label: '瀑布流', icon: '🏞️' }
];

const presetTemplates = [
    { id: 'grid-3x3', name: '九宫格' },
    { id: 'grid-2x2', name: '四宫格' },
    { id: 'grid-1x2', name: '横向双拼' },
    { id: 'grid-2x1', name: '纵向双拼' },
    { id: 'poster-simple', name: '纯文字海报' }
];

const currentModeLabel = computed(() => {
    const opt = modeOptions.find(o => o.value === props.mode);
    return opt ? opt.label : '预设';
});

// 高级面板控制
const showAdvancedPanel = ref(false);
const advancedTriggerRef = ref(null);
const advancedPanelRef = ref(null);
const globalPanelStyle = ref({});
let hideTimeout = null;

const handleMouseEnter = () => {
    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
    }
    showAdvancedPanel.value = true;
    adjustPanelPosition();
};

const handleMouseLeave = () => {
    hideTimeout = setTimeout(() => {
        showAdvancedPanel.value = false;
    }, 200);
};

const adjustPanelPosition = async () => {
    await nextTick();
    if (!advancedTriggerRef.value || !advancedPanelRef.value) return;
    const triggerRect = advancedTriggerRef.value.getBoundingClientRect();
    const panelRect = advancedPanelRef.value.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    let top = triggerRect.top;
    let left = triggerRect.right + 8;
    
    if (triggerRect.bottom + panelRect.height > viewportHeight - 20) {
        top = triggerRect.bottom - panelRect.height;
    }
    
    if (triggerRect.right + panelRect.width + 8 > window.innerWidth) {
        left = triggerRect.left - panelRect.width - 8;
    }
    
    globalPanelStyle.value = {
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: '320px',
        zIndex: 10000
    };
};

const handleResize = () => {
    if (showAdvancedPanel.value) {
        adjustPanelPosition();
    }
};

watch(showAdvancedPanel, (newVal) => {
    if (newVal) {
        adjustPanelPosition();
    }
});

onMounted(() => {
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('scroll', handleResize, true);
    if (hideTimeout) clearTimeout(hideTimeout);
});

// 背景色处理
const onColorPickerClick = () => {
    if (props.useTransparent) {
        emit('toggle-transparent', false);
    }
};

const onColorChange = (e) => {
    if (props.useTransparent) {
        emit('toggle-transparent', false);
    }
    emit('bg-color-change', e.target.value);
};
</script>

<style scoped>
.controls-section {
    flex-shrink: 0;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: visible;
}

.mode-tabs {
    display: flex;
    gap: 6px;
    background: #f1f5f9;
    padding: 4px;
    border-radius: 12px;
}
.mode-tab {
    flex: 1;
    padding: 8px 0;
    font-size: 0.75rem;
    font-weight: 500;
    color: #64748b;
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
}
.mode-tab.active {
    background: #ffffff;
    color: #3b82f6;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.param-group {
    background: #f8fafc;
    border-radius: 12px;
    padding: 10px 12px;
}
.param-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}
.param-row + .param-row {
    margin-top: 10px;
}
.param-label {
    font-size: 0.7rem;
    font-weight: 500;
    color: #475569;
    width: 48px;
}
.bg-controls {
    display: flex;
    align-items: center;
    gap: 8px;
}
.transparent-btn {
    padding: 4px 12px;
    font-size: 0.7rem;
    background: #e2e8f0;
    border: none;
    border-radius: 20px;
    cursor: pointer;
}
.transparent-btn.active {
    background: #3b82f6;
    color: white;
}
input[type="range"] {
    flex: 1;
    min-width: 100px;
}
input[type="color"] {
    width: 32px;
    height: 32px;
    padding: 2px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.advanced-container {
    position: relative;
}

.advanced-trigger {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #f1f5f9;
    border-radius: 12px;
    cursor: pointer;
    font-size: 0.75rem;
    color: #475569;
    transition: all 0.2s;
}
.advanced-trigger:hover {
    background: #e2e8f0;
}
.trigger-arrow {
    font-size: 1rem;
    color: #94a3b8;
}

.advanced-gap {
    position: absolute;
    left: 100%;
    top: 0;
    width: 8px;
    height: 100%;
    background: transparent;
    pointer-events: auto;
}

.action-buttons {
    display: flex;
    gap: 10px;
    margin-top: 4px;
}
.action-btn {
    flex: 1;
    padding: 8px 0;
    font-size: 0.75rem;
    font-weight: 500;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
}
.clear-btn {
    background: #f1f5f9;
    color: #475569;
}
.clear-btn:hover {
    background: #e2e8f0;
}
.export-btn {
    background: #10b981;
    color: white;
}
.export-btn:hover {
    background: #059669;
}

.size-inputs {
    display: flex;
    align-items: center;
    gap: 6px;
}
.size-inputs input {
    width: 65px;
}
input, select {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 0.7rem;
    color: #1e293b;
}
.preset-templates {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
.preset-btn {
    padding: 6px 12px;
    font-size: 0.7rem;
    background: #f1f5f9;
    border: none;
    border-radius: 20px;
    cursor: pointer;
}
.preset-btn.active {
    background: #3b82f6;
    color: white;
}
.param-divider {
    height: 1px;
    background: #eef2f6;
    margin: 16px 0;
}
.param-group-inline {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
}

/* 全局悬浮面板样式 */
.advanced-panel-global {
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.2);
    border: 1px solid #e2e8f0;
    overflow: hidden;
}
.panel-header {
    padding: 12px 16px;
    background: #f8fafc;
    border-bottom: 1px solid #eef2f6;
    font-weight: 600;
    font-size: 0.8rem;
}
.panel-body {
    padding: 16px;
    max-height: 500px;
    overflow-y: auto;
}

.border-checkbox {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 0.7rem;
    color: #475569;
}
.border-checkbox input {
    width: 16px;
    height: 16px;
    margin: 0;
    cursor: pointer;
}
.info-tip {
    font-size: 0.65rem;
    color: #94a3b8;
    margin-left: 4px;
}
</style>