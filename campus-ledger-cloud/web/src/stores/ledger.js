import { defineStore } from 'pinia';
import api from '../api/client';

export const useLedgerStore = defineStore('ledger', {
  state: () => ({
    month: new Date().toISOString().slice(0, 7), // "YYYY-MM"
    records: [],
    stats: null,
    budget: null, // 对象：{ amount, used, remaining, percent, status, inherited, sourceMonth }
    streak: 0,
    editingRecord: null, // 正在被编辑的记录
    loading: false,
  }),
  actions: {
    async loadAll() {
      this.loading = true;
      try {
        const [recordsRes, statsRes, budgetRes, streakRes] = await Promise.all([
          api.get('/records', { params: { month: this.month } }),
          api.get('/records/stats', { params: { month: this.month } }),
          api.get('/budget', { params: { month: this.month } }),
          api.get('/records/streak'),
        ]);
        this.records = recordsRes.data;
        this.stats = statsRes.data;
        this.budget = budgetRes.data;
        this.streak = streakRes.data.streak;
      } finally {
        this.loading = false;
      }
    },

    async addRecord(payload) {
      await api.post('/records', payload);
      await this.loadAll();
    },

    // 编辑后保存
    async updateRecord(id, payload) {
      await api.put(`/records/${id}`, payload);
      this.editingRecord = null;
      await this.loadAll();
    },

    async deleteRecord(id) {
      await api.delete(`/records/${id}`);
      if (this.editingRecord && this.editingRecord.id === id) {
        this.editingRecord = null;
      }
      await this.loadAll();
    },

    async saveBudget(amount) {
      await api.put('/budget', { month: this.month, amount });
      await this.loadAll();
    },

    // 导出 Excel（后端生成，前端下载 blob）
    async exportExcel() {
      try {
        const res = await api.get('/records/export', {
          params: { month: this.month },
          responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = `记账记录_${this.month}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (e) {
        alert('导出失败，请检查网络或登录状态');
      }
    },

    // 进入/取消编辑
    setEditing(record) {
      this.editingRecord = record ? { ...record } : null;
    },
  },
});
