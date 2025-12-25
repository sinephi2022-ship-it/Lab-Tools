import { defineStore } from 'pinia'
import { signIn, signUp, signInWithEmail, signOutUser, onAuthChange, initUserDocument } from '../utils/firebase'

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
      bio: '',
      joinDate: null
    },
    settings: {
      notifications: true,
      autoSave: true,
      showGrid: true,
      darkMode: false
    }
  }),
  
  getters: {
    isLoggedIn: (state) => state.isAuthenticated && state.user !== null,
    userDisplayName: (state) => state.profile.displayName || `用户${state.user?.uid?.slice(-4) || ''}`,
    userInitial: (state) => state.profile.displayName?.charAt(0)?.toUpperCase() || 'U'
  },
  
  actions: {
    async initializeAuth() {
      this.isLoading = true
      
      return new Promise((resolve) => {
        let resolved = false
        
        onAuthChange((user) => {
          if (user) {
            this.user = user
            this.isAuthenticated = true
            this.loadUserProfile()
            this.isLoading = false
            if (!resolved) {
              resolved = true
              resolve()
            }
          } else {
            this.signInAnonymously().then(() => {
              this.isLoading = false
              if (!resolved) {
                resolved = true
                resolve()
              }
            }).catch((error) => {
              console.error('匿名登录失败:', error)
              this.isLoading = false
              if (!resolved) {
                resolved = true
                resolve()
              }
            })
          }
        })
      })
    },
    
    async signInAnonymously() {
      try {
        const user = await signIn()
        this.user = user
        this.isAuthenticated = true
        this.profile.displayName = `用户${user.uid.slice(-4)}`
        this.profile.joinDate = new Date().toISOString()
        this.saveUserProfile()
        
        // 初始化用户文档
        await initUserDocument(user.uid, {
          displayName: this.profile.displayName,
          joinDate: this.profile.joinDate
        })
        
        return user
      } catch (error) {
        console.error('登录失败:', error)
        this.isLoading = false
        throw error
      }
    },
    
    async signUpWithEmail(email, password, displayName) {
      try {
        const user = await signUp(email, password, displayName)
        this.user = user
        this.isAuthenticated = true
        this.profile.displayName = displayName
        this.profile.email = email
        this.profile.joinDate = new Date().toISOString()
        this.saveUserProfile()
        
        return user
      } catch (error) {
        console.error('注册失败:', error)
        
        // 提供更友好的错误消息
        let friendlyMessage = error.message
        if (error.code === 'auth/email-already-in-use') {
          friendlyMessage = '该邮箱已被注册，请直接登录或使用其他邮箱'
        } else if (error.code === 'auth/weak-password') {
          friendlyMessage = '密码强度不够，请设置至少6位密码'
        } else if (error.code === 'auth/invalid-email') {
          friendlyMessage = '邮箱格式不正确，请检查后重试'
        } else if (error.code === 'auth/operation-not-allowed') {
          friendlyMessage = '邮箱注册功能暂时不可用'
        }
        
        throw new Error(friendlyMessage)
      }
    },
    
    async signInWithEmail(email, password) {
      try {
        const user = await signInWithEmail(email, password)
        this.user = user
        this.isAuthenticated = true
        this.loadUserProfile()
        
        return user
      } catch (error) {
        console.error('登录失败:', error)
        
        // 提供更友好的错误消息
        let friendlyMessage = error.message
        if (error.code === 'auth/invalid-credential') {
          friendlyMessage = '邮箱或密码错误，请检查后重试'
        } else if (error.code === 'auth/user-not-found') {
          friendlyMessage = '用户不存在，请先注册'
        } else if (error.code === 'auth/wrong-password') {
          friendlyMessage = '密码错误，请重新输入'
        } else if (error.code === 'auth/too-many-requests') {
          friendlyMessage = '登录尝试次数过多，请稍后再试'
        } else if (error.code === 'auth/user-disabled') {
          friendlyMessage = '账户已被禁用，请联系管理员'
        }
        
        throw new Error(friendlyMessage)
      }
    },
    
    async signOut() {
      try {
        await signOutUser()
        
        // 清理本地存储
        if (this.user) {
          localStorage.removeItem(`profile_${this.user.uid}`)
          localStorage.removeItem(`settings_${this.user.uid}`)
        }
        
        // 重置状态
        this.user = null
        this.isAuthenticated = false
        this.profile = {
          displayName: '用户',
          avatar: null,
          email: '',
          bio: '',
          joinDate: null
        }
        this.settings = {
          notifications: true,
          autoSave: true,
          showGrid: true,
          darkMode: false
        }
        
        // 跳转到登录页
        window.location.hash = '#/login'
      } catch (error) {
        console.error('登出失败:', error)
        throw error
      }
    },
    
    // Add logout method as alias for signOut to maintain compatibility
    async logout() {
      return this.signOut()
    },
    
    loadUserProfile() {
      try {
        const savedProfile = localStorage.getItem(`profile_${this.user.uid}`)
        if (savedProfile) {
          this.profile = { ...this.profile, ...JSON.parse(savedProfile) }
        }
        
        const savedSettings = localStorage.getItem(`settings_${this.user.uid}`)
        if (savedSettings) {
          this.settings = { ...this.settings, ...JSON.parse(savedSettings) }
        }
        
        const savedLanguage = localStorage.getItem('language')
        if (savedLanguage) {
          this.language = savedLanguage
        }
        
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme) {
          this.theme = savedTheme
          document.documentElement.setAttribute('data-theme', savedTheme)
        }
      } catch (error) {
        console.error('加载用户资料失败:', error)
      }
    },
    
    saveUserProfile() {
      try {
        localStorage.setItem(`profile_${this.user.uid}`, JSON.stringify(this.profile))
        localStorage.setItem(`settings_${this.user.uid}`, JSON.stringify(this.settings))
        localStorage.setItem('language', this.language)
        localStorage.setItem('theme', this.theme)
      } catch (error) {
        console.error('保存用户资料失败:', error)
      }
    },
    
    updateProfile(updates) {
      this.profile = { ...this.profile, ...updates }
      this.saveUserProfile()
    },
    
    updateSettings(updates) {
      this.settings = { ...this.settings, ...updates }
      this.saveUserProfile()
      
      // 应用主题设置
      if (updates.darkMode !== undefined) {
        const theme = updates.darkMode ? 'dark' : 'light'
        this.setTheme(theme)
      }
    },
    
    setLanguage(language) {
      this.language = language
      localStorage.setItem('language', language)
      
      // 更新页面语言
      document.documentElement.lang = language
    },
    
    setTheme(theme) {
      this.theme = theme
      this.settings.darkMode = theme === 'dark'
      localStorage.setItem('theme', theme)
      document.documentElement.setAttribute('data-theme', theme)
    },
    
    async uploadAvatar(file) {
      return new Promise((resolve, reject) => {
        if (!file) {
          reject(new Error('请选择文件'))
          return
        }
        
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
          reject(new Error('请选择图片文件'))
          return
        }
        
        // 检查文件大小（5MB限制）
        if (file.size > 5 * 1024 * 1024) {
          reject(new Error('图片文件不能超过5MB'))
          return
        }
        
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            this.updateProfile({ avatar: e.target.result })
            resolve(e.target.result)
          } catch (error) {
            reject(error)
          }
        }
        reader.onerror = () => reject(new Error('文件读取失败'))
        reader.readAsDataURL(file)
      })
    },
    
    removeAvatar() {
      this.updateProfile({ avatar: null })
    },
    
    
    
    // 获取用户统计信息
    getUserStats() {
      return {
        joinDate: this.profile.joinDate,
        displayName: this.profile.displayName,
        language: this.language,
        theme: this.theme
      }
    }
  }
})