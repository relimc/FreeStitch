import { ref } from 'vue';

export function useCanvasDrag(canvasWidth, canvasHeight, getImageStyle) {
    const imagePositions = ref({});
    const isDragging = ref(false);
    const draggingImg = ref(null);
    const dragStartMouseX = ref(0);
    const dragStartMouseY = ref(0);
    const dragStartCardLeft = ref(0);
    const dragStartCardTop = ref(0);

    const startDrag = (e, img) => {
        if (e.target.classList?.contains('delete-icon')) return;
        e.preventDefault();
        e.stopPropagation();
        const card = e.target.closest('.drag-img-card');
        if (!card) return;
        draggingImg.value = img;
        isDragging.value = true;
        dragStartMouseX.value = e.clientX;
        dragStartMouseY.value = e.clientY;
        const currentPos = imagePositions.value[img.id] || { x: 20, y: 20 };
        dragStartCardLeft.value = currentPos.x;
        dragStartCardTop.value = currentPos.y;
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', stopDrag);
        document.body.style.cursor = 'grabbing';
        card.style.cursor = 'grabbing';
    };

    const onDragMove = (e) => {
        if (!isDragging.value || !draggingImg.value) return;
        e.preventDefault();
        const deltaX = e.clientX - dragStartMouseX.value;
        const deltaY = e.clientY - dragStartMouseY.value;
        let newLeft = dragStartCardLeft.value + deltaX;
        let newTop = dragStartCardTop.value + deltaY;
        const imgStyle = getImageStyle(draggingImg.value);
        const cardWidth = parseFloat(imgStyle.width);
        const cardHeight = parseFloat(imgStyle.height);
        const maxX = Math.max(canvasWidth.value - cardWidth, 0);
        const maxY = Math.max(canvasHeight.value - cardHeight, 0);
        newLeft = Math.max(0, Math.min(newLeft, maxX));
        newTop = Math.max(0, Math.min(newTop, maxY));
        imagePositions.value[draggingImg.value.id] = { x: newLeft, y: newTop };
    };

    const stopDrag = () => {
        if (!isDragging.value) return;
        isDragging.value = false;
        draggingImg.value = null;
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', stopDrag);
        document.body.style.cursor = '';
    };

    const clampAllPositions = (images, canvasW, canvasH, getImageStyleFn) => {
        for (const img of images) {
            const pos = imagePositions.value[img.id];
            if (!pos) continue;
            const imgStyle = getImageStyleFn(img);
            const width = parseFloat(imgStyle.width) || 150;
            const height = parseFloat(imgStyle.height) || 150;
            const maxX = Math.max(canvasW - width, 0);
            const maxY = Math.max(canvasH - height, 0);
            let newX = pos.x, newY = pos.y;
            if (newX < 0) newX = 0;
            if (newX > maxX) newX = maxX;
            if (newY < 0) newY = 0;
            if (newY > maxY) newY = maxY;
            if (newX !== pos.x || newY !== pos.y) {
                imagePositions.value[img.id] = { x: newX, y: newY };
            }
        }
    };

    return {
        imagePositions,
        isDragging,
        draggingImg,
        startDrag,
        clampAllPositions,
        onDragMove,
        stopDrag
    };
}