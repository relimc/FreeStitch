<template>
    <div class="free-canvas-container" :style="freeCanvasStyle" ref="containerRef">
        <canvas 
            ref="canvasRef" 
            @mousedown="onCanvasMouseDown"
            @mousemove="onCanvasMouseMove"
            @mouseup="onCanvasMouseUp"
            @mouseleave="onCanvasMouseUp"
            class="free-canvas"
        ></canvas>
        <!-- 角度输入框 -->
        <input 
            ref="angleInputRef"
            type="number"
            v-model="inputAngle"
            class="rotation-angle-input"
            :style="{
                left: inputX + 'px',
                top: inputY + 'px',
                display: showAngleInput ? 'block' : 'none'
            }"
            @input="onAngleInput"
            step="0.1"
            min="-360"
            max="360"
        />
        <div v-if="localImages.length === 0" class="empty-message">
            ✨ 从左侧添加图片，自由拖拽排列
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed, onUnmounted } from 'vue';
import { loadImage } from './utils/canvasHelpers.js';

const props = defineProps({
    images: { type: Array, default: () => [] },
    canvasWidth: { type: Number, default: 800 },
    canvasHeight: { type: Number, default: 600 },
    bgColor: { type: String, default: '#ffffff' },
    useTransparent: { type: Boolean, default: true },
    spacing: { type: Number, default: 12 },
    maxSize: { type: Number, default: 160 },
    showOuterBorder: { type: Boolean, default: false },
    outerBorderSize: { type: Number, default: 0 }
});

const emit = defineEmits(['remove', 'update:images']);

const localImages = ref([]);
const containerRef = ref(null);
const canvasRef = ref(null);
const angleInputRef = ref(null);

// 图片位置和旋转状态
const imagePositions = ref({});
const imageRotations = ref(new Map());
const imageScales = ref(new Map()); // 缩放比例 (0.2 ~ 1.0)

// 悬停和旋转交互状态
const hoveredImageId = ref(null);
let scaleHandleHoverTimeout = null;

const isRotating = ref(false);
const rotatingImageId = ref(null);
const rotationStartAngle = ref(0);
const rotationStartMouseAngle = ref(0);

// 缩放交互状态
const isScaling = ref(false);
const scalingImageId = ref(null);
let scaleStartMouseX = 0;
let scaleStartMouseY = 0;
let scaleStartScale = 1;

// 拖拽状态
let isDragging = false;
let dragImageId = null;
let dragStartX = 0, dragStartY = 0;
let dragStartPosX = 0, dragStartPosY = 0;

// 存储删除按钮、旋转手柄、缩放手柄的区域（用于点击检测）
const deleteButtonRegions = ref([]);
const rotationHandleRegion = ref(null);
const scaleHandleRegion = ref(null);

// 角度输入框状态
const showAngleInput = ref(false);
const inputAngle = ref(0);
const inputX = ref(0);
const inputY = ref(0);

// 图片缓存
const imageCache = new Map();

// ---------- 样式计算 ----------
const freeCanvasStyle = computed(() => {
    let borderColor = 'transparent';
    if (!props.useTransparent && props.showOuterBorder) {
        borderColor = props.bgColor;
    }
    return {
        backgroundColor: props.useTransparent ? 'transparent' : props.bgColor,
        width: `${props.canvasWidth}px`,
        height: `${props.canvasHeight}px`,
        position: 'relative',
        overflow: 'visible',
        margin: 'auto',
        boxShadow: props.showOuterBorder ? `0 0 0 ${props.outerBorderSize}px ${borderColor}` : '0 0 0 2px #cbd5e1',
        transition: 'box-shadow 0.2s ease'
    };
});

// ---------- 获取图片绘制信息 ----------
const getImageDrawInfo = (img) => {
    const pos = imagePositions.value[img.id] || { x: 20, y: 20 };
    const scale = imageScales.value.get(img.id) || 0.5;
    const width = img.width * scale;
    const height = img.height * scale;
    const rotation = imageRotations.value.get(img.id) || 0;
    return { x: pos.x, y: pos.y, width, height, rotation };
};

// ---------- 绘制删除按钮 ----------
const drawDeleteButton = (ctx, cx, cy, imgWidth, imgHeight) => {
    const size = 18;
    const x = cx + imgWidth/2 - size - 4;
    const y = cy - imgHeight/2 + 4;
    const radius = size / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    ctx.beginPath();
    ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#e74c3c';
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 14px "Arial", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('×', x + radius, y + radius + 1);

    ctx.restore();

    return { x, y, w: size, h: size };
};

// ---------- 绘制旋转手柄（中心位置） ----------
const drawRotationHandle = (ctx, cx, cy) => {
    const handleRadius = 14;
    const hx = cx;
    const hy = cy;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    ctx.beginPath();
    ctx.arc(hx, hy, handleRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hx, hy, handleRadius, 0, Math.PI * 2);
    ctx.stroke();

    const arrowRadius = handleRadius * 0.6;
    ctx.beginPath();
    ctx.arc(hx, hy, arrowRadius, 0, Math.PI * 1.5);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    const aX = hx + arrowRadius * Math.cos(Math.PI * 1.5);
    const aY = hy + arrowRadius * Math.sin(Math.PI * 1.5);
    ctx.beginPath();
    ctx.moveTo(aX + 6, aY);
    ctx.lineTo(aX - 4, aY + 4);
    ctx.lineTo(aX - 4, aY - 4);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();

    ctx.restore();

    return { x: hx - handleRadius*1.5, y: hy - handleRadius*1.5, w: handleRadius*3, h: handleRadius*3 };
};

// ---------- 绘制缩放手柄（右下角） ----------
const drawScaleHandle = (ctx, cx, cy, imgWidth, imgHeight) => {
    const handleRadius = 18;
    const hotRadius = handleRadius * 2.5;
    const offsetX = imgWidth / 2 + 24;
    const offsetY = imgHeight / 2 + 24;
    const hx = cx + offsetX;
    const hy = cy + offsetY;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    ctx.beginPath();
    ctx.arc(hx, hy, handleRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'white';
    ctx.font = `bold 20px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', hx, hy + 1);

    ctx.restore();

    return { x: hx - hotRadius, y: hy - hotRadius, w: hotRadius * 2, h: hotRadius * 2 };
};

// ---------- 渲染 ----------
const renderCanvas = async () => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const borderSize = props.showOuterBorder ? props.outerBorderSize : 0;
    const totalWidth = props.canvasWidth + borderSize * 2;
    const totalHeight = props.canvasHeight + borderSize * 2;
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (props.useTransparent) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = props.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    ctx.translate(borderSize, borderSize);

    deleteButtonRegions.value = [];
    rotationHandleRegion.value = null;
    scaleHandleRegion.value = null;

    for (const img of localImages.value) {
        const info = getImageDrawInfo(img);
        const cx = info.x + info.width / 2;
        const cy = info.y + info.height / 2;
        const rad = info.rotation * Math.PI / 180;

        let imageEl = imageCache.get(img.id);
        if (!imageEl) {
            imageEl = await loadImage(img.dataURL);
            imageCache.set(img.id, imageEl);
        }

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rad);
        ctx.drawImage(imageEl, -info.width/2, -info.height/2, info.width, info.height);
        ctx.restore();

        const isHoveredOrRotating = (hoveredImageId.value === img.id) || (isRotating.value && rotatingImageId.value === img.id);
        const isHoveredOrScaling = (hoveredImageId.value === img.id) || (isScaling.value && scalingImageId.value === img.id);

        // 删除按钮（非悬停/旋转/缩放时显示）
        if (!isHoveredOrRotating && !isHoveredOrScaling) {
            const deleteRect = drawDeleteButton(ctx, cx, cy, info.width, info.height);
            deleteButtonRegions.value.push({
                id: img.id,
                x: deleteRect.x,
                y: deleteRect.y,
                w: deleteRect.w,
                h: deleteRect.h
            });
        }

        // 旋转手柄（悬停或旋转时显示）
        if (hoveredImageId.value === img.id || (isRotating.value && rotatingImageId.value === img.id)) {
            const handleRect = drawRotationHandle(ctx, cx, cy);
            rotationHandleRegion.value = {
                id: img.id,
                x: handleRect.x,
                y: handleRect.y,
                w: handleRect.w,
                h: handleRect.h,
                centerX: cx,
                centerY: cy
            };
        }

        // 缩放手柄（悬停或缩放时显示）
        if (hoveredImageId.value === img.id || (isScaling.value && scalingImageId.value === img.id)) {
            const scaleRect = drawScaleHandle(ctx, cx, cy, info.width, info.height);
            scaleHandleRegion.value = {
                id: img.id,
                x: scaleRect.x,
                y: scaleRect.y,
                w: scaleRect.w,
                h: scaleRect.h
            };
        }
    }

    ctx.restore();

    if (props.showOuterBorder && borderSize > 0 && !props.useTransparent) {
        ctx.save();
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        ctx.strokeRect(borderSize, borderSize, props.canvasWidth, props.canvasHeight);
        ctx.restore();
    }

    // 同步角度输入框
    if (rotationHandleRegion.value) {
        const imgId = rotationHandleRegion.value.id;
        const angle = imageRotations.value.get(imgId) || 0;
        inputAngle.value = Math.round(angle * 10) / 10;
        // 定位输入框（相对于容器）
        const borderSize2 = props.showOuterBorder ? props.outerBorderSize : 0;
        inputX.value = rotationHandleRegion.value.centerX + borderSize2;
        inputY.value = rotationHandleRegion.value.centerY - 10 + borderSize2;
    }
};

// ---------- 坐标转换 ----------
const getCanvasCoords = (e) => {
    const canvas = canvasRef.value;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
};

// ---------- 检测点击图片（考虑旋转） ----------
const getImageIdAt = (mx, my) => {
    const borderSize = props.showOuterBorder ? props.outerBorderSize : 0;
    const cx = mx - borderSize;
    const cy = my - borderSize;
    if (cx < 0 || cy < 0 || cx > props.canvasWidth || cy > props.canvasHeight) return null;

    for (let i = localImages.value.length - 1; i >= 0; i--) {
        const img = localImages.value[i];
        const info = getImageDrawInfo(img);
        const halfW = info.width / 2;
        const halfH = info.height / 2;
        const centerX = info.x + halfW;
        const centerY = info.y + halfH;
        const rad = -info.rotation * Math.PI / 180;

        const dx = cx - centerX;
        const dy = cy - centerY;
        const rotatedX = dx * Math.cos(rad) - dy * Math.sin(rad);
        const rotatedY = dx * Math.sin(rad) + dy * Math.cos(rad);

        if (rotatedX >= -halfW && rotatedX <= halfW && rotatedY >= -halfH && rotatedY <= halfH) {
            return img.id;
        }
    }
    return null;
};

// ---------- 检测是否在删除按钮区域 ----------
const getDeleteButtonAt = (mx, my) => {
    for (const rect of deleteButtonRegions.value) {
        if (mx >= rect.x && mx <= rect.x + rect.w && my >= rect.y && my <= rect.y + rect.h) {
            return rect.id;
        }
    }
    return null;
};

// ---------- 检测是否在旋转手柄区域 ----------
const isOnRotationHandle = (mx, my) => {
    const rect = rotationHandleRegion.value;
    if (!rect) return false;
    return mx >= rect.x && mx <= rect.x + rect.w && my >= rect.y && my <= rect.y + rect.h;
};

// ---------- 检测是否在缩放手柄区域 ----------
const isOnScaleHandle = (mx, my) => {
    const rect = scaleHandleRegion.value;
    if (!rect) return false;
    return mx >= rect.x && mx <= rect.x + rect.w && my >= rect.y && my <= rect.y + rect.h;
};

// ---------- 角度计算 ----------
const getAngleFromCenter = (centerX, centerY, mouseX, mouseY) => {
    return Math.atan2(mouseY - centerY, mouseX - centerX) * 180 / Math.PI;
};

// ---------- 角度输入框处理 ----------
const onAngleInput = () => {
    if (!rotationHandleRegion.value) return;
    const imgId = rotationHandleRegion.value.id;
    const val = parseFloat(inputAngle.value);
    if (!isNaN(val)) {
        imageRotations.value.set(imgId, val);
        renderCanvas();
    }
};

// ---------- 鼠标事件 ----------
const onCanvasMouseDown = (e) => {
    const { x, y } = getCanvasCoords(e);

    // 1. 检测删除按钮
    const deleteId = getDeleteButtonAt(x, y);
    if (deleteId !== null) {
        const index = localImages.value.findIndex(img => img.id === deleteId);
        if (index !== -1) {
            localImages.value.splice(index, 1);
            delete imagePositions.value[deleteId];
            imageRotations.value.delete(deleteId);
            imageScales.value.delete(deleteId);
            imageCache.delete(deleteId);
            emit('remove', deleteId);
            renderCanvas();
        }
        e.preventDefault();
        return;
    }

    // 2. 检测旋转手柄
    if (isOnRotationHandle(x, y) && hoveredImageId.value !== null) {
        const imgId = hoveredImageId.value;
        const info = getImageDrawInfo(localImages.value.find(img => img.id === imgId));
        const centerX = info.x + info.width / 2;
        const centerY = info.y + info.height / 2;
        isRotating.value = true;
        rotatingImageId.value = imgId;
        rotationStartAngle.value = imageRotations.value.get(imgId) || 0;
        rotationStartMouseAngle.value = getAngleFromCenter(centerX, centerY, x, y);
        e.preventDefault();
        return;
    }

    // 3. 检测缩放手柄
    if (isOnScaleHandle(x, y) && hoveredImageId.value !== null) {
        const imgId = hoveredImageId.value;
        isScaling.value = true;
        scalingImageId.value = imgId;
        scaleStartMouseX = x;
        scaleStartMouseY = y;
        scaleStartScale = imageScales.value.get(imgId) || 0.5;
        e.preventDefault();
        return;
    }

    // 4. 检测图片拖拽
    const imgId = getImageIdAt(x, y);
    if (imgId !== null) {
        const img = localImages.value.find(i => i.id === imgId);
        if (img) {
            const pos = imagePositions.value[imgId] || { x: 20, y: 20 };
            isDragging = true;
            dragImageId = imgId;
            dragStartX = x;
            dragStartY = y;
            dragStartPosX = pos.x;
            dragStartPosY = pos.y;
            e.preventDefault();
        }
    }
};

const onCanvasMouseMove = (e) => {
    const { x, y } = getCanvasCoords(e);

    // 旋转中
    if (isRotating.value && rotatingImageId.value !== null) {
        const imgId = rotatingImageId.value;
        const info = getImageDrawInfo(localImages.value.find(img => img.id === imgId));
        const centerX = info.x + info.width / 2;
        const centerY = info.y + info.height / 2;
        const currentAngle = getAngleFromCenter(centerX, centerY, x, y);
        let deltaAngle = currentAngle - rotationStartMouseAngle.value;
        let newRotation = rotationStartAngle.value + deltaAngle;
        imageRotations.value.set(imgId, newRotation);
        if (rotationHandleRegion.value && rotationHandleRegion.value.id === imgId) {
            inputAngle.value = Math.round(newRotation * 10) / 10;
        }
        renderCanvas();
        e.preventDefault();
        return;
    }

    // 缩放中
    if (isScaling.value && scalingImageId.value !== null) {
        const imgId = scalingImageId.value;
        const img = localImages.value.find(i => i.id === imgId);
        if (img) {
            const deltaY = y - scaleStartMouseY;
            const sensitivity = 0.005;
            let newScale = scaleStartScale + deltaY * sensitivity;
            // 限制范围 0.1 ~ 1.0
            newScale = Math.max(0.1, Math.min(1.0, newScale));
            imageScales.value.set(imgId, newScale);
            renderCanvas();
        }
        e.preventDefault();
        return;
    }

    // 拖拽移动
    if (isDragging && dragImageId !== null) {
        const deltaX = x - dragStartX;
        const deltaY = y - dragStartY;
        const img = localImages.value.find(i => i.id === dragImageId);
        if (img) {
            const info = getImageDrawInfo(img);
            const width = info.width;
            const height = info.height;
            let newX = dragStartPosX + deltaX;
            let newY = dragStartPosY + deltaY;
            const maxX = Math.max(props.canvasWidth - width, 0);
            const maxY = Math.max(props.canvasHeight - height, 0);
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            imagePositions.value[dragImageId] = { x: newX, y: newY };
            renderCanvas();
        }
        e.preventDefault();
        return;
    }

    // 检测当前鼠标位置是否在图片上
    const newHoverId = getImageIdAt(x, y);
    const onScaleHandle = isOnScaleHandle(x, y);
    const onRotateHandle = isOnRotationHandle(x, y);

    let shouldKeepHover = false;

    // 缩放手柄延迟清除
    if (onScaleHandle) {
        if (scaleHandleHoverTimeout) {
            clearTimeout(scaleHandleHoverTimeout);
            scaleHandleHoverTimeout = null;
        }
        if (hoveredImageId.value === null && scaleHandleRegion.value) {
            hoveredImageId.value = scaleHandleRegion.value.id;
            renderCanvas();
        }
        shouldKeepHover = true;
    }

    // 图片区域
    if (newHoverId !== null) {
        if (scaleHandleHoverTimeout) {
            clearTimeout(scaleHandleHoverTimeout);
            scaleHandleHoverTimeout = null;
        }
        if (hoveredImageId.value !== newHoverId) {
            hoveredImageId.value = newHoverId;
            renderCanvas();
        }
        shouldKeepHover = true;
    }

    // 延迟清除
    if (!shouldKeepHover && hoveredImageId.value !== null) {
        if (!scaleHandleHoverTimeout) {
            scaleHandleHoverTimeout = setTimeout(() => {
                hoveredImageId.value = null;
                renderCanvas();
                scaleHandleHoverTimeout = null;
            }, 400);
        }
    }

    // 显示/隐藏角度输入框
    if (onRotateHandle && rotationHandleRegion.value) {
        showAngleInput.value = true;
    } else {
        showAngleInput.value = false;
    }

    // 鼠标样式
    if (hoveredImageId.value !== null) {
        const onHandle = isOnRotationHandle(x, y) || isOnScaleHandle(x, y);
        canvasRef.value.style.cursor = onHandle ? 'grab' : 'move';
    } else {
        canvasRef.value.style.cursor = 'default';
    }
};

const onCanvasMouseUp = (e) => {
    if (isRotating.value) {
        isRotating.value = false;
        rotatingImageId.value = null;
        renderCanvas();
        return;
    }
    if (isScaling.value) {
        isScaling.value = false;
        scalingImageId.value = null;
        renderCanvas();
        return;
    }
    if (isDragging) {
        isDragging = false;
        dragImageId = null;
    }
};

// ---------- 生命周期和监听 ----------
watch(() => props.images, (newImages) => {
    localImages.value = newImages.map(img => ({ ...img }));
    newImages.forEach((img, index) => {
        if (!imagePositions.value[img.id]) {
            const cols = 3;
            const col = index % cols;
            const row = Math.floor(index / cols);
            imagePositions.value[img.id] = { x: col * 220 + 20, y: row * 220 + 20 };
        }
        if (!imageRotations.value.has(img.id)) {
            imageRotations.value.set(img.id, 0);
        }
        if (!imageScales.value.has(img.id)) {
            const maxEdge = Math.max(img.width, img.height);
            const initialScale = Math.min(props.maxSize / maxEdge, 1);
            imageScales.value.set(img.id, initialScale);
        }
    });
    const currentIds = new Set(newImages.map(i => i.id));
    Object.keys(imagePositions.value).forEach(id => {
        if (!currentIds.has(parseInt(id))) delete imagePositions.value[id];
    });
    for (let key of imageRotations.value.keys()) {
        if (!currentIds.has(key)) imageRotations.value.delete(key);
    }
    for (let key of imageScales.value.keys()) {
        if (!currentIds.has(key)) imageScales.value.delete(key);
    }
    renderCanvas();
}, { immediate: true, deep: true });

watch(localImages, (newVal) => {
    if (JSON.stringify(newVal.map(i => i.id)) !== JSON.stringify(props.images.map(i => i.id))) {
        emit('update:images', newVal);
    }
}, { deep: true });

watch([() => props.canvasWidth, () => props.canvasHeight, () => props.bgColor, () => props.useTransparent, () => props.showOuterBorder, () => props.outerBorderSize], () => {
    renderCanvas();
}, { deep: true });

// 导出方法
const getResolution = () => {
    const borderSize = props.showOuterBorder ? props.outerBorderSize : 0;
    return {
        width: props.canvasWidth + borderSize * 2,
        height: props.canvasHeight + borderSize * 2
    };
};

const exportImage = async (useTransparent) => {
    const borderSize = props.showOuterBorder ? props.outerBorderSize : 0;
    const totalWidth = props.canvasWidth + borderSize * 2;
    const totalHeight = props.canvasHeight + borderSize * 2;
    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');

    if (useTransparent) ctx.clearRect(0, 0, canvas.width, canvas.height);
    else { ctx.fillStyle = props.bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height); }

    ctx.save();
    ctx.translate(borderSize, borderSize);

    for (const img of localImages.value) {
        const info = getImageDrawInfo(img);
        const cx = info.x + info.width / 2;
        const cy = info.y + info.height / 2;
        const rad = info.rotation * Math.PI / 180;
        let imageEl = imageCache.get(img.id);
        if (!imageEl) {
            imageEl = await loadImage(img.dataURL);
            imageCache.set(img.id, imageEl);
        }
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rad);
        ctx.drawImage(imageEl, -info.width/2, -info.height/2, info.width, info.height);
        ctx.restore();
    }

    ctx.restore();
    return canvas.toDataURL('image/png');
};

defineExpose({ exportImage, getResolution });

onUnmounted(() => {
    if (scaleHandleHoverTimeout) {
        clearTimeout(scaleHandleHoverTimeout);
        scaleHandleHoverTimeout = null;
    }
});
</script>

<style scoped>
.free-canvas-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
.free-canvas {
    display: block;
    cursor: default;
    background: transparent;
}
.empty-message {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #9ca3af;
    text-align: center;
    font-size: 0.9rem;
    pointer-events: none;
}

.rotation-angle-input {
    position: absolute;
    width: 60px;
    padding: 2px 4px;
    font-size: 12px;
    border: 1px solid #3b82f6;
    border-radius: 4px;
    background: white;
    transform: translate(-50%, -100%);
    z-index: 10;
    pointer-events: auto;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.rotation-angle-input:focus {
    outline: none;
    border-color: #2563eb;
}
</style>