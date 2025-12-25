<template>
  <div class="friends-system">
    <!-- 好友列表按钮 -->
    <button @click="showFriendsModal = true" class="friends-btn">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
      </svg>
      好友
      <span v-if="friendsStore.pendingRequestsCount > 0" class="notification-badge">
        {{ friendsStore.pendingRequestsCount }}
      </span>
    </button>

    <!-- 好友管理弹窗 -->
    <div v-if="showFriendsModal" class="friends-modal-overlay" @click="closeModal">
      <div class="friends-modal" @click.stop>
        <div class="modal-header">
          <h2>好友系统</h2>
          <button @click="closeModal" class="close-btn">×</button>
        </div>

        <div class="modal-content">
          <!-- 搜索用户 -->
          <div class="search-section">
            <h3>添加好友</h3>
            <div class="search-box">
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="搜索用户名..."
                @input="searchUsers"
              >
              <button v-if="searchQuery" @click="clearSearch" class="clear-btn">✕</button>
            </div>
            
            <!-- 搜索结果 -->
            <div v-if="friendsStore.searchResults.length > 0" class="search-results">
              <div v-for="user in friendsStore.searchResults" :key="user.uid" class="user-item">
                <img v-if="user.avatar" :src="user.avatar" :alt="user.displayName" class="user-avatar">
                <div v-else class="user-avatar-placeholder">{{ (user.displayName || '\u7528\u6237').charAt(0) }}</div>
                <span class="user-name">{{ user.displayName || '\u533f\u540d\u7528\u6237' }}</span>
                <div class="user-actions">
                  <button 
                    v-if="!friendsStore.isFriend(user.uid) && !friendsStore.hasSentRequest(user.uid)"
                    @click="sendFriendRequest(user.uid)"
                    class="add-btn"
                  >
                    添加
                  </button>
                  <span v-else-if="friendsStore.hasSentRequest(user.uid)" class="status-text">已发送</span>
                  <span v-else-if="friendsStore.isFriend(user.uid)" class="status-text">已是好友</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 好友请求 -->
          <div v-if="friendsStore.friendRequests.length > 0" class="requests-section">
            <h3>好友请求 ({{ friendsStore.friendRequests.length }})</h3>
            <div class="requests-list">
              <div v-for="request in friendsStore.friendRequests" :key="request.uid" class="request-item">
                <img v-if="request.avatar" :src="request.avatar" :alt="request.displayName" class="user-avatar">
                <div v-else class="user-avatar-placeholder">{{ (request.displayName || '\u7528\u6237').charAt(0) }}</div>
                <div class="request-info">
                  <span class="user-name">{{ request.displayName || '\u533f\u540d\u7528\u6237' }}</span>
                  <span class="request-time">{{ formatTime(request.timestamp) }}</span>
                </div>
                <div class="request-actions">
                  <button @click="acceptRequest(request.uid)" class="accept-btn">接受</button>
                  <button @click="rejectRequest(request.uid)" class="reject-btn">拒绝</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 好友列表 -->
          <div class="friends-section">
            <h3>我的好友 ({{ friendsStore.friendsCount }})</h3>
            <div v-if="friendsStore.friends.length === 0" class="empty-state">
              暂无好友，快去添加吧！
            </div>
            <div v-else class="friends-list">
              <div v-for="friend in friendsStore.friends" :key="friend.uid" class="friend-item">
                <img v-if="friend.avatar" :src="friend.avatar" :alt="friend.displayName" class="user-avatar">
                <div v-else class="user-avatar-placeholder">{{ (friend.displayName || '\u7528\u6237').charAt(0) }}</div>
                <div class="friend-info">
                  <span class="user-name">{{ friend.displayName || '\u533f\u540d\u7528\u6237' }}</span>
                  <span class="friend-since">{{ formatTime(friend.addedAt) }} 添加</span>
                </div>
                <button @click="removeFriend(friend.uid)" class="remove-btn">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useFriendsStore } from '../stores/friends'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'FriendsSystem',
  setup() {
    const friendsStore = useFriendsStore()
    const authStore = useAuthStore()
    
    const showFriendsModal = ref(false)
    const searchQuery = ref('')
    
    // 搜索用户
    const searchUsers = () => {
      friendsStore.searchUsers(searchQuery.value)
    }
    
    // 清除搜索
    const clearSearch = () => {
      searchQuery.value = ''
      friendsStore.searchResults = []
    }
    
    // 发送好友请求
    const sendFriendRequest = async (userId) => {
      try {
        // 传递当前用户信息
        await friendsStore.sendFriendRequest(userId, authStore.user, authStore.profile)
        console.log('好友请求已发送')
      } catch (error) {
        console.error('发送好友请求失败:', error)
      }
    }
    
    // 接受好友请求
    const acceptRequest = async (userId) => {
      try {
        await friendsStore.acceptFriendRequest(userId, authStore.user, authStore.profile)
        console.log('已接受好友请求')
      } catch (error) {
        console.error('接受好友请求失败:', error)
      }
    }
    
    // 拒绝好友请求
    const rejectRequest = async (userId) => {
      try {
        await friendsStore.rejectFriendRequest(userId)
        console.log('已拒绝好友请求')
      } catch (error) {
        console.error('拒绝好友请求失败:', error)
      }
    }
    
    // 删除好友
    const removeFriend = async (userId) => {
      if (confirm('确定要删除这个好友吗？')) {
        try {
          await friendsStore.removeFriend(userId)
          console.log('已删除好友')
        } catch (error) {
          console.error('删除好友失败:', error)
        }
      }
    }
    
    // 格式化时间
    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now - date
      
      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
      return `${Math.floor(diff / 86400000)}天前`
    }
    
    // 关闭弹窗
    const closeModal = () => {
      showFriendsModal.value = false
      clearSearch()
    }
    
    onMounted(() => {
      if (authStore.user) {
        friendsStore.initializeFriends(authStore.user.uid)
      }
    })
    
    return {
      friendsStore,
      authStore,
      showFriendsModal,
      searchQuery,
      searchUsers,
      clearSearch,
      sendFriendRequest,
      acceptRequest,
      rejectRequest,
      removeFriend,
      formatTime,
      closeModal
    }
  }
}
</script>

<style scoped>
.friends-system {
  position: relative;
}

.friends-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.friends-btn:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.notification-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.friends-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.friends-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
}

.modal-content {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.search-section, .requests-section, .friends-section {
  margin-bottom: 30px;
}

.search-section h3, .requests-section h3, .friends-section h3 {
  margin: 0 0 15px 0;
  color: var(--text-primary);
}

.search-box {
  position: relative;
  margin-bottom: 15px;
}

.search-box input {
  width: 100%;
  padding: 10px 40px 10px 15px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
}

.clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
}

.user-item, .request-item, .friend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 8px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.user-name {
  flex: 1;
  font-weight: 500;
}

.user-actions {
  display: flex;
  gap: 8px;
}

.add-btn, .accept-btn {
  padding: 6px 12px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.reject-btn, .remove-btn {
  padding: 6px 12px;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.status-text {
  color: var(--text-secondary);
  font-size: 12px;
}

.request-info, .friend-info {
  flex: 1;
}

.request-time, .friend-since {
  display: block;
  color: var(--text-secondary);
  font-size: 12px;
}

.request-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 20px;
}
</style>