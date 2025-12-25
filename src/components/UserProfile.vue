<template>
  <div class="user-profile" v-if="showProfile">
    <div class="profile-overlay" @click="closeProfile"></div>
    <div class="profile-modal">
      <div class="profile-header">
        <h2>{{ t('auth.profile') }}</h2>
        <button @click="closeProfile" class="close-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      
      <div class="profile-content">
        <div class="avatar-section">
          <div class="avatar-container">
            <img v-if="profile.avatar" :src="profile.avatar" :alt="profile.displayName" class="avatar">
            <div v-else class="avatar-placeholder">{{ (profile?.displayName || '用户').charAt(0) }}</div>
            <button @click="selectAvatar" class="avatar-upload">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
          </div>
          <input 
            type="file" 
            ref="avatarInput"
            @change="handleAvatarChange"
            accept="image/*"
            style="display: none"
          >
        </div>
        
        <div class="form-section">
          <div class="form-group">
            <label>{{ t('auth.displayName') }}</label>
            <input v-model="profile.displayName" @blur="saveProfile" type="text" :placeholder="t('auth.displayName')">
          </div>
          
          <div class="form-group">
            <label>{{ t('auth.email') }}</label>
            <input v-model="profile.email" @blur="saveProfile" type="email" :placeholder="t('auth.email')">
          </div>
          
          <div class="form-group">
            <label>{{ t('auth.bio') }}</label>
            <textarea v-model="profile.bio" @blur="saveProfile" :placeholder="t('auth.bio')" rows="3"></textarea>
          </div>
          
          <div class="form-group">
            <label>{{ t('auth.language') }}</label>
            <select v-model="selectedLanguage" @change="changeLanguage">
              <option value="zh-CN">中文</option>
              <option value="en-US">English</option>
              <option value="ja-JP">日本語</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>{{ t('auth.theme') }}</label>
            <div class="theme-options">
              <button 
                @click="changeTheme('light')" 
                class="theme-btn"
                :class="{ active: selectedTheme === 'light' }"
              >
                ☀️ 浅色
              </button>
              <button 
                @click="changeTheme('dark')" 
                class="theme-btn"
                :class="{ active: selectedTheme === 'dark' }"
              >
                🌙 深色
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="profile-footer">
        <button @click="logout" class="logout-btn">
          {{ t('auth.logout') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { t } from '../utils/i18n'

export default {
  name: 'UserProfile',
  props: {
    showProfile: Boolean
  },
  emits: ['close'],
  setup(props, { emit }) {
    const authStore = useAuthStore()
    const avatarInput = ref(null)
    
    const profile = computed(() => authStore.profile)
    const selectedLanguage = computed({
      get: () => authStore.language,
      set: (value) => authStore.setLanguage(value)
    })
    const selectedTheme = computed({
      get: () => authStore.theme,
      set: (value) => authStore.setTheme(value)
    })
    
    const closeProfile = () => {
      emit('close')
    }
    
    const saveProfile = () => {
      authStore.updateProfile(profile.value)
    }
    
    const selectAvatar = () => {
      avatarInput.value.click()
    }
    
    const handleAvatarChange = (event) => {
      const file = event.target.files[0]
      if (file) {
        authStore.uploadAvatar(file)
      }
    }
    
    const changeLanguage = () => {
      authStore.setLanguage(selectedLanguage.value)
    }
    
    const changeTheme = (theme) => {
      authStore.setTheme(theme)
    }
    
    const logout = () => {
      authStore.logout()
      closeProfile()
    }
    
    return {
      profile,
      selectedLanguage,
      selectedTheme,
      avatarInput,
      closeProfile,
      saveProfile,
      selectAvatar,
      handleAvatarChange,
      changeLanguage,
      changeTheme,
      logout,
      t
    }
  }
}
</script>

<style scoped>
.user-profile {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.profile-modal {
  background: white;
  border-radius: 16px;
  width: 500px;
  max-width: 90%;
  max-height: 80vh;
  overflow: hidden;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
}

.profile-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

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

.close-btn:hover {
  background: var(--background-color);
  color: var(--text-primary);
}

.profile-content {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.avatar-container {
  position: relative;
}

.avatar, .avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  background: var(--secondary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 600;
}

.avatar-upload {
  position: absolute;
  bottom: 0;
  right: 0;
  background: var(--primary-color);
  color: white;
  border: 2px solid white;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow);
}

.avatar-upload:hover {
  background: #45a049;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group input,
.form-group textarea,
.form-group select {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.theme-options {
  display: flex;
  gap: 8px;
}

.theme-btn {
  flex: 1;
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: white;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-btn:hover {
  background: var(--background-color);
}

.theme-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.profile-footer {
  padding: 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
}

.logout-btn {
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
}

.logout-btn:hover {
  background: #d32f2f;
}
</style>