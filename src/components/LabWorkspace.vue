<template>
  <div class="lab-workspace">
    <Toolbar @add-element="handleAddElement" />
    <CanvasContainer 
      :elements="elements" 
      :connections="connections"
      @element-update="handleElementUpdate"
      @connection-create="handleConnectionCreate"
    />
    <FilePanel @file-upload="handleFileUpload" />
    <ProjectInfo :project="currentProject" @export-report="handleExportReport" />
    
    <div class="user-menu" @click="showProfile = true">
      <img v-if="authStore.profile.avatar" :src="authStore.profile.avatar" :alt="authStore.profile.displayName" class="user-avatar">
      <div v-else class="user-avatar-placeholder">{{ authStore.profile.displayName.charAt(0) }}</div>
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
import CanvasContainer from './CanvasContainer.vue'
import FilePanel from './FilePanel.vue'
import ProjectInfo from './ProjectInfo.vue'
import ChatBubble from './ChatBubble.vue'
import EnhancedChatWindow from './EnhancedChatWindow.vue'
import UserProfile from './UserProfile.vue'
import ReportExportModal from './ReportExportModal.vue'
import { useProjectStore } from '../stores/project'
import { useChatStore } from '../stores/chat'
import { useAuthStore } from '../stores/auth'
import { onMounted } from 'vue'

export default {
  name: 'LabWorkspace',
  components: {
    Toolbar,
    CanvasContainer,
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
      showReportModal: false,
      currentProject: {
        id: 'demo-project',
        name: 'Demo Project',
        isPublic: true,
        owner: 'Demo User',
        members: ['User 1', 'User 2']
      }
    }
  },
  setup() {
    const projectStore = useProjectStore()
    const chatStore = useChatStore()
    const authStore = useAuthStore()
    
    onMounted(() => {
      authStore.initializeAuth()
    })
    
    return {
      elements: projectStore.elements,
      connections: projectStore.connections,
      chatStore,
      authStore
    }
  },
  methods: {
    handleAddElement(type) {
      const newElement = {
        id: Date.now().toString(),
        type,
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
        width: 200,
        height: 150,
        content: '',
        color: this.getDefaultColor(type)
      }
      this.elements.push(newElement)
    },
    getDefaultColor(type) {
      const colors = {
        note: '#FFF59D',
        timer: '#E1F5FE',
        protocol: '#E8F5E9',
        text: 'transparent',
        file: '#F3E5F5'
      }
      return colors[type] || '#FFFFFF'
    },
    handleElementUpdate(elementId, updates) {
      const index = this.elements.findIndex(el => el.id === elementId)
      if (index !== -1) {
        this.elements[index] = { ...this.elements[index], ...updates }
      }
    },
    handleConnectionCreate(fromId, toId) {
      const newConnection = {
        id: Date.now().toString(),
        from: fromId,
        to: toId,
        curvature: 0.3
      }
      this.connections.push(newConnection)
    },
    handleFileUpload(file) {
      const fileElement = {
        id: Date.now().toString(),
        type: 'file',
        x: 300,
        y: 300,
        width: 200,
        height: 100,
        content: file.name,
        color: '#F3E5F5',
        fileData: file
      }
      this.elements.push(fileElement)
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