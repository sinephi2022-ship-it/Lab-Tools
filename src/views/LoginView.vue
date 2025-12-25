<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>🧪 LabMate Pro v2</h1>
        <p>虚拟实验室协作平台</p>
      </div>
      
      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="登录" name="login">
          <el-form @submit.prevent="handleLogin" :model="loginForm" :rules="loginRules" ref="loginFormRef">
            <el-form-item prop="email">
              <el-input v-model="loginForm.email" placeholder="邮箱" type="email" />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="loginForm.password" placeholder="密码" type="password" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleLogin" :loading="isLoading" style="width: 100%">
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="注册" name="register">
          <el-form @submit.prevent="handleRegister" :model="registerForm" :rules="registerRules" ref="registerFormRef">
            <el-form-item prop="email">
              <el-input v-model="registerForm.email" placeholder="邮箱" type="email" />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="registerForm.password" placeholder="密码" type="password" show-password />
            </el-form-item>
            <el-form-item prop="displayName">
              <el-input v-model="registerForm.displayName" placeholder="显示名称" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleRegister" :loading="isLoading" style="width: 100%">
                注册
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('login')
const isLoading = ref(false)

const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()

const loginForm = reactive({
  email: '',
  password: ''
})

const registerForm = reactive({
  email: '',
  password: '',
  displayName: ''
})

const loginRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ]
}

const registerRules: FormRules = {
  ...loginRules,
  displayName: [
    { required: true, message: '请输入显示名称', trigger: 'blur' },
    { min: 2, message: '名称长度至少2位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    isLoading.value = true
    await authStore.login(loginForm.email, loginForm.password)
    ElMessage.success('登录成功')
    router.push('/lobby')
  } catch (error) {
    ElMessage.error('登录失败，请检查邮箱和密码')
  } finally {
    isLoading.value = false
  }
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  try {
    await registerFormRef.value.validate()
    isLoading.value = true
    await authStore.register(registerForm.email, registerForm.password, registerForm.displayName)
    ElMessage.success('注册成功')
    router.push('/lobby')
  } catch (error) {
    ElMessage.error('注册失败，请检查输入信息')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  overflow: hidden;
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  padding: 30px;
  background: #f8f9fa;
}

.login-header h1 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 28px;
}

.login-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.login-tabs {
  padding: 30px;
}

:deep(.el-tabs__header) {
  margin-bottom: 30px;
}

:deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 500;
}
</style>