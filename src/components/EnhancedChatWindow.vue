<template>
  <div class="enhanced-chat-window">
    <div class="chat-header">
      <div class="chat-info">
        <h3>{{ currentChatName }}</h3>
        <span class="chat-status">{{ onlineStatus }}</span>
      </div>
      <div class="header-actions">
        <button @click="showParticipants = !showParticipants" class="participants-btn" title="参与者">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
        </button>
        <button @click="$emit('close')" class="close-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="participants-panel" v-if="showParticipants">
      <div class="participant-item" v-for="participant in participants" :key="participant.id">
        <div class="participant-avatar">{{ participant.name.charAt(0) }}</div>
        <div class="participant-info">
          <div class="participant-name">{{ participant.name }}</div>
          <div class="participant-status" :class="{ 'online': participant.online }">
            {{ participant.online ? '在线' : '离线' }}
          </div>
        </div>
      </div>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <div v-for="message in messages" :key="message.id" class="message" :class="{ 'own': message.isOwn }">
        <div class="message-avatar">{{ message.sender.charAt(0) }}</div>
        <div class="message-content">
          <div class="message-sender">{{ message.sender }}</div>
          <div class="message-text">{{ message.text }}</div>
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
        </div>
      </div>
    </div>
    
    <div class="chat-input">
      <div class="input-actions">
        <button @click="showFileUpload = true" class="file-btn" title="发送文件">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
          </svg>
        </button>
        <button @click="showEmojiPicker = !showEmojiPicker" class="emoji-btn" title="表情">
          😊
        </button>
      </div>
      <input 
        v-model="newMessage" 
        @keyup.enter="sendMessage"
        placeholder="输入消息..."
        class="message-input"
      >
      <button @click="sendMessage" class="send-btn" :disabled="!newMessage.trim()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
    
    <div class="emoji-picker" v-if="showEmojiPicker">
      <div class="emoji-grid">
        <span v-for="emoji in emojis" :key="emoji" @click="insertEmoji(emoji)" class="emoji-item">
          {{ emoji }}
        </span>
      </div>
    </div>
    
    <input 
      type="file" 
      ref="fileInput"
      @change="handleFileSelect"
      style="display: none"
      multiple
    >
  </div>
</template>

<script>
import { useChatStore } from '../stores/chat'

export default {
  name: 'EnhancedChatWindow',
  data() {
    return {
      newMessage: '',
      showParticipants: false,
      showEmojiPicker: false,
      showFileUpload: false,
      emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛'],
      chatStore: useChatStore()
    }
  },
  computed: {
    currentChatName() {
      // currentChat 是 chatId 字符串，不是对象
      const chatId = this.chatStore.currentChat
      if (chatId === 'lobby-chat') return '大厅聊天'
      if (chatId?.startsWith('lab-')) return '实验室聊天'
      return '聊天'
    },
    onlineStatus() {
      const onlineCount = this.participants.filter(p => p.online).length
      return `${onlineCount} 人在线`
    },
    participants() {
      return [
        { id: 1, name: '用户1', online: true },
        { id: 2, name: '用户2', online: true },
        { id: 3, name: '我', online: true }
      ]
    },
    messages() {
      return this.chatStore.messages
    }
  },
  methods: {
    sendMessage() {
      if (!this.newMessage.trim()) return
      
      this.chatStore.sendMessage(this.chatStore.currentChat, this.newMessage)
      this.newMessage = ''
      
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },
    
    insertEmoji(emoji) {
      this.newMessage += emoji
      this.showEmojiPicker = false
    },
    
    handleFileSelect(event) {
      const files = Array.from(event.target.files)
      
      files.forEach(file => {
        this.chatStore.sendMessage(this.chatStore.currentChat, `📎 ${file.name}`)
      })
      
      event.target.value = ''
    },
    
    scrollToBottom() {
      const container = this.$refs.messagesContainer
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    },
    
    formatTime(timestamp) {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
  },
  
  mounted() {
    this.scrollToBottom()
    
    document.addEventListener('click', (e) => {
      if (!this.$el.contains(e.target)) {
        this.showEmojiPicker = false
      }
    })
  },
  
  watch: {
    showFileUpload(newVal) {
      if (newVal) {
        this.$refs.fileInput.click()
        this.showFileUpload = false
      }
    }
  }
}
</script>

<style scoped>
.enhanced-chat-window {
  position: fixed;
  bottom: 90px;
  left: 20px;
  width: 380px;
  height: 550px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  z-index: 999;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  border-radius: 12px 12px 0 0;
}

.chat-info h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.chat-status {
  font-size: 12px;
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.participants-btn,
.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.participants-btn:hover,
.close-btn:hover {
  background: var(--background-color);
  color: var(--text-primary);
}

.participants-panel {
  background: var(--background-color);
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
  max-height: 120px;
  overflow-y: auto;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.participant-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--secondary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
}

.participant-info {
  flex: 1;
}

.participant-name {
  font-size: 14px;
  font-weight: 500;
}

.participant-status {
  font-size: 12px;
  color: var(--text-secondary);
}

.participant-status.online {
  color: var(--primary-color);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  display: flex;
  gap: 12px;
  max-width: 80%;
}

.message.own {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--secondary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  flex-shrink: 0;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.message-sender {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.message-text {
  background: var(--background-color);
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.4;
}

.message.own .message-text {
  background: var(--primary-color);
  color: white;
}

.message-time {
  font-size: 11px;
  color: var(--text-secondary);
}

.chat-input {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid var(--border-color);
  border-radius: 0 0 12px 12px;
}

.input-actions {
  display: flex;
  gap: 4px;
}

.file-btn,
.emoji-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  font-size: 16px;
}

.file-btn:hover,
.emoji-btn:hover {
  background: var(--background-color);
  color: var(--text-primary);
}

.message-input {
  flex: 1;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
}

.send-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.send-btn:hover:not(:disabled) {
  background: #45a049;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.emoji-picker {
  position: absolute;
  bottom: 70px;
  left: 16px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow);
  padding: 8px;
  z-index: 1000;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
}

.emoji-item {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
}

.emoji-item:hover {
  background: var(--background-color);
}
</style>