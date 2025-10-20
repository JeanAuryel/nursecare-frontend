<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores'
import {
  Menu as IconMenu,
  User,
  Document,
  Calendar,
  Setting,
  TrendCharts,
  UserFilled,
  School,
  Tickets,
  SwitchButton,
  OfficeBuilding,
  Grid,
  Money,
  Check,
  DataAnalysis
} from '@element-plus/icons-vue'
import { RoleEmploye } from '@/types'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isCollapse = ref(false)

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

// Menu items based on role
const menuItems = computed(() => {
  const role = authStore.userRole

  const baseItems = [
    {
      path: '/',
      icon: TrendCharts,
      title: 'Tableau de bord',
      roles: [RoleEmploye.DIRECTEUR, RoleEmploye.SECRETAIRE, RoleEmploye.INFIRMIER]
    }
  ]

  const allItems = [
    ...baseItems,
    {
      path: '/patients',
      icon: UserFilled,
      title: 'Patients',
      roles: [RoleEmploye.DIRECTEUR, RoleEmploye.SECRETAIRE]
    },
    {
      path: '/rdv',
      icon: Calendar,
      title: 'Rendez-vous',
      roles: [RoleEmploye.DIRECTEUR, RoleEmploye.SECRETAIRE, RoleEmploye.INFIRMIER]
    },
    {
      path: '/prestations',
      icon: Document,
      title: 'Prestations',
      roles: [RoleEmploye.DIRECTEUR, RoleEmploye.SECRETAIRE]
    },
    {
      path: '/ecoles',
      icon: School,
      title: 'Écoles & Stagiaires',
      roles: [RoleEmploye.DIRECTEUR, RoleEmploye.SECRETAIRE]
    },
    {
      path: '/factures',
      icon: Money,
      title: 'Facturation',
      roles: [RoleEmploye.DIRECTEUR, RoleEmploye.SECRETAIRE]
    },
    {
      path: '/statistiques',
      icon: DataAnalysis,
      title: 'Statistiques',
      roles: [RoleEmploye.DIRECTEUR]
    }
  ]

  return allItems.filter(item =>
    item.roles.includes(role as RoleEmploye)
  )
})

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/' ||
           route.path.includes('/directeur') ||
           route.path.includes('/secretaire') ||
           route.path.includes('/infirmier')
  }
  return route.path.startsWith(path)
}

const getRoleLabel = (role: RoleEmploye | null) => {
  switch (role) {
    case RoleEmploye.DIRECTEUR:
      return 'Directeur'
    case RoleEmploye.SECRETAIRE:
      return 'Secrétaire'
    case RoleEmploye.INFIRMIER:
      return 'Infirmier'
    default:
      return ''
  }
}
</script>

<template>
  <el-container class="min-h-screen">
    <!-- Sidebar -->
    <el-aside
      :width="isCollapse ? '64px' : '240px'"
      class="sidebar-container"
    >
      <div class="sidebar-header">
        <h1 v-if="!isCollapse" class="logo-text">NurseCare</h1>
        <h1 v-else class="logo-text-small">NC</h1>
      </div>

      <el-menu
        :default-active="route.path"
        :collapse="isCollapse"
        :unique-opened="true"
        router
        class="sidebar-menu"
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.path"
          :index="item.path"
          :class="{ 'is-active': isActive(item.path) }"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>

      <!-- Collapse Toggle Button -->
      <div class="collapse-toggle">
        <el-button
          link
          @click="isCollapse = !isCollapse"
          class="w-full"
        >
          <el-icon size="20">
            <IconMenu />
          </el-icon>
        </el-button>
      </div>
    </el-aside>

    <!-- Main Content Area -->
    <el-container>
      <!-- Header -->
      <el-header class="header-container">
        <div class="header-content">
          <div class="breadcrumb-section">
            <h2 class="page-title">{{ route.meta.title || 'Tableau de bord' }}</h2>
          </div>

          <div class="user-section">
            <div class="user-info">
              <span class="user-name">{{ authStore.fullName }}</span>
              <span class="user-role">{{ getRoleLabel(authStore.userRole) }}</span>
            </div>

            <el-dropdown trigger="click">
              <el-avatar
                :size="40"
                class="cursor-pointer user-avatar"
              >
                <el-icon><User /></el-icon>
              </el-avatar>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item disabled>
                    <div class="dropdown-user-info">
                      <div class="font-semibold">{{ authStore.fullName }}</div>
                      <div class="text-xs text-gray-500">{{ getRoleLabel(authStore.userRole) }}</div>
                    </div>
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">
                    <el-icon><SwitchButton /></el-icon>
                    <span>Déconnexion</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>

      <!-- Main Content -->
      <el-main class="main-container">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.sidebar-container {
  background: linear-gradient(180deg, #0369a1 0%, #075985 100%);
  color: white;
  transition: width 0.3s;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 20px;
}

.logo-text {
  font-size: 24px;
  font-weight: bold;
  color: white;
  margin: 0;
  white-space: nowrap;
}

.logo-text-small {
  font-size: 24px;
  font-weight: bold;
  color: white;
  margin: 0;
}

.sidebar-menu {
  border: none;
  background: transparent;
  flex: 1;
  padding-top: 20px;
}

:deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.8);
  margin: 4px 12px;
  border-radius: 8px;
  transition: all 0.3s;
}

:deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.15) !important;
  color: white;
}

:deep(.el-menu-item.is-active) {
  background-color: rgba(255, 255, 255, 0.2) !important;
  color: white;
  font-weight: 600;
}

.collapse-toggle {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.collapse-toggle .el-button {
  color: rgba(255, 255, 255, 0.8);
}

.collapse-toggle .el-button:hover {
  color: white;
}

.header-container {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.header-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 8px;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.user-role {
  font-size: 12px;
  color: #6b7280;
}

.user-avatar {
  background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%);
  cursor: pointer;
  transition: transform 0.2s;
}

.user-avatar:hover {
  transform: scale(1.05);
}

.dropdown-user-info {
  padding: 4px 0;
}

.main-container {
  background: #f9fafb;
  padding: 24px;
  overflow-y: auto;
}

/* Responsive */
@media (max-width: 768px) {
  .user-info {
    display: none;
  }

  .main-container {
    padding: 16px;
  }
}

/* Menu collapse animation */
:deep(.el-menu--collapse) {
  width: 64px;
}

:deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
}

:deep(.el-menu-item .el-icon) {
  font-size: 18px;
}
</style>
