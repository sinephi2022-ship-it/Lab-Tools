<template>
  <div class="page-container">
    <router-view />
    
    <!-- 全局 Timer 通知容器 -->
    <div id="timer-notifications"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  authStore.initAuth()
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
}
</style>