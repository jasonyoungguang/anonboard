import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/member/:id',
      name: 'member-detail',
      component: () => import('@/views/MemberDetail.vue')
    },
    {
      path: '/submit-story',
      name: 'submit-story',
      component: () => import('@/views/StorySubmit.vue')
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/views/admin/AdminLogin.vue')
    },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: () => import('@/views/admin/Dashboard.vue')
    }
  ]
})

export default router
