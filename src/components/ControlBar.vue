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
        
        <!-- 通用参数：内间距 + 外边框 + 背景 -->
        <div class="param-group">
            <!-- 内间距 -->
            <div class="param-row">
                <span class="param-label">内间距</span>
                <input type="range" :value="spacing" min="0" max="200" @input="$emit('spacing-change', parseInt($event.target.value))">
                <div class="number-input-wrapper">
                    <input 
                        type="number" 
                        :value="spacing" 
                        min="0" 
                        max="200" 
                        step="1"
                        @input="$emit('spacing-change', parseInt($event.target.value))"
                        @blur="validateSpacing"
                    >
                    <span>px</span>
                </div>
            </div>
            
            <!-- 外边框 -->
            <div class="param-row" :class="{ 'param-disabled': mode === 'free' }">
                <span class="param-label">外边框</span>
                <input type="range" :value="outerBorderSize" min="0" max="200" @input="$emit('outer-border-change', parseInt($event.target.value))">
                <div class="number-input-wrapper">
                    <input 
                        type="number" 
                        :value="outerBorderSize" 
                        min="0" 
                        max="200" 
                        step="1"
                        @input="$emit('outer-border-change', parseInt($event.target.value))"
                        @blur="validateOuterBorder"
                    >
                    <span>px</span>
                </div>
            </div>
            
            <!-- 背景色 -->
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
        <div class="advanced-container">
            <div class="advanced-trigger" ref="advancedTriggerRef">
                <!-- 左侧：画布尺寸输入（独立卡片） -->
                <div class="size-input-wrapper">
                    <div class="size-input-group">
                        <span class="size-label">画布尺寸</span>
                        <input 
                            type="number" 
                            :value="canvasWidth" 
                            @input="$emit('update-canvas-width', parseInt($event.target.value) || 800)" 
                            min="100" 
                            step="10"
                            class="size-input"
                        >
                        <span class="size-sep">×</span>
                        <input 
                            type="number" 
                            :value="canvasHeight" 
                            @input="$emit('update-canvas-height', parseInt($event.target.value) || 600)" 
                            min="100" 
                            step="10"
                            class="size-input"
                        >
                        <span class="size-unit">px</span>
                    </div>
                </div>

                <!-- 分隔线 -->
                <div class="divider"></div>

                <!-- 右侧：高级设置（独立卡片） -->
                <div 
                    class="trigger-right-wrapper"
                    @mouseenter="handleMouseEnter"
                    @mouseleave="handleMouseLeave"
                    @click.stop="toggleAdvancedPanel"
                >
                    <span>⚙️ 高级设置</span>
                    <span class="trigger-arrow">›</span>
                </div>
            </div>

            <Teleport to="body">
                <div v-show="showAdvancedPanel || keepPanelOpen" 
                     ref="advancedPanelRef"
                     class="advanced-panel-global"
                     :class="{ 'panel-sticky': keepPanelOpen }"
                     :style="panelStyle"
                     @mouseenter="handleMouseEnter"
                     @mouseleave="handleMouseLeave"
                >
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
                            <div class="param-row" style="color: #94a3b8; font-size: 0.7rem;">
                                画布尺寸已在上方调整
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
                                    <span>px</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 瀑布流模式参数 -->
                        <div v-if="mode === 'masonry'" class="param-group-inline">
                            <div class="param-row">
                                <span class="param-label">列数</span>
                                <div class="number-input-wrapper">
                                    <input type="number" :value="masonryCols" min="1" max="6" step="1" @input="$emit('update-masonry-cols', parseInt($event.target.value))">
                                    <span>列</span>
                                </div>
                            </div>
                            <div class="param-row">
                                <span class="param-label">列宽</span>
                                <div class="number-input-wrapper">
                                    <input type="number" :value="masonryColumnWidth" min="50" step="10" @input="$emit('update-masonry-column-width', parseInt($event.target.value))">
                                    <span>px</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 预设模式参数 -->
                        <div v-if="mode === 'preset'" class="param-group-inline">
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
                        
                        <div class="param-divider"></div>
                        <div v-if="maskShape === 'roundRect'" class="param-row">
                            <span class="param-label">圆角半径</span>
                            <input type="range" :value="cornerRadius" min="0" max="100" step="1" @input="$emit('update-corner-radius', parseInt($event.target.value))">
                            <div class="number-input-wrapper">
                                <input type="number" :value="cornerRadius" min="0" max="100" step="1" @input="$emit('update-corner-radius', parseInt($event.target.value))">
                                <span>px</span>
                            </div>
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
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';

const emit = defineEmits([
    'mode-change', 'spacing-change', 'bg-color-change', 'toggle-transparent',
    'update-canvas-width', 'update-canvas-height',
    'update-grid-rows', 'update-grid-cols', 'update-grid-layout',
    'update-masonry-cols', 'update-masonry-column-width',
    'update-cell-width', 'update-cell-height', 'update-fill-mode',
    'update-mask-shape', 'update-corner-radius',
    'clear-canvas', 'export',
    'select-sub-mode',
    'update:presetGridType', 'update:presetSubModeId',
    'outer-border-change'
]);

const props = defineProps({
    mode: { type: String, default: 'preset' },
    spacing: { type: Number, default: 12 },
    outerBorderSize: { type: Number, default: 0 },
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
    presetGridType: { type: [Number, String], default: 2 },
    presetSubModeId: { type: String, default: '2-horizontal' }
});

// ---- 验证函数 ----
const validateSpacing = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 0;
    if (val < 0) val = 0;
    if (val > 200) val = 200;
    if (val !== props.spacing) {
        emit('spacing-change', val);
    }
};

const validateOuterBorder = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 0;
    if (val < 0) val = 0;
    if (val > 200) val = 200;
    if (val !== props.outerBorderSize) {
        emit('outer-border-change', val);
    }
};

// ---- 预设子模式库 ----
const subModeLibrary = {
    2: [
        { id: '2-horizontal', name: '横向双拼' },
        { id: '2-vertical', name: '纵向双拼' },
        { id: '2-vertical-2-1', name: '纵向2:1双拼' },
        { id: '2-horizontal-2-1', name: '横向2:1双拼' },
        { id: '2-horizontal-1-2', name: '横向1:2双拼' },
        { id: '2-vertical-1-2', name: '纵向1:2双拼' },
        { id: '2-trapezoid-horizontal', name: '横向斜切双拼' }
    ],
    3: [
        { id: '3-horizontal', name: '横向三拼' },
        { id: '3-vertical', name: '纵向三拼' },
        { id: '3-1-2', name: '上一下二' },
        { id: '3-2-1', name: '上二下一' },
        { id: '3-left-2-1', name: '左二右一' },
        { id: '3-left-1-2', name: '左一右二' }
    ],
    4: [
        { id: '4-grid', name: '2x2网格' },
        { id: '4-horizontal', name: '横向四拼' },
        { id: '4-vertical', name: '纵向四拼' },
        { id: '4-1-3', name: '上一下三' },
        { id: '4-3-1', name: '上三下一' },
        { id: '4-left-1-3', name: '左一右三' },
        { id: '4-left-3-1', name: '左三右一' },
        { id: '4-diagonal', name: '对角大小' }
    ],
    5: [
        { id: '5-2x3', name: '2x3布局' },
        { id: '5-left-2-3', name: '左二右三' },
        { id: '5-left-3-2', name: '左三右二' },
        { id: '5-top-2-3', name: '上二下三' },
        { id: '5-top-3-2', name: '上三下二' }
    ],
    6: [
        { id: '6-2x3', name: '2行3列' },
        { id: '6-3x2', name: '3行2列' },
        { id: '6-top-2-4', name: '上2下4' },
        { id: '6-top-4-2', name: '上4下2' },
        { id: '6-left-4-2', name: '左4右2' },
        { id: '6-left-2-4', name: '左2右4' }
    ],
    7: [
        { id: '7-1-3-3', name: '1-3-3' },
        { id: '7-top-4-3', name: '上4下3' },
        { id: '7-top-3-4', name: '上3下4' },
        { id: '7-3-1-3', name: '3-1-3' },
        { id: '7-3-2-2', name: '3-2-2' },
        { id: '7-1-3-3-h2', name: '1-3-3(高2:1:1)' },
        { id: '7-2-3-2', name: '2-3-2' },
        { id: '7-3-3-1', name: '3-3-1' }
    ],
    8: [
        { id: '8-2x4', name: '2行4列' },
        { id: '8-4x2', name: '4行2列' },
        { id: '8-3-2-3', name: '3-2-3' },
        { id: '8-1-3-4', name: '1-3-4' },
        { id: '8-3-2-3-h', name: '左3中2右3' }
    ],
    9: [
        { id: '9-grid', name: '3x3网格' },
        { id: '9-1-4-4', name: '1-4-4' },
        { id: '9-3-3-3-col', name: '3-3-3(1:2:1)' },
        { id: '9-4-1-4', name: '4-1-4' },
        { id: '9-1-2-3-3', name: '1-2-3-3' },
        { id: '9-3-3-3-var', name: '3-3-3(变种)' }
    ],
    text: [
        { id: 'text-simple', name: '图文模式' }
    ]
};

const currentSubModes = computed(() => subModeLibrary[props.presetGridType] || []);

const selectGridType = (type) => {
    emit('update:presetGridType', type);
    const subs = subModeLibrary[type];
    if (subs && subs.length) {
        emit('update:presetSubModeId', subs[0].id);
    }
};

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

// ---- 高级面板控制 ----
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

const toggleAdvancedPanel = () => {
    if (showAdvancedPanel.value && keepPanelOpen.value) {
        keepPanelOpen.value = false;
        showAdvancedPanel.value = false;
    } else {
        showAdvancedPanel.value = true;
        keepPanelOpen.value = true;
        adjustPanelPosition();
    }
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

/* ========== 高级容器 ========== */
.advanced-container {
    position: relative;
    background: #f1f5f9;
}

/* 分隔线：贯穿整个 advanced-container 高度 */
.advanced-container::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 1px;
    background: #b0b8c4; /* 灰色分隔线，略深于背景 */
    transform: translateX(-50%);
    pointer-events: none;
    z-index: 1;
}

/* 触发器行 */
.advanced-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 16px;
    background: #f1f5f9;
    gap: 0;
    position: relative;
    z-index: 2; /* 确保内容在分隔线之上 */
}

/* 左侧画布尺寸输入卡片 */
.size-input-wrapper {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
}

.size-input-group {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 2px;
}
.size-label {
    font-weight: 500;
    color: #475569;
    font-size: 0.7rem;
    margin-right: 2px;
}
.size-input {
    width: 50px;
    padding: 4px 6px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 0.7rem;
    text-align: center;
    background: white;
}
.size-input:focus {
    outline: none;
    border-color: #3b82f6;
}
.size-sep {
    font-weight: bold;
    color: #64748b;
    font-size: 0.8rem;
}
.size-unit {
    color: #6b7280;
    font-size: 0.6rem;
    margin-left: 2px;
}

.divider {
    position: absolute;
    left: 68%;             /* 将分隔线放在中间位置，可调整 left 值 */
    top: 0;
    bottom: 0;
    width: 5px;            /* 分隔线粗细 */
    background: #ffffff;   /* 分隔线颜色 */
    pointer-events: none;  /* 允许点击穿透 */
    z-index: 1;           /* 确保在内容之上 */
}

/* 右侧高级设置卡片 */
.trigger-right-wrapper {
    margin-left: 20px;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 6px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
    color: #475569;
    font-size: 0.7rem;
}
.trigger-right-wrapper:hover {
    background: #eef2f6;
}
.trigger-arrow {
    font-size: 1rem;
    transition: transform 0.2s;
}

/* 高级面板（浮窗） */
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

/* 其他通用 */
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
.number-input-wrapper {
    display: flex;
    align-items: center;
    gap: 4px;
}
.number-input-wrapper input {
    width: 60px;
    text-align: center;
}
input, select {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 0.7rem;
}
input[type="range"] {
    flex: 1;
    min-width: 100px;
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
.param-disabled {
    opacity: 0.5;
    pointer-events: none;
}
</style>