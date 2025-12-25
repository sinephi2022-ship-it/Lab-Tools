<template>
  <div class="page-container">
    <div class="header">
      <div class="header-left">
        <h1>🧪 LabMate Pro v2</h1>
      </div>
      
      <div class="header-center">
        <el-input
          v-model="searchQuery"
          placeholder="搜索实验室..."
          style="width: 300px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      
      <div class="header-right">
        <div class="user-info">
          <el-avatar>{{ user?.displayName?.charAt(0) || 'U' }}</el-avatar>
          <span>{{ user?.displayName }}</span>
        </div>
        <el-button @click="handleLogout" type="danger" plain>退出</el-button>
      </div>
    </div>

    <div class="main-content">
      <!-- 快速操作区 -->
      <div class="quick-actions">
        <el-card class="action-card" @click="showCreateDialog = true; labType = 'private'">
          <div class="action-icon">🔒</div>
          <h3>私人实验室</h3>
          <p>创建仅自己可见的私人实验室</p>
        </el-card>
        
        <el-card class="action-card" @click="showCreateDialog = true; labType = 'public'">
          <div class="action-icon">🌐</div>
          <h3>多人实验室</h3>
          <p>创建可邀请他人的协作实验室</p>
        </el-card>
      </div>

      <!-- 我的实验室 -->
      <div class="labs-section">
        <h2>我的实验室</h2>
        <div class="labs-grid" v-if="filteredMyLabs.length > 0">
          <el-card
            v-for="lab in filteredMyLabs"
            :key="lab.id"
            class="lab-card"
            @click="enterLab(lab)"
          >
            <div class="lab-header">
              <h3>{{ lab.name }}</h3>
              <el-tag :type="lab.type === 'private' ? 'info' : 'success'">
                {{ lab.type === 'private' ? '私人' : '多人' }}
              </el-tag>
            </div>
            <div class="lab-info">
              <p>创建时间: {{ formatDate(lab.createdAt) }}</p>
              <p>成员数: {{ lab.members.length }}</p>
            </div>
          </el-card>
        </div>
        <el-empty v-else description="暂无实验室，创建一个开始吧！" />
      </div>

      <!-- 公共实验室 -->
      <div class="labs-section">
        <h2>公共实验室</h2>
        <div class="labs-grid" v-if="filteredPublicLabs.length > 0">
          <el-card
            v-for="lab in filteredPublicLabs"
            :key="lab.id"
            class="lab-card"
            @click="enterLab(lab)"
          >
            <div class="lab-header">
              <h3>{{ lab.name }}</h3>
              <el-tag type="success">多人</el-tag>
            </div>
            <div class="lab-info">
              <p>创建者: {{ lab.owner }}</p>
              <p>成员数: {{ lab.members.length }}</p>
            </div>
          </el-card>
        </div>
        <el-empty v-else description="暂无公共实验室" />
      </div>
    </div>

    <!-- 创建实验室对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建实验室" width="400px">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef">
        <el-form-item label="实验室名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入实验室名称" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="labType">
            <el-radio label="private">私人实验室</el-radio>
            <el-radio label="public">多人实验室</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateLab" :loading="isCreating">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useLabStore } from '@/stores/lab'
import type { Lab } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const labStore = useLabStore()

const user = computed(() => authStore.user)
const searchQuery = ref('')
const showCreateDialog = ref(false)
const labType = ref<'private' | 'public'>('private')
const isCreating = ref(false)

const createFormRef = ref<FormInstance>()
const createForm = reactive({
  name: ''
})

const createRules: FormRules = {
  name: [
    { required: true, message: '请输入实验室名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

let unsubscribeLabs: (() => void) | null = null

const filteredMyLabs = computed(() => {
  if (!user.value) return []
  return labStore.labs
    .filter(lab => lab.owner === user.value.uid)
    .filter(lab => lab.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

const filteredPublicLabs = computed(() => {
  if (!user.value) return []
  return labStore.labs
    .filter(lab => lab.type === 'public' && lab.owner !== user.value.uid)
    .filter(lab => lab.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

const formatDate = (date: any) => {
  if (!date) return ''
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('zh-CN')
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await authStore.logout()
    router.push('/login')
  } catch {
    // 用户取消
  }
}

const handleCreateLab = async () => {
  if (!createFormRef.value || !user.value) return
  
  try {
    await createFormRef.value.validate()
    isCreating.value = true
    
    await labStore.createNewLab(createForm.name, labType.value, user.value.uid)
    ElMessage.success('实验室创建成功')
    showCreateDialog.value = false
    createForm.name = ''
  } catch (error) {
    ElMessage.error('创建实验室失败')
  } finally {
    isCreating.value = false
  }
}

const enterLab = (lab: Lab) => {
  labStore.setCurrentLab(lab)
  router.push(`/lab/${lab.id}`)
}

onMounted(async () => {
  if (user.value) {
    await labStore.loadLabs(user.value.uid)
    unsubscribeLabs = labStore.subscribeToLabsRealtime(user.value.uid)
  }
})

onUnmounted(() => {
  if (unsubscribeLabs) {
    unsubscribeLabs()
  }
})
</script>

<style scoped>
.header {
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left h1 {
  margin: 0;
  color: #333;
  font-size: 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.main-content {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.action-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.action-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.action-card h3 {
  margin: 10px 0;
  color: #333;
}

.action-card p {
  color: #666;
  margin: 0;
}

.labs-section {
  margin-bottom: 40px;
}

.labs-section h2 {
  margin-bottom: 20px;
  color: #333;
}

.labs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.lab-card {
  cursor: pointer;
  transition: all 0.3s;
}

.lab-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}

.lab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.lab-header h3 {
  margin: 0;
  color: #333;
}

.lab-info p {
  margin: 5px 0;
  color: #666;
  font-size: 14px;
}
</style>