<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const form = ref({ name: '', email: '', password: '', confirm: '' });
const error = ref('');

const submit = async () => {
  error.value = '';
  if (form.value.password !== form.value.confirm) {
    error.value = '两次密码不一致';
    return;
  }
  try {
    await auth.register({
      name: form.value.name,
      email: form.value.email,
      password: form.value.password,
    });
    router.push('/');
  } catch (e) {
    error.value = e.response?.data?.error || '注册失败';
  }
};
</script>

<template>
  <div class="auth">
    <h2>注册</h2>
    <form @submit.prevent="submit">
      <input v-model="form.name" placeholder="昵称" />
      <input v-model="form.email" type="email" placeholder="邮箱" required />
      <input v-model="form.password" type="password" placeholder="密码（至少 6 位）" required />
      <input v-model="form.confirm" type="password" placeholder="确认密码" required />
      <button type="submit">注册</button>
      <p v-if="error" class="err">{{ error }}</p>
      <p>已有账号？<router-link to="/login">登录</router-link></p>
    </form>
  </div>
</template>
