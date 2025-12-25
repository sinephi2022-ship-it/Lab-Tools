import { defineStore } from 'pinia'
import { sendMessage, subscribeToChat, initChat, addLabChat, subscribeToLabChats } from '../utils/firebase'
import { useAuthStore } from './auth'

export const useChatStore = defineStore('chat', {
  state: () => ({
    chats: [],
    currentChat: null,
    messages: [],
    friends: [],
    pendingRequests: [],
    isChatOpen: false,
    unreadCount: 0
  }),
  
  actions: {
    async sendMessage(chatId, text, userId) {
      if (!text || !text.trim()) return
      const auth = useAuthStore()
      const uid = userId || auth.user?.uid
      
      if (!chatId) {
        console.error('发送消息失败: chatId 缺失')
        return
      }
      
      if (!uid) {
        console.error('发送消息失败: 用户未登录')
        return
      }
      
      const message = {
        sender: auth.profile?.displayName || '匿名用户',
        text: text.trim(),
        userId: uid,
        timestamp: new Date().toISOString()
      }
      
      try {
        // 仅发送到Firebase，不要手动push。订阅回调会同步消息
        await sendMessage(chatId, message, uid)
      } catch (error) {
        console.error('发送消息失败:', error)
      }
    },
    
    async sendLabMessage(labId, text, userId) {
      if (!text || !text.trim()) return
      const auth = useAuthStore()
      const uid = userId || auth.user?.uid
      
      if (!labId) {
        console.error('发送实验室消息失败: labId 缺失')
        return
      }
      
      if (!uid) {
        console.error('发送实验室消息失败: 用户未登录')
        return
      }
      
      const message = {
        sender: auth.profile?.displayName || '匿名用户',
        text: text.trim(),
        userId: uid,
        timestamp: new Date().toISOString()
      }
      
      try {
        // 仅发送到Firebase，不要手动push。订阅回调会同步消息
        await addLabChat(labId, message, uid)
      } catch (error) {
        console.error('发送实验室消息失败:', error)
      }
    },
    
    subscribeToChat(chatId) {
      this.currentChat = chatId
      this.messages = []
      
      return subscribeToChat(chatId, (chatData) => {
        if (chatData.messages) {
          const auth = useAuthStore()
          this.messages = chatData.messages.map(msg => ({
            ...msg,
            isOwn: msg.userId === auth.user?.uid
          }))
        }
      })
    },
    
    async initializeChat(labId, user) {
      try {
        if (!labId || !user) {
          console.error('初始化聊天失败: labId 或 user 缺失')
          return
        }
        
        const chatId = `lab-${labId}`
        await initChat(chatId)
        this.currentChat = chatId
      } catch (error) {
        console.error('初始化聊天失败:', error)
      }
    },

    async openChat(chatId) {
      this.currentChat = chatId
      this.isChatOpen = true
      this.unreadCount = 0
      
      // 初始化聊天文档
      await initChat(chatId)
      
      this.subscribeToChat(chatId)
    },
    
    closeChat() {
      this.isChatOpen = false
      this.currentChat = null
      this.messages = []
    },
    
    addFriend(friendId) {
      if (!this.friends.includes(friendId)) {
        this.friends.push(friendId)
      }
    },
    
    removeFriend(friendId) {
      this.friends = this.friends.filter(id => id !== friendId)
    },
    
    sendFriendRequest(userId) {
      if (!this.pendingRequests.includes(userId)) {
        this.pendingRequests.push(userId)
      }
    },
    
    acceptFriendRequest(userId) {
      this.pendingRequests = this.pendingRequests.filter(id => id !== userId)
      this.addFriend(userId)
    },
    
    rejectFriendRequest(userId) {
      this.pendingRequests = this.pendingRequests.filter(id => id !== userId)
    },
    
    incrementUnreadCount() {
      this.unreadCount++
    },
    
    clearUnreadCount() {
      this.unreadCount = 0
    },
    
    createPrivateChat(friendId) {
      const chatId = [this.currentUserId, friendId].sort().join('_')
      
      const existingChat = this.chats.find(chat => chat.id === chatId)
      if (existingChat) {
        this.openChat(chatId)
        return existingChat
      }
      
      const newChat = {
        id: chatId,
        type: 'private',
        participants: [this.currentUserId, friendId],
        createdAt: Date.now(),
        lastMessage: null
      }
      
      this.chats.push(newChat)
      this.openChat(chatId)
      return newChat
    },
    
    createGroupChat(name, participants = []) {
      const chatId = 'group_' + Date.now().toString()
      
      const newChat = {
        id: chatId,
        type: 'group',
        name: name,
        participants: [this.currentUserId, ...participants],
        createdAt: Date.now(),
        lastMessage: null
      }
      
      this.chats.push(newChat)
      this.openChat(chatId)
      return newChat
    }
  }
})