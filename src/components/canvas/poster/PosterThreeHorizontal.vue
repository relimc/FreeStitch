<template>
    <div class="poster-three-horizontal" :style="{ gap: spacing + 'px' }">
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
.poster-three-horizontal {
    display: flex;
    justify-content: center;
    padding: 16px;
    flex-wrap: wrap;
}
.poster-three-horizontal .poster-cell {
    width: 140px;
    height: 140px;
    background-color: #f1f5f9;
    border: 2px dashed #cbd5e1;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
    position: relative;
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
.poster-cell img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.cell-selected {
    border: 3px solid #3b82f6;
    background: #eff6ff;
}
</style>