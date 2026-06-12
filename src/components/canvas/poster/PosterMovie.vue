<template>
    <div class="poster-movie">
        <div class="poster-movie-img"
            :class="{ 'cell-selected': selectedIndex === 0 }"
            @click="selectCell(0)">
            <img v-if="cells[0] && cells[0].imageData" :src="cells[0].imageData">
            <div v-else class="poster-cell-placeholder">+</div>
            <div v-if="cells[0] && cells[0].imageData" class="poster-cell-remove" @click.stop="removeCell(0)">✖</div>
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
.poster-movie {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 16px;
    height: 100%;
}
.poster-movie-img {
    width: 100%;
    height: 100%;
    max-height: 500px;
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
.poster-movie-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.cell-selected {
    border: 3px solid #3b82f6;
    background: #eff6ff;
}
</style>