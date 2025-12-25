<template>
  <div id="app">
    <LoginPage v-if="currentPage === 'login'" />
    <LabLobby v-else-if="currentPage === 'lobby'" />
    <LabWorkspace 
        v-else-if="currentPage === 'workspace'"
        @back-to-lobby="backToLobby"
      />
    <SimpleLabLobby v-else-if="currentPage === 'simple-lobby'" />
    <SimpleLabWorkspace v-else-if="currentPage === 'simple-workspace'" />
    <div v-else class="loading">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from './stores/auth'
import LoginPage from './components/LoginPage.vue'
import LabLobby from './components/LabLobby.vue'
import LabWorkspace from './components/LabWorkspace.vue'
import SimpleLabLobby from './components/SimpleLabLobby.vue'
import SimpleLabWorkspace from './components/SimpleLabWorkspace.vue'

export default {
  name: 'App',
  components: {
    LoginPage,
    LabLobby,
    LabWorkspace,
    SimpleLabLobby,
    SimpleLabWorkspace
  },
  setup() {
    const authStore = useAuthStore()
    const currentHash = ref(window.location.hash)
    const isLoading = ref(true)
    
    const backToLobby = () => {
      window.location.hash = '#/lobby'
    }
    
    const currentPage = computed(() => {
      if (isLoading.value) return 'loading'
      
      const hash = currentHash.value || '#/login'
      
      // 检查登录状态
      if (!authStore.isAuthenticated && hash !== '#/login') {
        return 'login'
      }
      
      // 路由匹配
      if (hash === '#/login') return 'login'
      if (hash === '#/lobby') return 'lobby'
      if (hash.startsWith('#/project/')) return 'workspace'
      if (hash === '#/simple') return 'simple-lobby'
      if (hash.startsWith('#/simple/')) return 'simple-workspace'
      
      // 默认路由
      return authStore.isAuthenticated ? 'lobby' : 'login'
    })
    
    const initializeApp = async () => {
      try {
        await authStore.initializeAuth()
        
        // 检查当前路由
        const hash = window.location.hash
        
        if (!hash || hash === '#/') {
          // 如果没有路由，根据认证状态重定向
          if (authStore.isAuthenticated) {
            window.location.hash = '#/lobby'
          } else {
            window.location.hash = '#/login'
          }
        } else if (hash.startsWith('#/project/') && !authStore.isAuthenticated) {
          // 如果访问项目页面但未认证，重定向到登录页
          window.location.hash = '#/login'
        }
        
      } catch (error) {
        console.error('应用初始化失败:', error)
        window.location.hash = '#/login'
      } finally {
        isLoading.value = false
      }
    }
    
    // 监听路由变化
    const handleHashChange = () => {
      currentHash.value = window.location.hash
    }
    
    onMounted(() => {
      window.addEventListener('hashchange', handleHashChange)
      initializeApp()
    })
    
    return {
      currentPage
    }
  }
}
</script>

<style>
#app {
  width: 100vw;
  height: 100vh;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #f5f7fa;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e0e0e0;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading p {
  color: #666;
  font-size: 16px;
  margin: 0;
}
</style>