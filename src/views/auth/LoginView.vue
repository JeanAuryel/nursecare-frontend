<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import type { LoginCredentials } from '@/types'
import { Message, Lock, InfoFilled, User, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const loginForm = reactive<LoginCredentials>({
  mailEmploye: '',
  mdpEmploye: '',
})

const loading = ref(false)
const activeTab = ref('login')

// Comptes de test
const testAccounts = [
  {
    role: 'Directeur',
    email: 'test.directeur@nursecare.fr',
    password: 'Test1',
    description: 'Accès complet : gestion des employés, statistiques, facturation',
    color: '#0ea5e9'
  },
  {
    role: 'Secrétaire',
    email: 'test.secretaire@nursecare.fr',
    password: 'Test2',
    description: 'Gestion des patients, RDV, et facturation',
    color: '#10b981'
  },
  {
    role: 'Infirmier',
    email: 'test.infirmier@nursecare.fr',
    password: 'Test3',
    description: 'Consultation des RDV et réalisation des soins',
    color: '#f59e0b'
  }
]

// Copier dans le presse-papiers
const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text)
  ElMessage.success(`${label} copié dans le presse-papiers`)
}

// Remplir le formulaire avec un compte de test
const fillLoginForm = (email: string, password: string) => {
  loginForm.mailEmploye = email
  loginForm.mdpEmploye = password
  activeTab.value = 'login'
  ElMessage.success('Identifiants remplis automatiquement')
}

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
        <el-tabs v-model="activeTab" class="login-tabs">
          <!-- Onglet Connexion -->
          <el-tab-pane label="Connexion" name="login">
            <template #label>
              <span class="flex items-center gap-2">
                <el-icon><Lock /></el-icon>
                Connexion
              </span>
            </template>

            <el-form :model="loginForm" @submit.prevent="handleLogin" label-position="top" size="large" class="mt-4">
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
          </el-tab-pane>

          <!-- Onglet Comptes de test -->
          <el-tab-pane label="Comptes de test" name="test">
            <template #label>
              <span class="flex items-center gap-2">
                <el-icon><InfoFilled /></el-icon>
                Comptes de test
              </span>
            </template>

            <div class="mt-4">
              <el-alert
                title="Comptes de démonstration"
                type="info"
                :closable="false"
                class="mb-4"
              >
                <p class="text-sm">Utilisez ces comptes pour tester l'application selon différents rôles.</p>
              </el-alert>

              <div class="space-y-3">
                <el-card
                  v-for="account in testAccounts"
                  :key="account.role"
                  shadow="hover"
                  class="test-account-card"
                  :style="{ borderLeft: `4px solid ${account.color}` }"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-2">
                        <el-icon :style="{ color: account.color }" size="20"><User /></el-icon>
                        <h3 class="text-lg font-semibold" :style="{ color: account.color }">
                          {{ account.role }}
                        </h3>
                      </div>
                      <p class="text-xs text-gray-500 mb-3">{{ account.description }}</p>

                      <div class="space-y-2">
                        <div class="flex items-center gap-2">
                          <code class="flex-1 bg-gray-100 px-2 py-1 rounded text-sm">{{ account.email }}</code>
                          <el-button
                            size="small"
                            :icon="CopyDocument"
                            @click="copyToClipboard(account.email, 'Email')"
                            text
                          />
                        </div>

                        <div class="flex items-center gap-2">
                          <code class="flex-1 bg-gray-100 px-2 py-1 rounded text-sm">{{ account.password }}</code>
                          <el-button
                            size="small"
                            :icon="CopyDocument"
                            @click="copyToClipboard(account.password, 'Mot de passe')"
                            text
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <el-button
                    type="primary"
                    size="small"
                    class="w-full mt-3"
                    @click="fillLoginForm(account.email, account.password)"
                  >
                    Utiliser ce compte
                  </el-button>
                </el-card>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
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

/* Tabs styling */
.login-tabs {
  margin: -20px -20px 0;
}

:deep(.login-tabs .el-tabs__header) {
  margin: 0;
  background: #f9fafb;
  padding: 16px 20px 0;
  border-radius: 12px 12px 0 0;
}

:deep(.login-tabs .el-tabs__nav-wrap) {
  padding: 0;
}

:deep(.login-tabs .el-tabs__content) {
  padding: 0 20px 20px;
}

:deep(.login-tabs .el-tab-pane) {
  min-height: 300px;
}

/* Test account cards */
.test-account-card {
  transition: all 0.3s;
  border-radius: 8px;
}

.test-account-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

:deep(.test-account-card .el-card__body) {
  padding: 16px;
}

code {
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.space-y-2 > * + * {
  margin-top: 0.5rem;
}

.space-y-3 > * + * {
  margin-top: 0.75rem;
}
</style>
