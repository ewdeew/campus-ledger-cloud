<script setup>
import { onMounted, watch, computed } from 'vue';
import { useLedgerStore } from '../stores/ledger';
import { useAuthStore } from '../stores/auth';
import StatCard from '../components/StatCard.vue';
import RecordForm from '../components/RecordForm.vue';
import RecordTable from '../components/RecordTable.vue';
import BudgetPanel from '../components/BudgetPanel.vue';
import CategoryChart from '../components/CategoryChart.vue';
import CalendarHeatmap from '../components/CalendarHeatmap.vue';

const ledger = useLedgerStore();
const auth = useAuthStore();

const stats = computed(
  () => ledger.stats || { income: 0, expense: 0, balance: 0, categories: {} }
);

function formatMoney(n) {
  return Number(n || 0).toLocaleString('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  });
}

onMounted(() => {
  ledger.loadAll();
  // 首次进入申请通知权限（用于预算超支提醒）
  if (window.Notification && Notification.permission === 'default') {
    Notification.requestPermission();
  }
});

watch(() => ledger.month, () => ledger.loadAll());
</script>

<template>
  <div class="dash">
    <header class="top">
      <h1>🎓 大学生记账本（云同步）</h1>
      <div>
        <span v-if="auth.user">你好，{{ auth.user.name || auth.user.email }}</span>
        <button @click="auth.logout()">退出登录</button>
      </div>
    </header>

    <section class="toolbar">
      <label>
        选择月份：
        <input v-model="ledger.month" type="month" />
      </label>
      <button :disabled="ledger.loading" @click="ledger.loadAll()">
        {{ ledger.loading ? '同步中...' : '重新同步' }}
      </button>
      <button @click="ledger.exportExcel()">⬇️ 导出 Excel</button>
    </section>

    <section class="stats">
      <StatCard label="收入" :value="formatMoney(stats.income)" type="income" />
      <StatCard label="支出" :value="formatMoney(stats.expense)" type="expense" />
      <StatCard label="结余" :value="formatMoney(stats.balance)" type="balance" />
    </section>

    <!-- 预算面板：含超支提醒 + 自动继承提示 -->
    <BudgetPanel />

    <h2>连续记账</h2>
    <p>当前连续记账 <strong>{{ ledger.streak }}</strong> 天 🔥</p>
    <CalendarHeatmap :month="ledger.month" :records="ledger.records" />

    <h2>添加 / 编辑记录</h2>
    <RecordForm />

    <h2>支出分类</h2>
    <CategoryChart :categories="stats.categories" />

    <h2>本月明细</h2>
    <RecordTable />
  </div>
</template>

<style scoped>
.dash { max-width: 900px; margin: 0 auto; padding: 16px; }
.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
}
.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
</style>
