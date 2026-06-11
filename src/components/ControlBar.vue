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
        
        <!-- 通用参数：间距（内边距）+ 外框 -->
        <div class="param-group">
            <div class="param-row">
                <span class="param-label">内边距</span>
                <input type="range" :value="spacing" min="0" max="50" @input="$emit('spacing-change', parseInt($event.target.value))">
                <span class="param-value">{{ spacing }}px</span>
                <label class="border-checkbox">
                    <input type="checkbox" :checked="showOuterBorder" @change="$emit('update-show-outer-border', $event.target.checked)">
                    <span>外框</span>
                </label>
            </div>
            <div class="param-row">
                <span class="param-label">背景</span>
                <div class="bg-controls">
                    <input type="color" :value="bgColor" @click="onColorPickerClick" @input="onColorChange">
                    <button class="transparent-btn" :class="{ active: useTransparent }" @click="$emit('toggle-transparent', !useTransparent)">透明</button>
                </div>
                <!-- 蒙版下拉框放在背景行右侧 -->
                <select :value="maskShape" @input="$emit('update-mask-shape', $event.target.value)" class="mask-select">
                    <option value="none">无蒙版</option>
                    <option value="circle">圆形蒙版</option>
                    <option value="roundRect">圆角矩形蒙版</option>
                </select>
            </div>
        </div>

        <!-- 高级选项容器 -->
        <div class="advanced-container"
             @mouseenter="handleMouseEnter"
             @mouseleave="handleMouseLeave">
            <div class="advanced-trigger" ref="advancedTriggerRef">
                <span>⚙️ 高级设置</span>
                <span class="trigger-arrow">›</span>
            </div>
            
            <div class="advanced-gap"></div>
            
            <Teleport to="body">
                <div v-show="showAdvancedPanel || keepPanelOpen" 
                     ref="advancedPanelRef"
                     class="advanced-panel-global"
                     :class="{ 'panel-sticky': keepPanelOpen }"
                     :style="panelStyle"
                     @mouseenter="handleMouseEnter"
                     @mouseleave="handleMouseLeave">
                    <div class="panel-header">
                        <span>高级设置 - {{ currentModeLabel }}</span>
                        <label class="pin-checkbox">
                            <input type="checkbox" v-model="keepPanelOpen">
                            <span>📌 固定</span>
                        </label>
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
                        
                        <!-- 高级选项：圆角半径和填充方式 -->
                        <div class="param-divider"></div>
                        <div v-if="maskShape === 'roundRect'" class="param-row">
                            <span class="param-label">圆角半径</span>
                            <input type="range" :value="cornerRadius" min="0" max="100" step="1" @input="$emit('update-corner-radius', parseInt($event.target.value))">
                            <span class="param-value">{{ cornerRadius }}px</span>
                        </div>
                        <div class="param-row">
                            <span class="param-label">填充方式</span>
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
    'select-preset-template', 'update-show-outer-border',
    'clear-canvas', 'export'
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
const keepPanelOpen = ref(false);
const advancedTriggerRef = ref(null);
const advancedPanelRef = ref(null);
const panelStyle = ref({});
let hideTimeout = null;
let isAdjusting = false;
let resizeObserver = null;

const getControlsSectionRect = () => {
    const section = document.querySelector('.controls-section');
    if (!section) return null;
    return section.getBoundingClientRect();
};

const adjustPanelPosition = () => {
    if (isAdjusting) return;
    isAdjusting = true;
    
    nextTick(() => {
        const triggerRect = advancedTriggerRef.value?.getBoundingClientRect();
        const panelEl = advancedPanelRef.value;
        const controlsRect = getControlsSectionRect();
        
        if (!triggerRect || !panelEl || !controlsRect) {
            isAdjusting = false;
            return;
        }
        
        const targetHeight = controlsRect.height;
        // 使用控制区的顶部位置，而不是触发器的顶部位置
        let top = controlsRect.top;
        
        // 确保面板不超出视口顶部
        if (top < 0) top = 0;
        
        panelStyle.value = {
            position: 'fixed',
            left: `${triggerRect.right + 8}px`,
            top: `${top}px`,
            width: '320px',
            height: `${targetHeight}px`,
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column'
        };
        
        isAdjusting = false;
    });
};

const setupResizeObserver = () => {
    const controlsSection = document.querySelector('.controls-section');
    if (controlsSection && window.ResizeObserver) {
        resizeObserver = new ResizeObserver(() => {
            if (showAdvancedPanel.value || keepPanelOpen.value) {
                adjustPanelPosition();
            }
        });
        resizeObserver.observe(controlsSection);
    }
};

const handleMouseEnter = async () => {
    if (keepPanelOpen.value) return;
    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
    }
    if (!showAdvancedPanel.value) {
        showAdvancedPanel.value = true;
        await nextTick();
        requestAnimationFrame(() => {
            adjustPanelPosition();
        });
    }
};

const handleMouseLeave = () => {
    if (keepPanelOpen.value) return;
    hideTimeout = setTimeout(() => {
        showAdvancedPanel.value = false;
    }, 200);
};

const handleResize = () => {
    if (showAdvancedPanel.value || keepPanelOpen.value) {
        adjustPanelPosition();
    }
};

watch(keepPanelOpen, (newVal) => {
    if (newVal) {
        showAdvancedPanel.value = true;
        adjustPanelPosition();
    }
});

watch(showAdvancedPanel, (newVal) => {
    if (newVal) {
        requestAnimationFrame(() => {
            adjustPanelPosition();
        });
    }
});

onMounted(() => {
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    setupResizeObserver();
    
    setTimeout(() => {
        if (showAdvancedPanel.value || keepPanelOpen.value) {
            adjustPanelPosition();
        }
    }, 100);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('scroll', handleResize, true);
    if (resizeObserver) {
        resizeObserver.disconnect();
    }
    if (hideTimeout) clearTimeout(hideTimeout);
});

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
    padding: 0 0 16px 0;
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
    border-radius: 0;
    border-top: 1px solid #e8ecf0;  /* 添加上边框 */
    height: 41px;
    box-sizing: border-box;
}
.mode-tab {
    flex: 1;
    padding: 8px 0;
    font-size: 0.75rem;
    font-weight: 500;
    color: #64748b;
    background: transparent;
    border: none;
    border-radius: 0;
    cursor: pointer;
    transition: all 0.2s;
    height: 100%;
    box-sizing: border-box;
}
.mode-tab.active {
    background: #ffffff;
    color: #3b82f6;
    box-shadow: none;
}

.param-group {
    background: #f8fafc;
    border-radius: 0;
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
.mask-select {
    margin-left: auto;
    width: 120px;
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

.border-checkbox {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    font-size: 0.7rem;
    color: #475569;
    margin-left: 8px;
}
.border-checkbox input {
    width: 16px;
    height: 16px;
    margin: 0;
    cursor: pointer;
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
    border-radius: 0;
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
    gap: 12px;
    margin: 8px 12px 0 12px;
}
.action-btn {
    flex: 1;
    padding: 8px 16px;
    font-size: 0.75rem;
    font-weight: 500;
    border: none;
    border-radius: 20px;
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
    border-radius: 0;
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
    border-top: 1px solid #e8ecf0;
    border-right: 1px solid #e8ecf0;
    border-bottom: 1px solid #e8ecf0;
    border-left: none;
    overflow: hidden;
}
.advanced-panel-global.panel-sticky {
    border-top: 1px solid #e8ecf0;
    border-right: 1px solid #e8ecf0;
    border-bottom: 1px solid #e8ecf0;
    border-left: none;
}
.panel-header {
    padding: 12px 16px;
    background: #f8fafc;
    font-weight: 600;
    font-size: 0.8rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    height: 41px;
    box-sizing: border-box;
    border-top: 1px solid #e8ecf0;
}
.pin-checkbox {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.7rem;
    font-weight: normal;
    cursor: pointer;
    color: #64748b;
}
.pin-checkbox input {
    width: 14px;
    height: 14px;
    margin: 0;
    cursor: pointer;
}
.panel-body {
    padding: 16px;
    overflow-y: auto;
    flex: 1;
}
.panel-body::-webkit-scrollbar {
    width: 6px;
}
.panel-body::-webkit-scrollbar-track {
    background: #f1f5f9;
}
.panel-body::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}
.panel-body::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
</style>