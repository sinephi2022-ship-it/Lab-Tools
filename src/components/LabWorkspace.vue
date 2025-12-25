<template>
  <div class="lab-workspace">
    <div class="workspace-header">
      <button @click="backToLobby" class="back-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
        返回大厅
      </button>
      <div class="project-title">{{ currentProject.name || '未命名项目' }}</div>
    </div>
    <Toolbar @add-element="handleAddElement" />
    <EnhancedCanvasContainer 
      ref="canvasContainer"
      :elements="projectStore.elements" 
      :connections="projectStore.connections"
      @element-create="handleElementCreate"
      @element-update="handleElementUpdate"
      @element-delete="handleElementDelete"
      @connection-create="handleConnectionCreate"
    />
    <FilePanel @file-upload="handleFileUpload" />
    <ProjectInfo :project="currentProject" @export-report="handleExportReport" />
    
    <div class="user-menu" @click="showProfile = true">
      <img v-if="authStore.profile.avatar" :src="authStore.profile.avatar" :alt="authStore.profile.displayName" class="user-avatar">
      <div v-else class="user-avatar-placeholder">{{ (authStore.profile?.displayName || '用户').charAt(0) }}</div>
    </div>
    
    <ChatBubble v-if="showChat" @toggle-chat="toggleChat" :unread-count="chatStore.unreadCount" />
    <EnhancedChatWindow v-if="chatOpen" @close="closeChat" />
    
    <UserProfile :show-profile="showProfile" @close="showProfile = false" />
    <ReportExportModal 
      :show-modal="showReportModal" 
      :project="currentProject"
      :elements="elements"
      :connections="connections"
      @close="showReportModal = false"
    />
  </div>
</template>

<script>
import Toolbar from './Toolbar.vue'
import EnhancedCanvasContainer from './EnhancedCanvasContainer.vue'
import FilePanel from './FilePanel.vue'
import ProjectInfo from './ProjectInfo.vue'
import ChatBubble from './ChatBubble.vue'
import EnhancedChatWindow from './EnhancedChatWindow.vue'
import UserProfile from './UserProfile.vue'
import ReportExportModal from './ReportExportModal.vue'
import { useProjectStore } from '../stores/project'
import { useChatStore } from '../stores/chat'
import { useAuthStore } from '../stores/auth'
import { useProjectManagementStore } from '../stores/projectManagement'
import { onMounted, ref, watch } from 'vue'

export default {
  name: 'LabWorkspace',
  components: {
    Toolbar,
    EnhancedCanvasContainer,
    FilePanel,
    ProjectInfo,
    ChatBubble,
    EnhancedChatWindow,
    UserProfile,
    ReportExportModal
  },
  data() {
    return {
      showChat: true,
      chatOpen: false,
      showProfile: false,
      showReportModal: false
    }
  },
  setup() {
    const projectStore = useProjectStore()
    const chatStore = useChatStore()
    const authStore = useAuthStore()
    const projectManagementStore = useProjectManagementStore()
    
    const currentProject = ref({
      id: '',
      name: '加载中...',
      isPublic: true,
      owner: '',
      members: []
    })
    
const loadLabData = async (projectId) => {
      try {
        // 加载项目数据
        const projectData = await projectManagementStore.loadLab(projectId)
        if (projectData) {
          currentProject.value = projectData
          projectStore.setElements(projectData.elements || [])
          projectStore.setConnections(projectData.connections || [])
          projectStore.setCamera(projectData.camera || { x: 0, y: 0, zoom: 1 })
          
          // 初始化聊天
          chatStore.initializeChat(projectId, authStore.user)
        }
      } catch (error) {
        console.error('加载实验室数据失败:', error)
        // 加载失败时重定向到大厅
        window.location.hash = '#/lobby'
      }
    }
    
    const loadProject = loadLabData // 别名，保持兼容性
    
    const saveProjectData = async () => {
      if (!currentProject.value.id) return
      
      try {
        const updatedData = {
          ...currentProject.value,
          elements: projectStore.elements,
          connections: projectStore.connections,
          camera: projectStore.camera,
          updatedAt: new Date().toISOString()
        }
        
        await projectManagementStore.saveLab(currentProject.value.id, updatedData)
        currentProject.value = updatedData
      } catch (error) {
        console.error('保存项目失败:', error)
        throw error
      }
    }
    
    const getProjectIdFromHash = () => {
      const hash = window.location.hash
      const match = hash.match(/#\/project\/(.+)/)
      return match ? match[1] : null
    }
    
    const handleHashChange = () => {
      const projectId = getProjectIdFromHash()
      if (projectId) {
        loadLabData(projectId)
      }
    }
    
    onMounted(async () => {
      await authStore.initializeAuth()
      
      const projectId = getProjectIdFromHash()
      if (projectId) {
        await loadLabData(projectId)
      } else {
        // 如果没有项目ID，重定向到大厅
        window.location.hash = '#/lobby'
      }
      
      // 监听路由变化
      window.addEventListener('hashchange', handleHashChange)
    })
    
    // 清理订阅和事件监听
    const cleanup = () => {
      window.removeEventListener('hashchange', handleHashChange)
      if (projectStore.unsubscribe) {
        projectStore.unsubscribe()
      }
    }
    
    return {
      projectStore,
      elements: projectStore.elements,
      connections: projectStore.connections,
      chatStore,
      authStore,
      currentProject,
      cleanup
    }
  },
  methods: {
    backToLobby() {
      // 清理当前项目数据
      projectStore.clearProject()
      chatStore.closeChat()
      this.cleanup()
      // 跳转到大厅
      window.location.hash = '#/lobby'
    },
    handleAddElement(type) {
      // 使用 EnhancedCanvasContainer 处理元素创建
      if (this.$refs.canvasContainer) {
        this.$refs.canvasContainer.addElement(type)
      }
    },
    handleElementCreate(element) {
      projectStore.elements.push(element)
      this.saveProjectData()
    },
    handleElementUpdate(element) {
      const index = projectStore.elements.findIndex(el => el.id === element.id)
      if (index !== -1) {
        projectStore.elements[index] = element
        this.saveProjectData()
      }
    },
    handleElementDelete(id) {
      projectStore.elements = projectStore.elements.filter(el => el.id !== id)
      projectStore.removeConnectionsByElement(id)
      this.saveProjectData()
    },
    handleConnectionCreate(connection) {
      const newConnection = {
        id: Date.now().toString(),
        ...connection
      }
      projectStore.connections.push(newConnection)
      this.saveProjectData()
    },
    handleElementCreate(element) {
      this.elements.push(element)
    },
    
    handleFileUpload(file) {
      // 这个方法现在由CanvasContainer的handleFileUpload处理
      // 保留作为备用
      console.log('File upload received:', file)
    },
    toggleChat() {
      this.chatOpen = !this.chatOpen
      if (this.chatOpen) {
        this.chatStore.openChat('demo-chat')
      }
    },
    closeChat() {
      this.chatOpen = false
      this.chatStore.closeChat()
    },
    handleExportReport() {
      this.showReportModal = true
    }
  }
}
</script>

<style scoped>
.lab-workspace {
  width: 100vw;
  height: 100vh;
  position: relative;
  background: var(--background-color);
  display: flex;
  flex-direction: column;
}

.workspace-header {
  height: 60px;
  background: white;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1000;
  position: relative;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #1976D2;
  transform: translateY(-1px);
}

.project-title {
  margin-left: 20px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.user-menu {
  position: fixed;
  top: 20px;
  right: 320px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 100;
  box-shadow: var(--shadow);
}

.user-menu:hover {
  transform: scale(1.1);
  box-shadow: var(--shadow-hover);
}

.user-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--secondary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
}
</style>