<script setup>
import { reactive, ref, watch, computed } from 'vue';
import { useLedgerStore } from '../stores/ledger';

const ledger = useLedgerStore();
const categories = {
  expense: ['餐饮', '学习', '交通', '娱乐', '购物', '医疗', '社交', '其他'],
  income: ['生活费', '兼职', '奖学金', '实习', '红包', '其他'],
};

const form = reactive({
  date: new Date().toISOString().slice(0, 10),
  type: 'expense',
  category: categories.expense[0],
  amount: '',
  note: '',
});

const isEditing = computed(() => !!ledger.editingRecord);

// 监听“正在编辑的记录”，有则回填表单，无则重置
watch(
  () => ledger.editingRecord,
  (rec) => {
    if (rec) {
      form.date = rec.date.slice(0, 10);
      form.type = rec.type;
      form.category = rec.category;
      form.amount = String(rec.amount);
      form.note = rec.note || '';
    } else {
      form.amount = '';
      form.note = '';
      form.date = new Date().toISOString().slice(0, 10);
      form.type = 'expense';
      form.category = categories.expense[0];
    }
  },
  { immediate: true }
);

// 切换收支类型时，若当前分类不属于新类型则重置
watch(
  () => form.type,
  (t) => {
    if (!categories[t].includes(form.category)) {
      form.category = categories[t][0];
    }
  }
);

const error = ref('');

const cancelEdit = () => {
  ledger.setEditing(null);
};

const submit = async () => {
  error.value = '';
  const amount = parseFloat(form.amount);
  if (!amount || amount <= 0) {
    error.value = '请输入正确的金额';
    return;
  }
  try {
    if (isEditing.value) {
      await ledger.updateRecord(ledger.editingRecord.id, { ...form, amount });
    } else {
      await ledger.addRecord({ ...form, amount });
    }
    if (!isEditing.value) {
      form.amount = '';
      form.note = '';
    }
  } catch {
    error.value = '保存失败，请检查网络或登录状态';
  }
};
</script>

<template>
  <form class="form" @submit.prevent="submit">
    <input v-model="form.date" type="date" required />
    <select v-model="form.type">
      <option value="expense">支出</option>
      <option value="income">收入</option>
    </select>
    <select v-model="form.category">
      <option v-for="c in categories[form.type]" :key="c" :value="c">{{ c }}</option>
    </select>
    <input v-model="form.amount" type="number" step="0.01" placeholder="金额" required />
    <input v-model="form.note" placeholder="备注" />
    <button type="submit">
      {{ isEditing ? '更新记录' : '添加记录' }}
    </button>
    <button v-if="isEditing" type="button" @click="cancelEdit">取消编辑</button>
    <span v-if="error" class="err">{{ error }}</span>
  </form>
</template>

<style scoped>
.form { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:16px; }
.err { color:#e03131; font-size:13px; }
</style>
