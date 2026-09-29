<script setup>
import { ref, computed, watch } from 'vue';
import { useLedgerStore } from '../stores/ledger';

const ledger = useLedgerStore();
const input = ref('');

const info = computed(() => ledger.budget || {});
const amount = computed(() => info.value.amount);
const used = computed(() => info.value.used ?? 0);
const remaining = computed(() => info.value.remaining);
const percent = computed(() => info.value.percent ?? 0);
const status = computed(() => info.value.status ?? 'none');

watch(
  () => amount.value,
  (v) => {
    input.value = v == null ? '' : String(v);
  },
  { immediate: true }
);

const statusText = computed(() => {
  switch (status.value) {
    case 'normal': return '正常';
    case 'warning': return '接近预算（已用 80% 以上）';
    case 'exceeded': return '已超支';
    default: return '未设置预算';
  }
});

const notify = (title, body) => {
  if (window.Notification && Notification.permission === 'granted') {
    new Notification(title, { body });
  } else if (window.Notification && Notification.permission === 'denied') {
    alert(`${title}\n${body}`);
  } else {
    Notification.requestPermission().then((p) => {
      if (p === 'granted') new Notification(title, { body });
    });
  }
};

// 从“未超支”变为“已超支”时提醒
watch(status, (newVal, oldVal) => {
  if (newVal === 'exceeded' && oldVal !== 'exceeded') {
    notify(
      '⚠️ 预算超支提醒',
      `本月支出 ${used.value.toFixed(2)} 元，已超出预算 ${Math.abs(remaining.value ?? 0).toFixed(2)} 元，请注意节制！`
    );
  }
});

const save = async () => {
  const val = input.value === '' ? 0 : parseFloat(input.value);
  if (isNaN(val) || val < 0) {
    alert('请输入有效的预算金额');
    return;
  }
  await ledger.saveBudget(val);
};
</script>

<template>
  <div class="budget">
    <label>
      本月预算（元）：
      <input v-model="input" type="number" step="0.01" min="0" placeholder="未设置" />
      <button @click="save">保存</button>
    </label>

    <p v-if="amount != null">
      预算状态：
      <strong :class="status">{{ statusText }}</strong>
      <span v-if="info.inherited" class="inherit">
        （自动继承 {{ info.sourceMonth }}）
      </span>
    </p>

    <template v-if="amount != null && amount > 0">
      <div class="progress">
        <div
          class="bar"
          :class="{ over: status === 'exceeded' }"
          :style="{ width: percent + '%' }"
        ></div>
      </div>
      <p>
        已用 {{ used.toFixed(2) }} / 预算 {{ amount.toFixed(2) }}，
        剩余
        <strong :class="{ over: status === 'exceeded' }">
          {{ (remaining ?? 0).toFixed(2) }}
        </strong>
      </p>
    </template>

    <p v-else-if="amount === null">
      你还没有设置过任何预算，设置后可以看到进度；以后新月份会自动继承最近一次预算。
    </p>
  </div>
</template>

<style scoped>
.budget { margin: 8px 0 16px; }
.progress { background:#e9ecef; border-radius:8px; height:12px; overflow:hidden; margin:8px 0; }
.bar { height:100%; background: linear-gradient(90deg,#4c6ef5,#7950f2); transition:width .3s; }
.bar.over { background:#e03131; }
.over { color:#e03131; }
.budget strong.normal { color:#2f9e44; }
.budget strong.warning { color:#f08c00; }
.budget strong.exceeded { color:#e03131; }
.inherit { color:#868e96; font-size:12px; margin-left:8px; }
</style>
