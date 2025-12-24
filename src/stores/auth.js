import { defineStore } from 'pinia'
import { signIn, onAuthChange } from '../utils/firebase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    language: 'zh-CN',
    theme: 'light',
    profile: {
      displayName: '用户',
      avatar: null,
      email: '',
      bio: ''
    }
  }),
  
  actions: {
    async initializeAuth() {
      this.isLoading = true
      
      onAuthChange((user) => {
        if (user) {
          this.user = user
          this.isAuthenticated = true
          this.loadUserProfile()
        } else {
          await this.signInAnonymously()
        }
        this.isLoading = false
      })
    },
    
    async signInAnonymously() {
      try {
        const user = await signIn()
        this.user = user
        this.isAuthenticated = true
        this.profile.displayName = `用户${user.uid.slice(-4)}`
      } catch (error) {
        console.error('登录失败:', error)
        this.isLoading = false
      }
    },
    
    loadUserProfile() {
      const savedProfile = localStorage.getItem(`profile_${this.user.uid}`)
      if (savedProfile) {
        this.profile = JSON.parse(savedProfile)
      }
      
      const savedLanguage = localStorage.getItem('language')
      if (savedLanguage) {
        this.language = savedLanguage
      }
      
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        this.theme = savedTheme
      }
    },
    
    updateProfile(updates) {
      this.profile = { ...this.profile, ...updates }
      localStorage.setItem(`profile_${this.user.uid}`, JSON.stringify(this.profile))
    },
    
    setLanguage(language) {
      this.language = language
      localStorage.setItem('language', language)
    },
    
    setTheme(theme) {
      this.theme = theme
      localStorage.setItem('theme', theme)
      document.documentElement.setAttribute('data-theme', theme)
    },
    
    uploadAvatar(file) {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.updateProfile({ avatar: e.target.result })
          resolve(e.target.result)
        }
        reader.readAsDataURL(file)
      })
    },
    
    logout() {
      this.user = null
      this.isAuthenticated = false
      this.profile = {
        displayName: '用户',
        avatar: null,
        email: '',
        bio: ''
      }
    }
  }
})