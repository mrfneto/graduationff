import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'Home' }
    },
    {
      path: '/request/create',
      name: 'request-create',
      component: () => import('../views/RequestFormView.vue'),
      meta: { title: 'Novo Pedidos' }
    },
    {
      path: '/request/:id/update',
      name: 'request-update',
      component: () => import('../views/RequestFormView.vue'),
      meta: { title: 'Editar Pedidos' }
    },
    {
      path: '/request/:code/success',
      name: 'request-success',
      component: () => import('../views/RequestSuccessView.vue'),
      meta: { title: 'Confirmação' }
    },
    {
      path: '/request/:id/result',
      name: 'request-result',
      component: () => import('../views/RequestResultView.vue'),
      meta: { title: 'Confirmação' }
    },

    {
      path: '/requests',
      name: 'requests',
      component: () => import('../views/RequestListView.vue'),
      meta: { requiresAuth: true, title: 'Pedidos' }
    },
    {
      path: '/request/:id/details',
      name: 'request-datails',
      component: () => import('../views/RequestDatailsView.vue'),
      meta: { requiresAuth: true, title: 'Detalhes do pedido' }
    },
    {
      path: '/semesters',
      name: 'semesters',
      component: () => import('../views/SemesterListView.vue'),
      meta: { requiresAuth: true, title: 'Semestres' }
    },

    {
      path: '/semester',
      name: 'semester-create',
      component: () => import('../views/SemesterFormView.vue'),
      meta: { requiresAuth: true, title: 'Semestres' }
    },
    {
      path: '/semester/:id',
      name: 'semester-update',
      component: () => import('../views/SemesterFormView.vue'),
      meta: { requiresAuth: true, title: 'Semestres' }
    },
    {
      path: '/coordinators',
      name: 'coordinators',
      component: () => import('../views/CoordinatorListView.vue'),
      meta: { requiresAuth: true, title: 'Coordenadores' }
    },
    {
      path: '/coordinator',
      name: 'coordinator-create',
      component: () => import('../views/CoordinatorFormView.vue'),
      meta: { requiresAuth: true, title: 'Coordenadores' }
    },
    {
      path: '/coordinator/:id',
      name: 'coordinator-update',
      component: () => import('../views/CoordinatorFormView.vue'),
      meta: { requiresAuth: true, title: 'Coordenadores' }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false, title: 'Login' }
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  document.title = `${to.meta.title} - FF`

  const authStore = useAuthStore()

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest)

  const isAutenticated = await authStore.getCurrentUser()

  if (requiresAuth && !isAutenticated) next({ name: 'login' })
  else if (requiresGuest && isAutenticated) next({ name: 'request' })
  else next()
})

export default router
