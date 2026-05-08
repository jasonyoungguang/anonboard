<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { adminLogin } from '@/api/family'

const router = useRouter()
const authStore = useAuthStore()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const res = await adminLogin(username.value, password.value)
    const data = res.data.data
    authStore.setAuth(data.token, data.username)
    router.push('/admin/dashboard')
  } catch (e: any) {
    error.value = e.response?.data?.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h2 style="text-align:center;margin-bottom:24px">管理员登录</h2>

      <div class="form-group">
        <label>用户名</label>
        <input v-model="username" class="form-input" placeholder="admin" @keyup.enter="handleLogin">
      </div>

      <div class="form-group">
        <label>密码</label>
        <input v-model="password" type="password" class="form-input" placeholder="••••••" @keyup.enter="handleLogin">
      </div>

      <p v-if="error" style="color:var(--danger);font-size:14px;margin-bottom:12px;text-align:center">{{ error }}</p>

      <div class="modal-actions">
        <router-link to="/" class="btn btn-secondary">返回</router-link>
        <button class="btn btn-primary" :disabled="loading" @click="handleLogin">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </div>
    </div>
  </div>
</template>
