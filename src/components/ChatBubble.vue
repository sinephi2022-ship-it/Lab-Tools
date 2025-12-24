<template>
  <div class="chat-bubble" @click="$emit('toggle-chat')">
    <div class="bubble-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
    </div>
    <div v-if="hasUnreadMessages" class="notification-dot"></div>
  </div>
</template>

<script>
export default {
  name: 'ChatBubble',
  data() {
    return {
      hasUnreadMessages: true
    }
  },
  emits: ['toggle-chat']
}
</script>

<style scoped>
.chat-bubble {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 60px;
  height: 60px;
  background: var(--secondary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-hover);
  transition: all 0.3s ease;
  z-index: 1000;
}

.chat-bubble:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 12px rgba(0,0,0,0.2);
}

.bubble-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 12px;
  height: 12px;
  background: #FF5252;
  border-radius: 50%;
  border: 2px solid white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>