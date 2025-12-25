<template>
  <div class="lab-lobby">
    <!-- 顶部导航栏 -->
    <header class="lobby-header">
      <div class="header-left">
        <h1 class="app-logo">LabMate Pro</h1>
      </div>
      
      <div class="header-center">
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索邀请码..."
            @keyup.enter="joinByInviteCode"
          >
          <button @click="joinByInviteCode" class="search-btn">加入</button>
        </div>
      </div>
      
      <div class="header-right">
        <div class="user-menu" @click="showProfile = !showProfile">
          <img v-if="authStore.profile.avatar" :src="authStore.profile.avatar" :alt="authStore.profile.displayName" class="user-avatar">
          <div v-else class="user-avatar-placeholder">{{ (authStore.profile?.displayName || '用户').charAt(0) }}</div>
          <span class="username">{{ authStore.profile?.displayName || '匿名用户' }}</span>
        </div>
        
        <button @click="logout" class="logout-btn">退出</button>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="lobby-main">
      <!-- 快速操作区 -->
      <section class="quick-actions">
        <div class="action-card" @click="createPrivateProject">
          <div class="action-icon">🔒</div>
          <h3>私人实验</h3>
          <p>创建仅自己可见的私人实验项目</p>
          <button class="action-btn">创建</button>
        </div>
        
        <div class="action-card" @click="createPublicProject">
          <div class="action-icon">🌐</div>
          <h3>多人实验</h3>
          <p>创建可邀请他人的协作实验项目</p>
          <button class="action-btn">创建</button>
        </div>
        
        <div class="action-card" @click="showCollection = true">
          <div class="action-icon">⭐</div>
          <h3>个人收藏</h3>
          <p>管理您的实验模板和收藏文件</p>
          <button class="action-btn">管理</button>
        </div>
      </section>

      <!-- 项目列表 -->
      <section class="projects-section">
        <div class="section-header">
          <h2>我的实验项目</h2>
          <div class="view-tabs">
            <button 
              @click="activeTab = 'private'" 
              :class="['tab-btn', { active: activeTab === 'private' }]"
            >
              私人项目
            </button>
            <button 
              @click="activeTab = 'public'" 
              :class="['tab-btn', { active: activeTab === 'public' }]"
            >
              多人项目
            </button>
            <button 
              @click="activeTab = 'recent'" 
              :class="['tab-btn', { active: activeTab === 'recent' }]"
            >
              最近访问
            </button>
          </div>
        </div>
        
        <div class="projects-grid">
          <div v-for="lab in labsWithOwnerInfo" :key="lab.id"
            class="project-card"
            @click="openLab(lab)"
                >
                  <div class="project-header">
                    <h3>{{ lab.name }}</h3>
                    <div class="project-badge" :class="lab.type">
                      {{ lab.type === 'private' ? '私人' : '多人' }}
                    </div>
                  </div>
                  
                  <div class="project-info">
                    <div class="project-meta">
                      <span class="owner">创建者：{{ lab.ownerInfo.displayName }}</span>
                      <span class="members" v-if="lab.type === 'public'">
                        成员：{{ lab.members.length }}人
                      </span>
                    </div>
                    
                    <div class="project-stats">
                      <div class="stat-item">
                        <span class="stat-label">元素</span>
                        <span class="stat-value">{{ lab.elements?.length || 0 }}</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">连接</span>
                        <span class="stat-value">{{ lab.connections?.length || 0 }}</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">文件</span>
                        <span class="stat-value">{{ lab.files?.length || 0 }}</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">更新</span>
                        <span class="stat-value">{{ formatTime(lab.updatedAt) }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="project-actions">
                    <button @click.stop="shareProject(lab)" class="action-small-btn share">
                      分享
                    </button>
                    <button @click.stop="deleteProject(lab)" class="action-small-btn delete">
                      删除
                    </button>
                  </div>
                </div>          
          <!-- 空状态 -->
          <div v-if="filteredLabs.length === 0" class="empty-state">
            <div class="empty-icon">🧪</div>
            <h3>暂无实验室</h3>
            <p>创建您的第一个实验室吧！</p>
          </div>
        </div>
      </section>
    </main>

    <!-- 用户资料弹窗 -->
    <UserProfile v-if="showProfile" @close="showProfile = false" />
    
    <!-- 收藏管理弹窗 -->
    <CollectionModal v-if="showCollection" @close="showCollection = false" />
    
    <!-- 创建项目弹窗 -->
    <CreateProjectModal 
      v-if="showCreateModal" 
      :project-type="createType"
      @close="showCreateModal = false"
      @created="onProjectCreated"
    />
    
    <!-- 聊天气泡球 -->
    <ChatBubble v-if="showChat" @toggle-chat="toggleChat" :unread-count="chatStore.unreadCount" />
    <EnhancedChatWindow v-if="chatOpen" @close="closeChat" />
    
    <!-- 好友系统 -->
    <FriendsSystem />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useProjectStore } from '../stores/project'
import { useProjectManagementStore } from '../stores/projectManagement'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '../utils/firebase'
import UserProfile from './UserProfile.vue'
import CollectionModal from './CollectionModal.vue'
import CreateProjectModal from './CreateProjectModal.vue'
import ChatBubble from './ChatBubble.vue'
import EnhancedChatWindow from './EnhancedChatWindow.vue'
import FriendsSystem from './FriendsSystem.vue'
import { useChatStore } from '../stores/chat'

export default {
  name: 'LabLobby',
  components: {
    UserProfile,
    CollectionModal,
    CreateProjectModal,
    ChatBubble,
    EnhancedChatWindow,
    FriendsSystem
  },
  setup() {
    const authStore = useAuthStore()
    const projectStore = useProjectStore()
    const projectManagementStore = useProjectManagementStore()
    const chatStore = useChatStore()
    
    const searchQuery = ref('')
    const activeTab = ref('private')
    const showProfile = ref(false)
    const showCollection = ref(false)
    const showCreateModal = ref(false)
    const createType = ref('private')
    const showChat = ref(true)
    const chatOpen = ref(false)
    
    // 用户信息缓存
    const userCache = ref(new Map())
    
    // 获取用户信息
    const getUserInfo = async (userId) => {
      if (userCache.value.has(userId)) {
        return userCache.value.get(userId)
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', userId))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          userCache.value.set(userId, userData)
          return userData
        }
        return { displayName: '未知用户' }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        return { displayName: '未知用户' }
      }
    }
    
// 使用项目管理存储的实验室数据
    
const filteredLabs = computed(() => {
      let filtered = projectManagementStore.labs
      
      // 按标签页筛选
      if (activeTab.value === 'private') {
        filtered = filtered.filter(l => l.type === 'private')
      } else if (activeTab.value === 'public') {
        filtered = filtered.filter(l => l.type === 'public')
      }
      
      // 按搜索查询筛选
      if (searchQuery.value.trim()) {
        filtered = filtered.filter(l => 
          l.name.includes(searchQuery.value) ||
          l.inviteCode?.includes(searchQuery.value)
        )
      }
      
      return filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    })
    
    // 处理实验室列表，添加owner信息
    const labsWithOwnerInfo = computed(() => {
      return filteredLabs.value.map(lab => ({
        ...lab,
        ownerInfo: lab.owner === authStore.user?.uid 
          ? authStore.profile 
          : { displayName: '其他用户' }
      }))
    })
    
    const createPrivateProject = () => {
      createType.value = 'private'
      showCreateModal.value = true
    }
    
    const createPublicProject = () => {
      createType.value = 'public'
      showCreateModal.value = true
    }
    
    const openLab = (lab) => {
      // 跳转到实验室页面
      window.location.hash = `#/project/${lab.id}`
    }
    
    const joinByInviteCode = async () => {
      const code = searchQuery.value.trim().toUpperCase()
      if (!code) {
        alert('请输入邀请码')
        return
      }
      
      try {
        // 尝试通过邀请码加入实验室
        const lab = await projectManagementStore.joinLab(code, authStore.user.uid)
        if (lab) {
          searchQuery.value = ''
          // 重新加载列表以显示新加入的实验室
          await projectManagementStore.loadUserLabs(authStore.user.uid)
          openLab(lab)
        }
      } catch (error) {
        console.error('加入实验室失败:', error)
        alert(`加入实验室失败: ${error.message}`)
      }
    }
    
    const shareProject = (lab) => {
      if (lab.inviteCode) {
        navigator.clipboard.writeText(lab.inviteCode)
        alert(`邀请码已复制：${lab.inviteCode}`)
      } else {
        alert('私人实验室无法分享')
      }
    }
    
const deleteProject = async (lab) => {
      // 权限检查：仅实验室所有者可以删除
      if (lab.owner !== authStore.user?.uid) {
        alert('只有实验室所有者可以删除实验室')
        return
      }
      
      if (confirm(`确定要删除实验室"${lab.name}"吗？`)) {
        try {
          await projectManagementStore.deleteLab(lab.id, authStore.user.uid)
          // 重新加载列表确保UI更新
          await projectManagementStore.loadUserLabs(authStore.user.uid)
        } catch (error) {
          console.error('删除实验室失败:', error)
          alert('删除实验室失败，请重试')
        }
      }
    }
    
    const onProjectCreated = async (newProject) => {
      try {
        // CreateProjectModal 已经调用了 createLab，这里直接使用返回的 id
        const labId = newProject.id
        
        // 重新加载实验室列表（确保UI同步）
        await projectManagementStore.loadUserLabs(authStore.user.uid)
        
        showCreateModal.value = false
        
        // 跳转到新创建的实验室
        window.location.hash = `#/project/${labId}`
      } catch (error) {
        console.error('处理创建实验室失败:', error)
        alert('处理创建实验室失败，请重试')
      }
    }
    
    const formatTime = (timestamp) => {
      const now = Date.now()
      const diff = now - timestamp
      
      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
      return `${Math.floor(diff / 86400000)}天前`
    }
    
    const logout = () => {
      if (confirm('确定要退出登录吗？')) {
        authStore.logout()
        window.location.hash = '#/login'
      }
    }
    
    // 聊天相关方法
    const toggleChat = () => {
      chatOpen.value = !chatOpen.value
      if (chatOpen.value) {
        chatStore.openChat('lobby-chat')
      }
    }
    
    const closeChat = () => {
      chatOpen.value = false
      chatStore.closeChat()
    }
    
    onMounted(async () => {
      try {
        // 确保用户已认证
        if (!authStore.user) {
          await authStore.initializeAuth()
        }
        
        // 加载用户实验室列表
        if (authStore.user) {
          await projectManagementStore.loadUserLabs(authStore.user.uid)
        }
      } catch (error) {
        console.error('初始化大厅失败:', error)
        // 如果初始化失败，重定向到登录页
        window.location.hash = '#/login'
      }
    })
    
    return {
      authStore,
      projectManagementStore,
      chatStore,
      searchQuery,
      activeTab,
      showProfile,
      showCollection,
      showCreateModal,
      createType,
      showChat,
      chatOpen,
      filteredLabs,
      labsWithOwnerInfo,
      createPrivateProject,
      createPublicProject,
      openLab,
      joinByInviteCode,
      shareProject,
      deleteProject,
      onProjectCreated,
      formatTime,
      logout,
      getUserInfo,
      toggleChat,
      closeChat
    }
  }
}
</script>

<style scoped>
.lab-lobby {
  min-height: 100vh;
  background: #f5f7fa;
}

.lobby-header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left .app-logo {
  font-size: 24px;
  font-weight: 700;
  color: #4CAF50;
  margin: 0;
}

.header-center .search-box {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-box input {
  width: 300px;
  padding: 10px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.search-box input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.search-btn {
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-btn:hover {
  background: #45a049;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 25px;
  transition: all 0.3s ease;
}

.user-menu:hover {
  background: #f5f5f5;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #4CAF50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.logout-btn {
  padding: 8px 16px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: #d32f2f;
}

.lobby-main {
  padding: 30px;
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
  background: white;
  border-radius: 16px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.action-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.action-card h3 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.action-card p {
  color: #666;
  font-size: 14px;
  margin: 0 0 20px 0;
  line-height: 1.5;
}

.action-btn {
  padding: 10px 24px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: #45a049;
}

.projects-section {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.section-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.view-tabs {
  display: flex;
  gap: 10px;
}

.tab-btn {
  padding: 8px 16px;
  background: transparent;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
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

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.project-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.project-card:hover {
  border-color: #4CAF50;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.project-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
  flex: 1;
}

.project-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.project-badge.private {
  background: #e3f2fd;
  color: #1976d2;
}

.project-badge.public {
  background: #e8f5e9;
  color: #388e3c;
}

.project-info {
  margin-bottom: 16px;
}

.project-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.project-meta span {
  font-size: 13px;
  color: #666;
}

.project-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.project-actions {
  display: flex;
  gap: 10px;
}

.action-small-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-small-btn.share {
  background: #2196F3;
  color: white;
}

.action-small-btn.share:hover {
  background: #1976D2;
}

.action-small-btn.delete {
  background: #f44336;
  color: white;
}

.action-small-btn.delete:hover {
  background: #d32f2f;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.empty-state p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

@media (max-width: 768px) {
  .lobby-header {
    flex-direction: column;
    height: auto;
    padding: 20px;
    gap: 20px;
  }
  
  .header-center .search-box input {
    width: 250px;
  }
  
  .lobby-main {
    padding: 20px;
  }
  
  .quick-actions {
    grid-template-columns: 1fr;
  }
  
  .projects-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
  }
}
</style>