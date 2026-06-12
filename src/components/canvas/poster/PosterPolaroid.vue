<template>
    <div class="poster-polaroid">
        <div class="polaroid-paper"
            :class="{ 'cell-selected': selectedIndex === 0 }"
            @click="selectCell(0)">
            <div class="polaroid-img-wrapper">
                <img v-if="cells[0] && cells[0].imageData" :src="cells[0].imageData">
                <div v-else class="poster-cell-placeholder">+</div>
            </div>
            <div class="polaroid-bottom"></div>
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
.poster-polaroid {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
}
.polaroid-paper {
    background-color: #f1f5f9;
    border: 2px dashed #cbd5e1;
    border-radius: 12px;
    padding: 12px;
    cursor: pointer;
    position: relative;
    width: 240px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.polaroid-img-wrapper {
    width: 100%;
    aspect-ratio: 1 / 1;
    background: #ffffff;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}
.polaroid-img-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.polaroid-bottom {
    height: 30px;
    background: #ffffff;
    margin-top: 8px;
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
.cell-selected {
    border: 3px solid #3b82f6;
}
</style>