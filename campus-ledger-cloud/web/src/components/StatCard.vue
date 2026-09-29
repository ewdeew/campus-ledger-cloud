<script setup>
defineProps({ label: String, value: String, type: String });
</script>

<template>
  <div class="card" :class="type">
    <span>{{ label }}</span>
    <strong>{{ value }}</strong>
  </div>
</template>

<style scoped>
.card { padding:12px; border-radius:10px; background:#f1f3f5; text-align:center; }
.card span { display:block; font-size:12px; color:#868e96; }
.card strong { display:block; font-size:18px; margin-top:4px; }
.card.income strong { color:#2f9e44; }
.card.expense strong { color:#e03131; }
.card.balance strong { color:#4c6ef5; }
</style>
