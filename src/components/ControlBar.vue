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
                        
                        <!-- 预设模式参数（重构后） -->
                        <div v-if="mode === 'preset'" class="param-group-inline">
                            <!-- 宫格类型选择 -->
                            <div class="preset-category">
                                <div class="category-title">选择宫格类型</div>
                                <div class="category-buttons">
                                    <button 
                                        v-for="num in [2,3,4,5,6,7,8,9]" 
                                        :key="num"
                                        :class="['category-btn', { active: presetGridType === num }]"
                                        @click="selectGridType(num)"
                                    >
                                        {{ num }}宫格
                                    </button>
                                    <button 
                                        :class="['category-btn', { active: presetGridType === 'text' }]"
                                        @click="selectGridType('text')"
                                    >
                                        图文模式
                                    </button>
                                </div>
                            </div>
                            
                            <!-- 子模式选择（根据宫格类型动态显示） -->
                            <div v-if="currentSubModes.length" class="preset-submode">
                                <div class="submode-title">选择布局</div>
                                <div class="submode-buttons">
                                    <button 
                                        v-for="sub in currentSubModes" 
                                        :key="sub.id"
                                        :class="['submode-btn', { active: presetSubModeId === sub.id }]"
                                        @click="$emit('select-sub-mode', sub.id)"
                                    >
                                        {{ sub.name }}
                                    </button>
                                </div>
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

// 定义模型（双向绑定）
const emit = defineEmits([
    'mode-change', 'spacing-change', 'bg-color-change', 'toggle-transparent',
    'update-canvas-width', 'update-canvas-height',
    'update-grid-rows', 'update-grid-cols', 'update-grid-layout',
    'update-masonry-cols', 'update-masonry-column-width',
    'update-cell-width', 'update-cell-height', 'update-fill-mode',
    'update-mask-shape', 'update-corner-radius',
    'select-preset-template', 'update-show-outer-border',
    'clear-canvas', 'export',
    'select-sub-mode'  // 新增子模式选择事件
]);

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
    showOuterBorder: { type: Boolean, default: false },
    // 新增预设模式相关props
    presetGridType: { type: [Number, String], default: 2 },
    presetSubModeId: { type: String, default: '2-horizontal' }
});

// 子模式库
const subModeLibrary = {
    2: [
        { id: '2-horizontal', name: '横向双拼', layout: { rows: 1, cols: 2, cells: 2 } },
        { id: '2-vertical', name: '纵向双拼', layout: { rows: 2, cols: 1, cells: 2 } }
    ],
    3: [
        { id: '3-horizontal', name: '横向三拼', layout: { rows: 1, cols: 3, cells: 3 } },
        { id: '3-vertical', name: '纵向三拼', layout: { rows: 3, cols: 1, cells: 3 } }
    ],
    4: [
        { id: '4-grid', name: '2x2网格', layout: { rows: 2, cols: 2, cells: 4 } },
        { id: '4-horizontal', name: '横向四拼', layout: { rows: 1, cols: 4, cells: 4 } },
        { id: '4-vertical', name: '纵向四拼', layout: { rows: 4, cols: 1, cells: 4 } }
    ],
    5: [
        { id: '5-2x3', name: '2+3布局', layout: { rows: 2, cols: 3, cells: 5 } }
    ],
    6: [
        { id: '6-2x3', name: '2x3网格', layout: { rows: 2, cols: 3, cells: 6 } },
        { id: '6-3x2', name: '3x2网格', layout: { rows: 3, cols: 2, cells: 6 } }
    ],
    7: [
        { id: '7-1-3-3', name: '1+3+3布局', layout: { rows: 3, cols: 3, cells: 7 } }
    ],
    8: [
        { id: '8-2x4', name: '2x4网格', layout: { rows: 2, cols: 4, cells: 8 } },
        { id: '8-4x2', name: '4x2网格', layout: { rows: 4, cols: 2, cells: 8 } }
    ],
    9: [
        { id: '9-grid', name: '3x3网格', layout: { rows: 3, cols: 3, cells: 9 } }
    ],
    text: [
        { id: 'text-simple', name: '图文模式', layout: { type: 'text', cells: 1 } }
    ]
};

const currentSubModes = computed(() => subModeLibrary[props.presetGridType] || []);

// 选择宫格类型
const selectGridType = (type) => {
    emit('update:presetGridType', type);
    // 自动选中第一个子模式
    const subs = subModeLibrary[type];
    if (subs && subs.length) {
        emit('update:presetSubModeId', subs[0].id);
    }
};

// 其他原有代码（模式选项等）
const modeOptions = [
    { value: 'preset', label: '预设', icon: '🎨' },
    { value: 'free', label: '自由', icon: '✨' },
    { value: 'grid', label: '网格', icon: '🔲' },
    { value: 'masonry', label: '瀑布流', icon: '🏞️' }
];

const currentModeLabel = computed(() => {
    const opt = modeOptions.find(o => o.value === props.mode);
    return opt ? opt.label : '预设';
});

// 高级面板控制（保持不变）
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
        let top = controlsRect.top;
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
}
.mode-tab.active {
    background: #ffffff;
    color: #3b82f6;
}
.param-group {
    background: #f8fafc;
    padding: 10px 12px;
}
.param-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
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
.border-checkbox {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    font-size: 0.7rem;
    margin-left: 8px;
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
    cursor: pointer;
    font-size: 0.75rem;
}
.trigger-arrow {
    font-size: 1rem;
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
}
.clear-btn {
    background: #f1f5f9;
    color: #475569;
}
.export-btn {
    background: #10b981;
    color: white;
}
.size-inputs {
    display: flex;
    align-items: center;
    gap: 6px;
}
input, select {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 0.7rem;
}
.preset-category {
    margin-bottom: 16px;
}
.category-title, .submode-title {
    font-size: 0.7rem;
    font-weight: 500;
    margin-bottom: 8px;
    color: #475569;
}
.category-buttons, .submode-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
.category-btn, .submode-btn {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.7rem;
    cursor: pointer;
}
.category-btn.active, .submode-btn.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
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
.advanced-panel-global {
    background: #ffffff;
    border-top: 1px solid #e8ecf0;
    border-right: 1px solid #e8ecf0;
    border-bottom: 1px solid #e8ecf0;
    border-left: none;
    overflow: hidden;
}
.panel-header {
    padding: 12px 16px;
    background: #f8fafc;
    font-weight: 600;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 41px;
    box-sizing: border-box;
}
.pin-checkbox {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.7rem;
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
</style>