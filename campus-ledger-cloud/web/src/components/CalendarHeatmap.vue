<script setup>
import { computed } from 'vue';

const props = defineProps({
  month: { type: String, required: true }, // "YYYY-MM"
  records: { type: Array, default: () => [] },
});

// 计算当前月的日历格子
const cells = computed(() => {
  const [year, mon] = props.month.split('-').map(Number);
  const startWeekday = new Date(Date.UTC(year, mon - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, mon, 0)).getUTCDate();

  const map = {};
  for (const r of props.records) {
    const d = r.date.slice(0, 10);
    map[d] = (map[d] || 0) + 1;
  }

  const list = [];
  for (let i = 0; i < startWeekday; i++) list.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${props.month}-${String(d).padStart(2, '0')}`;
    list.push({ day: d, dateStr, count: map[dateStr] || 0 });
  }
  while (list.length % 7 !== 0) list.push(null);
  return list;
});

const levelClass = (count) => {
  if (!count) return 'level-0';
  if (count <= 2) return 'level-1';
  if (count <= 4) return 'level-2';
  return 'level-3';
};
</script>

<template>
  <div class="calendar">
    <div class="weekdays">
      <span v-for="w in ['日','一','二','三','四','五','六']" :key="w">{{ w }}</span>
    </div>
    <div class="grid">
      <div
        v-for="(c, i) in cells"
        :key="i"
        class="cell"
        :class="c ? levelClass(c.count) : 'empty'"
        :title="c ? `${c.dateStr}：${c.count} 笔` : ''"
      >
        <span v-if="c">{{ c.day }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar { margin: 8px 0; }
.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 12px;
  color: #868e96;
  margin-bottom: 4px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.cell {
  aspect-ratio: 1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #495057;
}
.empty { background: transparent; }
.level-0 { background: #ebedf0; }
.level-1 { background: #c6e48b; }
.level-2 { background: #7bc96f; }
.level-3 { background: #239a3b; color: #fff; }
</style>
