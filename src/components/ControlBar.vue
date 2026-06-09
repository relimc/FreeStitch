<template>
    <div class="control-bar">
        <!-- 模式按钮组 -->
        <div class="mode-buttons">
            <button 
                v-for="opt in modeOptions" 
                :key="opt.value"
                :class="['mode-btn', { active: mode === opt.value }]"
                @click="$emit('mode-change', opt.value)"
            >
                {{ opt.label }}
            </button>
        </div>

        <!-- 参数面板 -->
        <div class="control-panels">
            <!-- 通用参数区（间距、背景色、透明重置） -->
            <div class="common-panel">
                <div class="control-group">
                    <label>📏 间距</label>
                    <input type="range" :value="spacing" min="0" max="50" @input="$emit('spacing-change', parseInt($event.target.value))">
                    <span>{{ spacing }}px</span>
                </div>

                <div class="control-group">
                    <label>🎨 背景色</label>
                    <input type="color" :value="bgColor" @input="onColorChange">
                    <span class="reset-icon" @click="resetTransparent" title="重置为透明背景">↺</span>
                </div>

                <div class="control-group">
                    <label>🎭 蒙版形状</label>
                    <select :value="maskShape" @change="$emit('update-mask-shape', $event.target.value)">
                        <option value="none">无</option>
                        <option value="circle">圆形</option>
                        <option value="roundRect">圆角矩形</option>
                    </select>
                </div>

                <button class="action-btn clear-canvas-btn" @click="$emit('clear-canvas')">🗑️ 清空画布</button>

                <div v-if="maskShape === 'roundRect'" class="control-group">
                    <label>📏 圆角半径</label>
                    <input type="number" :value="cornerRadius" min="0" max="100" step="5" @input="$emit('update-corner-radius', parseInt($event.target.value))">
                    <span>px</span>
                </div>

            </div>

            <!-- 模式特定参数区 -->
            <div class="mode-panel">
                <!-- 自由模式 -->
                <div v-if="mode === 'free'" class="mode-params">
                    <div class="control-group">
                        <label>📐 画布宽度</label>
                        <input type="number" :value="canvasWidth" min="100" step="10" @input="$emit('canvas-width-change', parseInt($event.target.value))">
                        <span>px</span>
                    </div>
                    <div class="control-group">
                        <label>📏 画布高度</label>
                        <input type="number" :value="canvasHeight" min="100" step="10" @input="$emit('canvas-height-change', parseInt($event.target.value))">
                        <span>px</span>
                    </div>
                    <div class="control-group">
                        <label>🔍 预览最大尺寸</label>
                        <input type="range" :value="previewMaxSize" min="80" max="320" @input="$emit('update-preview-max-size', parseInt($event.target.value))">
                        <span>{{ previewMaxSize }}px</span>
                        <div class="info-tip">仅影响预览，导出可勾选原始尺寸</div>
                    </div>
                    <div class="control-group">
                        <label>📤 导出原始尺寸</label>
                        <input type="checkbox" :checked="useOriginalSizeInFree" @change="$emit('update-use-original-size', $event.target.checked)">
                        <div class="info-tip">勾选则按图片原始像素导出</div>
                    </div>
                </div>

                <!-- 横向拼接模式 -->
                <div v-if="mode === 'horizontal'" class="mode-params">
                    <div class="control-group">
                        <label>🔧 固定高度</label>
                        <input type="checkbox" :checked="fixedHeightEnabled" @change="$emit('update-fixed-height-enabled', $event.target.checked)">
                    </div>
                    <div class="control-group" v-if="fixedHeightEnabled">
                        <label>📏 高度(px)</label>
                        <input type="number" :value="fixedHeight" min="50" step="10" @input="$emit('update-fixed-height', parseInt($event.target.value))">
                        <span>px</span>
                    </div>
                    <div class="info-tip" v-if="!fixedHeightEnabled">✨ 默认自适应高度（图片原始高度）</div>
                </div>

                <!-- 纵向拼接模式 -->
                <div v-if="mode === 'vertical'" class="mode-params">
                    <div class="control-group">
                        <label>🔧 固定宽度</label>
                        <input type="checkbox" :checked="fixedWidthEnabled" @change="$emit('update-fixed-width-enabled', $event.target.checked)">
                    </div>
                    <div class="control-group" v-if="fixedWidthEnabled">
                        <label>📏 宽度(px)</label>
                        <input type="number" :value="fixedWidth" min="50" step="10" @input="$emit('update-fixed-width', parseInt($event.target.value))">
                        <span>px</span>
                    </div>
                    <div class="info-tip" v-if="!fixedWidthEnabled">✨ 默认自适应宽度（图片原始宽度）</div>
                </div>

                <!-- 网格模式 -->
                <div v-if="mode === 'grid'" class="mode-params">
                    <div class="control-group">
                        <label>📊 行数</label>
                        <input type="number" :value="gridRows" min="1" max="10" step="1" @input="$emit('update-grid-rows', parseInt($event.target.value))">
                        <span> 行</span>
                    </div>
                    <div class="control-group">
                        <label>📊 列数</label>
                        <input type="number" :value="gridCols" min="1" max="10" step="1" @input="$emit('update-grid-cols', parseInt($event.target.value))">
                        <span> 列</span>
                    </div>
                    <div class="control-group">
                        <label>📦 单元格宽度</label>
                        <input type="number" :value="cellWidth" min="0" step="10" @input="$emit('update-cell-width', parseInt($event.target.value))">
                        <span>px</span>
                    </div>
                    <div class="control-group">
                        <label>📦 单元格高度</label>
                        <input type="number" :value="cellHeight" min="0" step="10" @input="$emit('update-cell-height', parseInt($event.target.value))">
                        <span>px</span>
                    </div>
                    <div class="control-group">
                        <label>🎨 填充方式</label>
                        <select :value="fillMode" @change="$emit('update-fill-mode', $event.target.value)">
                            <option value="contain">contain (保持比例留白)</option>
                            <option value="cover">cover (裁剪填充)</option>
                        </select>
                    </div>
                    <div class="info-tip" v-if="!cellWidth || !cellHeight">✨ 留空则自动计算单元格大小</div>
                </div>

                <!-- 瀑布流模式 -->
                <div v-if="mode === 'masonry'" class="mode-params">
                    <div class="control-group">
                        <label>📊 列数</label>
                        <input type="number" :value="masonryCols" min="1" max="6" step="1" @input="$emit('update-masonry-cols', parseInt($event.target.value))">
                        <span> 列</span>
                    </div>
                    <div class="control-group">
                        <label>📏 列宽(px)</label>
                        <input type="number" :value="masonryColumnWidth" min="50" step="10" @input="$emit('update-masonry-column-width', parseInt($event.target.value))">
                        <span>px</span>
                    </div>
                    <div class="info-tip">瀑布流中每张图片宽度固定，高度自适应</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    mode: { type: String, default: 'free' },
    spacing: { type: Number, default: 12 },
    bgColor: { type: String, default: '#ffffff' },
    useTransparent: { type: Boolean, default: true },
    canvasWidth: { type: Number, default: 800 },
    canvasHeight: { type: Number, default: 600 },
    gridRows: { type: Number, default: 3 },
    gridCols: { type: Number, default: 3 },
    masonryCols: { type: Number, default: 3 },
    fixedHeightEnabled: { type: Boolean, default: false },
    fixedHeight: { type: Number, default: 200 },
    fixedWidthEnabled: { type: Boolean, default: false },
    fixedWidth: { type: Number, default: 200 },
    cellWidth: { type: Number, default: 0 },
    cellHeight: { type: Number, default: 0 },
    fillMode: { type: String, default: 'contain' },
    previewMaxSize: { type: Number, default: 160 },
    useOriginalSizeInFree: { type: Boolean, default: false },
    maskShape: { type: String, default: 'none' },
    cornerRadius: { type: Number, default: 20 },
    masonryColumnWidth: { type: Number, default: 360 }
});

const emit = defineEmits([
    'mode-change', 'spacing-change', 'bg-color-change', 'toggle-transparent',
    'canvas-width-change', 'canvas-height-change', 'export',
    'update-grid-rows', 'update-grid-cols', 'update-masonry-cols',
    'update-fixed-height-enabled', 'update-fixed-height',
    'update-fixed-width-enabled', 'update-fixed-width',
    'update-cell-width', 'update-cell-height', 'update-fill-mode',
    'update-preview-max-size', 'update-use-original-size',
    'update-mask-shape', 'update-corner-radius', 'clear-canvas','update-masonry-column-width'
]);

const onColorChange = (e) => {
    emit('bg-color-change', e.target.value);
    emit('toggle-transparent', false);
};

const resetTransparent = () => {
    emit('toggle-transparent', true);
    emit('bg-color-change', '#ffffff');
};

const modeOptions = [
    { value: 'free', label: '✨ 自由拖拽' },
    { value: 'horizontal', label: '🔄 横向拼接' },
    { value: 'vertical', label: '📐 纵向拼接' },
    { value: 'grid', label: '🔲 网格模式' },
    { value: 'masonry', label: '🏞️ 瀑布流模式' }
];
</script>

<style scoped>
/* 复用之前的样式，此处略（实际使用时需包含完整样式） */
.control-bar {
    background: #ffffff;
    margin: 5px 20px 20px 20px;
    border-radius: 28px;
    padding: 16px 24px;
    border: 1px solid #e8ecf0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    display: flex;
    flex-direction: column;
    gap: 20px;
}
.mode-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: space-between;
    border-bottom: 1px solid #eef2f6;
    padding-bottom: 12px;
}
.mode-btn {
    flex: 1;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 8px 12px;
    border-radius: 40px;
    font-size: 0.8rem;
    font-weight: 500;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
    white-space: nowrap;
}
.mode-btn.active {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}
.mode-btn:hover:not(.active) {
    background: #eef2ff;
    border-color: #cbd5e1;
}
.control-panels {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: space-between;
}
.common-panel,
.mode-panel {
    background: #f8fafc;
    border-radius: 20px;
    padding: 12px 16px;
    border: 1px solid #e2e8f0;
    flex: 1;
    min-width: 200px;
}
.common-panel {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
}
.mode-panel {
    display: flex;
    align-items: center;
    justify-content: flex-start;
}
.mode-params {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    width: 100%;
}
.control-group {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #ffffff;
    padding: 4px 12px;
    border-radius: 48px;
    border: 1px solid #e2e8f0;
}
.control-group label {
    font-weight: 500;
    font-size: 0.75rem;
    color: #334155;
}
select, input {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    padding: 4px 8px;
    border-radius: 32px;
    color: #1e293b;
    font-size: 0.75rem;
    cursor: pointer;
}
.action-btn {
    background: #3b82f6;
    border: none;
    padding: 6px 16px;
    border-radius: 40px;
    font-weight: 500;
    font-size: 0.8rem;
    color: white;
    cursor: pointer;
    transition: 0.2s;
}
.action-btn:hover {
    background: #2563eb;
    transform: translateY(-1px);
}
.download-btn {
    background: #10b981;
}
.download-btn:hover {
    background: #059669;
}
.info-tip {
    font-size: 0.7rem;
    color: #6b7280;
    margin-left: 4px;
}
.reset-icon {
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0 4px;
    user-select: none;
    opacity: 0.7;
    transition: 0.1s;
    line-height: 1;
}
.reset-icon:hover {
    opacity: 1;
    transform: scale(1.1);
}
@media (max-width: 800px) {
    .control-panels {
        flex-direction: column;
    }
    .mode-btn {
        font-size: 0.7rem;
        padding: 6px 8px;
    }
}
</style>