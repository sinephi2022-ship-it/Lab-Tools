import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/lobby'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue')
    },
    {
      path: '/lobby',
      name: 'Lobby',
      component: () => import('@/views/LobbyView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/lab/:id',
      name: 'Lab',
      component: () => import('@/views/LabView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.user) {
    next('/login')
  } else if (to.path === '/login' && authStore.user) {
    next('/lobby')
  } else {
    next()
  }
})

export default router