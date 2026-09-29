<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const form = ref({ email: '', password: '' });
const error = ref('');

const submit = async () => {
  error.value = '';
  try {
    await auth.login(form.value);
    router.push('/');
  } catch (e) {
    error.value = e.response?.data?.error || '登录失败';
  }
};
</script>

<template>
  <div class="auth">
    <h2>登录</h2>
    <form @submit.prevent="submit">
      <input v-model="form.email" type="email" placeholder="邮箱" required />
      <input v-model="form.password" type="password" placeholder="密码" required />
      <button type="submit">登录</button>
      <p v-if="error" class="err">{{ error }}</p>
      <p>还没有账号？<router-link to="/register">注册</router-link></p>
    </form>
  </div>
</template>
