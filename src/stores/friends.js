import { defineStore } from 'pinia'
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  onSnapshot,
  query,
  collection,
  where,
  getDocs
} from 'firebase/firestore'
import { db } from '../utils/firebase'

export const useFriendsStore = defineStore('friends', {
  state: () => ({
    friends: [],
    friendRequests: [],
    sentRequests: [],
    isLoading: false,
    searchResults: [],
    currentUserId: null
  }),
  
  getters: {
    friendsCount: (state) => state.friends.length,
    pendingRequestsCount: (state) => state.friendRequests.length,
    isFriend: (state) => (userId) => state.friends.some(friend => friend.uid === userId),
    hasSentRequest: (state) => (userId) => state.sentRequests.some(request => request.uid === userId),
    hasPendingRequest: (state) => (userId) => state.friendRequests.some(request => request.uid === userId)
  },
  
  actions: {
    // 初始化好友系统
    async initializeFriends(userId) {
      if (!userId) return
      
      this.currentUserId = userId
      this.isLoading = true
      
      try {
        // 监听好友列表变化
        const userDocRef = doc(db, 'users', userId)
        const unsubscribe = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data()
            this.friends = data.friends || []
            this.friendRequests = data.friendRequests || []
            this.sentRequests = data.sentRequests || []
          }
        })
        
        return unsubscribe
      } catch (error) {
        console.error('初始化好友系统失败:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 搜索用户
    async searchUsers(query) {
      if (!query || query.length < 2) {
        this.searchResults = []
        return
      }
      
      this.isLoading = true
      
      try {
        const usersRef = collection(db, 'users')
        const q = query(usersRef, where('displayName', '>=', query), where('displayName', '<=', query + '\uf8ff'))
        const querySnapshot = await getDocs(q)
        
        this.searchResults = querySnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })).filter(user => user.uid !== this.currentUserId)
      } catch (error) {
        console.error('搜索用户失败:', error)
        this.searchResults = []
      } finally {
        this.isLoading = false
      }
    },
    
    // 发送好友请求
    async sendFriendRequest(targetUserId, currentUser = null, userProfile = null) {
      if (!targetUserId || !this.currentUserId) return
      
      try {
        const currentUserRef = doc(db, 'users', this.currentUserId)
        const targetUserRef = doc(db, 'users', targetUserId)
        
        // 获取用户信息
        const displayName = userProfile?.displayName || currentUser?.displayName || '用户'
        const avatar = userProfile?.avatar || null
        
        // 添加到目标用户的待处理请求
        await updateDoc(targetUserRef, {
          friendRequests: arrayUnion({
            uid: this.currentUserId,
            displayName: displayName,
            avatar: avatar,
            timestamp: new Date().toISOString()
          })
        })
        
        // 添加到当前用户的已发送请求
        await updateDoc(currentUserRef, {
          sentRequests: arrayUnion({
            uid: targetUserId,
            timestamp: new Date().toISOString()
          })
        })
        
        return true
      } catch (error) {
        console.error('发送好友请求失败:', error)
        throw error
      }
    },
    
    // 接受好友请求
    async acceptFriendRequest(requesterId, currentUser = null, userProfile = null) {
      if (!requesterId || !this.currentUserId) return
      
      try {
        const currentUserRef = doc(db, 'users', this.currentUserId)
        const requesterRef = doc(db, 'users', requesterId)
        
        // 获取请求者信息
        const requesterDoc = await getDoc(requesterRef)
        const requesterData = requesterDoc.data()
        
        // 获取当前用户信息
        const displayName = userProfile?.displayName || currentUser?.displayName || '用户'
        const avatar = userProfile?.avatar || null
        
        // 双方都添加到好友列表
        await updateDoc(currentUserRef, {
          friends: arrayUnion({
            uid: requesterId,
            displayName: requesterData.displayName,
            avatar: requesterData.avatar,
            addedAt: new Date().toISOString()
          }),
          friendRequests: arrayRemove(this.friendRequests.find(req => req.uid === requesterId))
        })
        
        await updateDoc(requesterRef, {
          friends: arrayUnion({
            uid: this.currentUserId,
            displayName: displayName,
            avatar: avatar,
            addedAt: new Date().toISOString()
          }),
          sentRequests: arrayRemove({ uid: this.currentUserId })
        })
        
        return true
      } catch (error) {
        console.error('接受好友请求失败:', error)
        throw error
      }
    },
    
    // 拒绝好友请求
    async rejectFriendRequest(requesterId) {
      if (!requesterId || !this.currentUserId) return
      
      try {
        const currentUserRef = doc(db, 'users', this.currentUserId)
        const requesterRef = doc(db, 'users', requesterId)
        
        // 从当前用户的待处理请求中移除
        await updateDoc(currentUserRef, {
          friendRequests: arrayRemove(this.friendRequests.find(req => req.uid === requesterId))
        })
        
        // 从请求者的已发送请求中移除
        await updateDoc(requesterRef, {
          sentRequests: arrayRemove({ uid: this.currentUserId })
        })
        
        return true
      } catch (error) {
        console.error('拒绝好友请求失败:', error)
        throw error
      }
    },
    
    // 删除好友
    async removeFriend(friendId) {
      if (!friendId || !this.currentUserId) return
      
      try {
        const currentUserRef = doc(db, 'users', this.currentUserId)
        const friendRef = doc(db, 'users', friendId)
        
        // 双方都从好友列表中移除
        await updateDoc(currentUserRef, {
          friends: arrayRemove(this.friends.find(friend => friend.uid === friendId))
        })
        
        await updateDoc(friendRef, {
          friends: arrayRemove({ uid: this.currentUserId })
        })
        
        return true
      } catch (error) {
        console.error('删除好友失败:', error)
        throw error
      }
    },
    
    // 取消发送的好友请求
    async cancelSentRequest(targetUserId) {
      if (!targetUserId || !this.currentUserId) return
      
      try {
        const currentUserRef = doc(db, 'users', this.currentUserId)
        const targetUserRef = doc(db, 'users', targetUserId)
        
        // 从当前用户的已发送请求中移除
        await updateDoc(currentUserRef, {
          sentRequests: arrayRemove({ uid: targetUserId })
        })
        
        // 从目标用户的待处理请求中移除
        const targetRequest = this.friendRequests.find(req => req.uid === this.currentUserId)
        if (targetRequest) {
          await updateDoc(targetUserRef, {
            friendRequests: arrayRemove(targetRequest)
          })
        }
        
        return true
      } catch (error) {
        console.error('取消好友请求失败:', error)
        throw error
      }
    },
    
    // 清理状态
    clearState() {
      this.friends = []
      this.friendRequests = []
      this.sentRequests = []
      this.searchResults = []
    }
  }
})