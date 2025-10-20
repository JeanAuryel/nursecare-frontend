import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores'
import { RoleEmploye } from '@/types'

// Import des vues (lazy loading)
const Login = () => import('@/views/auth/LoginView.vue')
const DashboardLayout = () => import('@/components/layout/DashboardLayout.vue')
const DirecteurDashboard = () => import('@/views/dashboard/DirecteurDashboard.vue')
const SecretaireDashboard = () => import('@/views/dashboard/SecretaireDashboard.vue')
const InfirmierDashboard = () => import('@/views/dashboard/InfirmierDashboard.vue')

// Modules
const PatientsList = () => import('@/views/patients/PatientsList.vue')
const PrestationsList = () => import('@/views/prestations/PrestationsList.vue')
const RdvList = () => import('@/views/rdv/RdvList.vue')
const EcolesList = () => import('@/views/ecoles/EcolesList.vue')
const FacturationView = () => import('@/views/factures/FacturationView.vue')
const StatistiquesView = () => import('@/views/stats/StatistiquesView.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        redirect: (to) => {
          const authStore = useAuthStore()
          if (authStore.isDirecteur) return { name: 'dashboard-directeur' }
          if (authStore.isSecretaire) return { name: 'dashboard-secretaire' }
          if (authStore.isInfirmier) return { name: 'dashboard-infirmier' }
          return { name: 'login' }
        },
      },
      // Dashboards par rôle
      {
        path: 'directeur',
        name: 'dashboard-directeur',
        component: DirecteurDashboard,
        meta: { requiresAuth: true, roles: [RoleEmploye.DIRECTEUR] },
      },
      {
        path: 'secretaire',
        name: 'dashboard-secretaire',
        component: SecretaireDashboard,
        meta: { requiresAuth: true, roles: [RoleEmploye.SECRETAIRE] },
      },
      {
        path: 'infirmier',
        name: 'dashboard-infirmier',
        component: InfirmierDashboard,
        meta: { requiresAuth: true, roles: [RoleEmploye.INFIRMIER] },
      },
      // Module Patients
      {
        path: 'patients',
        name: 'patients',
        component: PatientsList,
        meta: {
          requiresAuth: true,
          roles: [RoleEmploye.DIRECTEUR, RoleEmploye.SECRETAIRE],
        },
      },
      // Module Prestations (inclut catégories et prestations réalisées)
      {
        path: 'prestations',
        name: 'prestations',
        component: PrestationsList,
        meta: {
          requiresAuth: true,
          roles: [RoleEmploye.DIRECTEUR, RoleEmploye.SECRETAIRE],
        },
      },
      // Module RDV
      {
        path: 'rdv',
        name: 'rdv',
        component: RdvList,
        meta: {
          requiresAuth: true,
          roles: [RoleEmploye.DIRECTEUR, RoleEmploye.SECRETAIRE, RoleEmploye.INFIRMIER],
        },
      },
      // Module Écoles (inclut stagiaires et leurs notes)
      {
        path: 'ecoles',
        name: 'ecoles',
        component: EcolesList,
        meta: {
          requiresAuth: true,
          roles: [RoleEmploye.DIRECTEUR, RoleEmploye.SECRETAIRE],
        },
      },
      // Module Facturation
      {
        path: 'factures',
        name: 'factures',
        component: FacturationView,
        meta: {
          requiresAuth: true,
          roles: [RoleEmploye.DIRECTEUR, RoleEmploye.SECRETAIRE],
        },
      },
      // Module Statistiques
      {
        path: 'statistiques',
        name: 'statistiques',
        component: StatistiquesView,
        meta: {
          requiresAuth: true,
          roles: [RoleEmploye.DIRECTEUR],
        },
      },
    ],
  },
  // Route 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Navigation Guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiredRoles = to.meta.roles as RoleEmploye[] | undefined

  console.log('🧭 Navigation:', { from: from.path, to: to.path, isAuthenticated: authStore.isAuthenticated })

  // Initialiser l'auth depuis localStorage
  if (!authStore.isAuthenticated) {
    console.log('🔄 Init auth depuis localStorage')
    authStore.initAuth()
    console.log('✅ Auth initialisée:', { isAuthenticated: authStore.isAuthenticated, user: authStore.user })
  }

  // Si la route nécessite l'authentification
  if (requiresAuth && !authStore.isAuthenticated) {
    console.log('❌ Route protégée mais non authentifié -> redirect login')
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // Si déjà connecté et tente d'accéder à la page login
  if (to.name === 'login' && authStore.isAuthenticated) {
    console.log('✅ Déjà connecté, redirect dashboard')
    next({ name: 'dashboard' })
    return
  }

  // Vérifier les rôles requis
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = authStore.hasRole(requiredRoles)
    if (!hasRole) {
      console.log('❌ Rôle insuffisant, redirect dashboard')
      // Rediriger vers le dashboard approprié
      next({ name: 'dashboard' })
      return
    }
  }

  console.log('✅ Navigation autorisée vers', to.path)
  next()
})

export default router
