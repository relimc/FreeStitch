<template>
    <div class="poster-grid-3x3" :style="{ gap: spacing + 'px' }">
        <div v-for="(cell, idx) in cells" :key="idx" class="poster-cell" 
            :class="{ 'cell-selected': selectedIndex === idx }"
            @click="selectCell(idx)">
            <img v-if="cell && cell.imageData" :src="cell.imageData">
            <div v-else class="poster-cell-placeholder">+</div>
            <div v-if="cell && cell.imageData" class="poster-cell-remove" @click.stop="removeCell(idx)">✖</div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    cells: { type: Array, required: true },
    selectedIndex: { type: Number, default: -1 },
    spacing: { type: Number, default: 12 }
});
const emit = defineEmits(['select', 'remove']);

const selectCell = (idx) => emit('select', idx);
const removeCell = (idx) => emit('remove', idx);
</script>

<style scoped>
.poster-grid-3x3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 120px));
    grid-template-rows: repeat(3, minmax(0, 120px));
    justify-content: center;
    align-items: center;
    margin: 16px auto;
    width: fit-content;
    max-width: 100%;
}
.poster-cell {
    position: relative;
    background-color: #f1f5f9;
    border: 2px dashed #cbd5e1;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
    width: 100%;
    height: 100%;
}
/* 其余样式同 PosterGrid2x2 */
.poster-cell.cell-selected {
    border: 3px solid #3b82f6;
    background: #eff6ff;
}
.poster-cell img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.poster-cell-placeholder {
    font-size: 32px;
    color: #94a3b8;
}
.poster-cell-remove {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 24px;
    height: 24px;
    background: rgba(220, 38, 38, 0.85);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    cursor: pointer;
    z-index: 10;
}
</style>