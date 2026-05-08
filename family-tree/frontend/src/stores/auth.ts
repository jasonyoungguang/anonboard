import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const username = ref(localStorage.getItem('admin_username') || '')

  function setAuth(newToken: string, newUsername: string) {
    token.value = newToken
    username.value = newUsername
    localStorage.setItem('admin_token', newToken)
    localStorage.setItem('admin_username', newUsername)
  }

  function clearAuth() {
    token.value = ''
    username.value = ''
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_username')
  }

  function isLoggedIn(): boolean {
    return !!token.value
  }

  return { token, username, setAuth, clearAuth, isLoggedIn }
})
