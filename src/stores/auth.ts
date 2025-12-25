import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '@/types'
import { onAuthChange, signOutUser, signInWithEmail, signUpWithEmail } from '@/utils/firebase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(true)

  const initAuth = () => {
    onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        user.value = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || firebaseUser.email!
        }
      } else {
        user.value = null
      }
      isLoading.value = false
    })
  }

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password)
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, displayName: string) => {
    try {
      await signUpWithEmail(email, password, displayName)
    } catch (error) {
      console.error('注册失败:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOutUser()
    } catch (error) {
      console.error('登出失败:', error)
      throw error
    }
  }

  return {
    user,
    isLoading,
    initAuth,
    login,
    register,
    logout
  }
})