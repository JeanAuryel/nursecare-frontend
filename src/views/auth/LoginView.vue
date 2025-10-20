<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import type { LoginCredentials } from '@/types'
import { Message, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const loginForm = reactive<LoginCredentials>({
  mailEmploye: '',
  mdpEmploye: '',
})

const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  try {
    await authStore.login(loginForm)
    router.push('/')
  } catch (error) {
    console.error('Erreur de connexion:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 px-4">
    <div class="max-w-md w-full">
      <!-- Logo & Title -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">NurseCare</h1>
        <p class="text-primary-100">Gestion de soins infirmiers</p>
      </div>

      <!-- Login Card -->
      <el-card class="shadow-2xl">
        <template #header>
          <div class="text-center">
            <h2 class="text-2xl font-semibold text-gray-800">Connexion</h2>
            <p class="text-gray-500 text-sm mt-1">Accédez à votre espace</p>
          </div>
        </template>

        <el-form :model="loginForm" @submit.prevent="handleLogin" label-position="top" size="large">
          <el-form-item label="Email" required>
            <el-input
              v-model="loginForm.mailEmploye"
              type="email"
              placeholder="votre.email@example.com"
              :prefix-icon="Message"
              clearable
            />
          </el-form-item>

          <el-form-item label="Mot de passe" required>
            <el-input
              v-model="loginForm.mdpEmploye"
              type="password"
              placeholder="••••••••"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-form-item class="mb-0">
            <el-button
              type="primary"
              native-type="submit"
              :loading="loading"
              class="w-full"
              size="large"
            >
              {{ loading ? 'Connexion...' : 'Se connecter' }}
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- Footer -->
      <div class="text-center mt-6">
        <p class="text-primary-100 text-sm">
          © 2025 NurseCare - Tous droits réservés
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-card) {
  border-radius: 12px;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%);
  border: none;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
}
</style>
