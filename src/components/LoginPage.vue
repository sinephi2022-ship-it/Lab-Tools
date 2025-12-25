<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="logo-section">
          <h1 class="app-title">LabMate Pro</h1>
          <p class="app-subtitle">虚拟实验室协作平台</p>
        </div>
        
        <div class="login-form">
          <div class="login-tabs">
            <button 
              @click="loginMode = 'anonymous'" 
              :class="['tab-btn', { active: loginMode === 'anonymous' }]"
            >
              匿名登录
            </button>
            <button 
              @click="loginMode = 'email'" 
              :class="['tab-btn', { active: loginMode === 'email' }]"
            >
              邮箱登录
            </button>
          </div>
          
          <!-- 匿名登录表单 -->
          <div v-if="loginMode === 'anonymous'" class="login-form-content">
            <div class="form-group">
              <label for="username">用户名</label>
              <input 
                id="username"
                v-model="loginForm.username" 
                type="text" 
                placeholder="请输入用户名"
                @keyup.enter="handleLogin"
              >
            </div>
          </div>
          
          <!-- 邮箱登录表单 -->
          <div v-if="loginMode === 'email'" class="login-form-content">
            <div class="form-group">
              <label for="email">邮箱</label>
              <input 
                id="email"
                v-model="loginForm.email" 
                type="email" 
                placeholder="请输入邮箱"
                @keyup.enter="handleLogin"
              >
            </div>
            
            <div class="form-group">
              <label for="password">密码</label>
              <input 
                id="password"
                v-model="loginForm.password" 
                type="password" 
                placeholder="请输入密码"
                @keyup.enter="handleLogin"
              >
            </div>
            
            <div class="form-group">
              <label for="displayName">显示名称（注册时需要）</label>
              <input 
                id="displayName"
                v-model="loginForm.displayName" 
                type="text" 
                placeholder="请输入显示名称"
              >
            </div>
          </div>
          
          <div class="form-group">
            <label for="language">语言</label>
            <select id="language" v-model="loginForm.language">
              <option value="zh-CN">中文</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </div>
          
          <div class="login-actions">
            <button 
              v-if="loginMode === 'email'"
              @click="handleSignUp" 
              class="signup-btn"
              :disabled="!canSignUp"
            >
              <span v-if="!isLoading">注册</span>
              <span v-else>注册中...</span>
            </button>
            
            <button 
              @click="handleLogin" 
              class="login-btn"
              :disabled="!canLogin"
            >
              <span v-if="!isLoading">{{ loginMode === 'anonymous' ? '进入实验室' : '登录' }}</span>
              <span v-else>{{ loginMode === 'anonymous' ? '登录中...' : '登录中...' }}</span>
            </button>
          </div>
          
          <div class="login-tips">
            <p>💡 提示：系统将自动为您创建匿名账户</p>
            <p>🔒 您的数据将安全保存在云端</p>
          </div>
        </div>
        
        <div class="features-preview">
          <h3>核心功能</h3>
          <div class="features-grid">
            <div class="feature-item">
              <div class="feature-icon">📝</div>
              <span>便签记录</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">⏱️</div>
              <span>计时控制</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">✓</div>
              <span>实验协议</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">💬</div>
              <span>实时协作</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">☁️</div>
              <span>云端同步</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">📊</div>
              <span>报告导出</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'LoginPage',
  setup() {
    const authStore = useAuthStore()
    
    const loginMode = ref('anonymous')
    const isLoading = ref(false)
    
    const loginForm = ref({
      username: '',
      email: '',
      password: '',
      displayName: '',
      language: 'zh-CN'
    })
    
    const canLogin = computed(() => {
      if (loginMode.value === 'anonymous') {
        return loginForm.value.username.trim()
      } else {
        return loginForm.value.email.trim() && loginForm.value.password.trim()
      }
    })
    
    const canSignUp = computed(() => {
      return loginForm.value.email.trim() && 
             loginForm.value.password.trim() && 
             loginForm.value.displayName.trim()
    })
    
    const handleLogin = async () => {
      if (!canLogin.value) return
      
      isLoading.value = true
      
      try {
        // 设置用户偏好
        authStore.setLanguage(loginForm.value.language)
        
        if (loginMode.value === 'anonymous') {
          // 匿名登录
          await authStore.initializeAuth()
          // 等待初始化完成后再更新profile
          if (authStore.user) {
            authStore.updateProfile({
              displayName: loginForm.value.username.trim() || '匿名用户'
            })
          }
        } else {
          // 邮箱登录
          await authStore.signInWithEmail(
            loginForm.value.email.trim(),
            loginForm.value.password
          )
        }
        
        // 跳转到实验室大厅
        window.location.hash = '#/lobby'
        
      } catch (error) {
        console.error('登录失败:', error)
        alert(`登录失败: ${error.message}`)
      } finally {
        isLoading.value = false
      }
    }
    
    const handleSignUp = async () => {
      if (!canSignUp.value) return
      
      isLoading.value = true
      
      try {
        // 设置用户偏好
        authStore.setLanguage(loginForm.value.language)
        
        // 邮箱注册
        await authStore.signUpWithEmail(
          loginForm.value.email.trim(),
          loginForm.value.password,
          loginForm.value.displayName.trim()
        )
        
        // 跳转到实验室大厅
        window.location.hash = '#/lobby'
        
      } catch (error) {
        console.error('注册失败:', error)
        alert(`注册失败: ${error.message}`)
      } finally {
        isLoading.value = false
      }
    }
    
    return {
      loginMode,
      loginForm,
      isLoading,
      canLogin,
      canSignUp,
      handleLogin,
      handleSignUp
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 500px;
}

.login-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-section {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  padding: 40px 30px;
  text-align: center;
  color: white;
}

.app-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.app-subtitle {
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
}

.login-form {
  padding: 40px 30px;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 16px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.login-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-btn {
  flex: 1;
  padding: 10px 16px;
  background: transparent;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: #4CAF50;
  border-color: #4CAF50;
  color: white;
}

.tab-btn:hover:not(.active) {
  border-color: #4CAF50;
  color: #4CAF50;
}

.login-form-content {
  margin-bottom: 20px;
}

.login-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.login-btn, .signup-btn {
  flex: 1;
  padding: 14px 20px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
}

.signup-btn {
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  color: white;
}

.login-btn:hover:not(:disabled),
.signup-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.login-btn:disabled,
.signup-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-tips {
  text-align: center;
}

.login-tips p {
  margin: 8px 0;
  font-size: 13px;
  color: #666;
}

.features-preview {
  background: #f8f9fa;
  padding: 30px;
}

.features-preview h3 {
  margin: 0 0 20px 0;
  text-align: center;
  color: #333;
  font-size: 18px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 15px 10px;
  background: white;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.feature-item span {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

@media (max-width: 480px) {
  .login-card {
    margin: 10px;
  }
  
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .app-title {
    font-size: 28px;
  }
}
</style>