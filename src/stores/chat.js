import { defineStore } from 'pinia'
import { sendMessage, subscribeToChat } from '../utils/firebase'

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
    async sendMessage(chatId, text) {
      if (!text.trim()) return
      
      const message = {
        id: Date.now().toString(),
        sender: '当前用户',
        text: text.trim(),
        timestamp: Date.now(),
        isOwn: true
      }
      
      try {
        await sendMessage(chatId, message)
        this.messages.push(message)
      } catch (error) {
        console.error('发送消息失败:', error)
      }
    },
    
    subscribeToChat(chatId) {
      this.currentChat = chatId
      this.messages = []
      
      return subscribeToChat(chatId, (chatData) => {
        if (chatData.messages) {
          this.messages = chatData.messages.map(msg => ({
            ...msg,
            isOwn: msg.sender === '当前用户'
          }))
        }
      })
    },
    
    openChat(chatId) {
      this.currentChat = chatId
      this.isChatOpen = true
      this.subscribeToChat(chatId)
      this.unreadCount = 0
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