<script setup>
import { computed, ref } from 'vue';
import { useLedgerStore } from '../stores/ledger';

const ledger = useLedgerStore();
const keyword = ref('');

const sorted = computed(() =>
  [...ledger.records].sort((a, b) => (a.date < b.date ? 1 : -1))
);

// 支持按备注 / 分类 / 金额搜索
const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase();
  if (!k) return sorted.value;
  return sorted.value.filter(
    (r) =>
      (r.note || '').toLowerCase().includes(k) ||
      r.category.toLowerCase().includes(k) ||
      String(r.amount).includes(k)
  );
});

const remove = async (id) => {
  if (confirm('确定删除这条记录？')) {
    await ledger.deleteRecord(id);
  }
};

const edit = (r) => {
  ledger.setEditing(r);
};
</script>

<template>
  <div>
    <div class="search-bar">
      <input v-model="keyword" placeholder="搜索备注 / 分类 / 金额" />
      <button v-if="keyword" @click="keyword = ''">清除</button>
    </div>

    <div style="overflow-x:auto;">
      <table v-if="filtered.length">
        <thead>
          <tr>
            <th>日期</th>
            <th>类型</th>
            <th>分类</th>
            <th>金额</th>
            <th>备注</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filtered" :key="r.id">
            <td>{{ r.date.slice(0, 10) }}</td>
            <td>{{ r.type === 'income' ? '收入' : '支出' }}</td>
            <td>{{ r.category }}</td>
            <td :class="r.type === 'income' ? 'inc' : 'exp'">
              {{ r.type === 'income' ? '+' : '-' }}{{ Number(r.amount).toFixed(2) }}
            </td>
            <td>{{ r.note }}</td>
            <td>
              <button @click="edit(r)">编辑</button>
              <button @click="remove(r.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else>没有匹配的记录。</p>
    </div>
  </div>
</template>

<style scoped>
.search-bar { margin-bottom: 8px; display: flex; gap: 8px; }
.search-bar input { flex: 1; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th, td { padding: 8px; border-bottom: 1px solid #dee2e6; text-align: left; }
.inc { color: #2f9e44; font-weight: 600; }
.exp { color: #e03131; font-weight: 600; }
td button { margin-right: 4px; }
td button:first-child { color: #4c6ef5; background: #fff; border: 1px solid #4c6ef5; }
td button:last-child { color: #e03131; background: #fff; border: 1px solid #e03131; }
</style>
