<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
  categories: { type: Object, default: () => ({}) },
});

const canvas = ref(null);
let chart = null;

const render = () => {
  if (chart) chart.destroy();
  const labels = Object.keys(props.categories);
  const data = labels.map((k) => props.categories[k]);
  if (!labels.length) return;

  chart = new Chart(canvas.value, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, borderWidth: 1 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
    },
  });
};

onMounted(render);
watch(() => props.categories, render, { deep: true });
onBeforeUnmount(() => chart && chart.destroy());
</script>

<template>
  <div class="chart-wrapper">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<style scoped>
.chart-wrapper { position: relative; height: 260px; }
</style>
