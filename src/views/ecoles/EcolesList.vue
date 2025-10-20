<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useEcolesStore } from '@/stores'
import { Search, Plus, Edit, Delete, School, Location, Phone, User, Postcard, MapLocation, View, Star, Calendar, Message } from '@element-plus/icons-vue'
import type { IEcole, IEcoleForm, IStagiaire } from '@/types'
import api from '@/services/api'

const ecolesStore = useEcolesStore()

const loading = ref(false)
const searchQuery = ref('')
const dialogVisible = ref(false)
const dialogTitle = ref('Ajouter une école')
const isEditMode = ref(false)
const currentEcoleId = ref<number | null>(null)

// Pour la modale de détails du stagiaire
const stagiaireDialogVisible = ref(false)
const currentStagiaire = ref<IStagiaire | null>(null)
const loadingStagiaire = ref(false)

const ecoleForm = ref<IEcoleForm>({
  nomEcole: '',
  adresseEcole: '',
  villeEcole: '',
  codePostalEcole: '',
  numEcole: '',
  contactReferent: '',
})

const formRules = {
  nomEcole: [
    { required: true, message: "Le nom de l'école est requis", trigger: 'blur' },
    { min: 3, message: 'Le nom doit contenir au moins 3 caractères', trigger: 'blur' },
  ],
  adresseEcole: [
    { required: true, message: "L'adresse est requise", trigger: 'blur' },
  ],
  villeEcole: [
    { required: true, message: 'La ville est requise', trigger: 'blur' },
  ],
  codePostalEcole: [
    { required: true, message: 'Le code postal est requis', trigger: 'blur' },
    { pattern: /^[0-9]{4,5}$/, message: 'Code postal invalide', trigger: 'blur' },
  ],
  numEcole: [
    { required: true, message: 'Le numéro de téléphone est requis', trigger: 'blur' },
    { pattern: /^[0-9+\s()-]+$/, message: 'Format de téléphone invalide', trigger: 'blur' },
  ],
  contactReferent: [
    { required: true, message: 'Le contact référent est requis', trigger: 'blur' },
  ],
}

const formRef = ref()

// Filtered ecoles based on search
const filteredEcoles = computed(() => {
  if (!searchQuery.value) {
    return ecolesStore.ecoles
  }
  return ecolesStore.searchEcoles(searchQuery.value)
})

const openCreateDialog = () => {
  isEditMode.value = false
  dialogTitle.value = 'Ajouter une école'
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (ecole: IEcole) => {
  isEditMode.value = true
  dialogTitle.value = "Modifier l'école"
  currentEcoleId.value = ecole.idEcole!

  ecoleForm.value = {
    nomEcole: ecole.nomEcole,
    adresseEcole: ecole.adresseEcole,
    villeEcole: ecole.villeEcole,
    codePostalEcole: ecole.codePostalEcole,
    numEcole: ecole.numEcole,
    contactReferent: ecole.contactReferent,
  }

  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    loading.value = true
    try {
      if (isEditMode.value && currentEcoleId.value) {
        await ecolesStore.update(currentEcoleId.value, ecoleForm.value)
        ElMessage.success('École modifiée avec succès')
      } else {
        await ecolesStore.create(ecoleForm.value)
        ElMessage.success('École créée avec succès')
      }

      dialogVisible.value = false
      resetForm()
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || 'Une erreur est survenue')
    } finally {
      loading.value = false
    }
  })
}

const handleDelete = async (ecole: IEcole) => {
  ElMessageBox.confirm(
    `Êtes-vous sûr de vouloir supprimer l'école "${ecole.nomEcole}" ?`,
    'Confirmation de suppression',
    {
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        await ecolesStore.delete(ecole.idEcole!)
        ElMessage.success('École supprimée avec succès')
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || 'Erreur lors de la suppression')
      }
    })
    .catch(() => {
      // User cancelled
    })
}

const resetForm = () => {
  ecoleForm.value = {
    nomEcole: '',
    adresseEcole: '',
    villeEcole: '',
    codePostalEcole: '',
    numEcole: '',
    contactReferent: '',
  }
  currentEcoleId.value = null
  formRef.value?.clearValidate()
}

const loadEcoles = async () => {
  loading.value = true
  try {
    await ecolesStore.fetchAll()
  } catch (error) {
    ElMessage.error('Erreur lors du chargement des écoles')
  } finally {
    loading.value = false
  }
}

const openStagiaireDetails = async (stagiaire: IStagiaire) => {
  loadingStagiaire.value = true
  stagiaireDialogVisible.value = true

  try {
    const response = await api.get(`/stagiaires/${stagiaire.idStagiaire}`, {
      params: { detailed: true }
    })
    currentStagiaire.value = response.data
  } catch (error: any) {
    console.error('❌ Erreur détails stagiaire:', error)

    // Si le token est invalide ou expiré
    if (error.response?.status === 401) {
      ElMessage.error('Votre session a expiré. Veuillez vous reconnecter.')
      // Rediriger vers la page de connexion après un court délai
      setTimeout(() => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }, 2000)
    } else {
      ElMessage.error(error.response?.data?.message || 'Erreur lors du chargement des détails du stagiaire')
    }
    stagiaireDialogVisible.value = false
  } finally {
    loadingStagiaire.value = false
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR')
}

onMounted(() => {
  loadEcoles()
})
</script>

<template>
  <div class="ecoles-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Gestion des Écoles Partenaires</h1>
        <p class="page-subtitle">
          {{ ecolesStore.totalEcoles }} école(s) partenaire(s)
        </p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        Ajouter une école
      </el-button>
    </div>

    <!-- Search Bar -->
    <el-card shadow="never" class="search-card">
      <el-input
        v-model="searchQuery"
        placeholder="Rechercher par nom ou adresse..."
        :prefix-icon="Search"
        size="large"
        clearable
      />
    </el-card>

    <!-- Ecoles Grid View -->
    <el-row :gutter="20" v-loading="loading">
      <el-col
        v-for="ecole in filteredEcoles"
        :key="ecole.idEcole"
        :xs="24"
        :sm="12"
        :lg="8"
        class="mb-5"
      >
        <el-card shadow="hover" class="ecole-card">
          <div class="ecole-header">
            <div class="ecole-icon-wrapper">
              <el-icon :size="32" class="ecole-icon">
                <School />
              </el-icon>
            </div>
            <el-dropdown trigger="click">
              <el-button type="text" :icon="Edit" circle />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="openEditDialog(ecole)">
                    <el-icon><Edit /></el-icon>
                    <span>Modifier</span>
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleDelete(ecole)">
                    <el-icon class="text-red-500"><Delete /></el-icon>
                    <span class="text-red-500">Supprimer</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <h3 class="ecole-name">{{ ecole.nomEcole }}</h3>

          <div class="ecole-details">
            <div class="ecole-detail-item">
              <el-icon><Location /></el-icon>
              <span>{{ ecole.adresseEcole }}, {{ ecole.codePostalEcole }} {{ ecole.villeEcole }}</span>
            </div>
            <div class="ecole-detail-item">
              <el-icon><Phone /></el-icon>
              <span>{{ ecole.numEcole }}</span>
            </div>
            <div class="ecole-detail-item">
              <el-icon><User /></el-icon>
              <span>Contact: {{ ecole.contactReferent }}</span>
            </div>
            <div v-if="ecole.stagiaires && ecole.stagiaires.length > 0" class="ecole-stagiaires">
              <div class="stagiaires-title">Stagiaires :</div>
              <ul class="stagiaires-list">
                <li
                  v-for="stagiaire in ecole.stagiaires"
                  :key="stagiaire.idStagiaire"
                  class="stagiaire-item"
                  @click="openStagiaireDetails(stagiaire)"
                >
                  <el-icon class="stagiaire-icon"><User /></el-icon>
                  <span class="stagiaire-name">{{ stagiaire.prenomStagiaire }} {{ stagiaire.nomStagiaire }}</span>
                  <el-icon class="stagiaire-arrow"><View /></el-icon>
                </li>
              </ul>
            </div>
            <div v-else class="ecole-no-stagiaires">
              <el-text type="info" size="small">Aucun stagiaire</el-text>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col v-if="filteredEcoles.length === 0" :span="24">
        <el-empty description="Aucune école trouvée" />
      </el-col>
    </el-row>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="ecoleForm"
        :rules="formRules"
        label-position="top"
        size="large"
      >
        <el-form-item label="Nom de l'école" prop="nomEcole">
          <el-input
            v-model="ecoleForm.nomEcole"
            placeholder="Ex: Institut Provincial des Arts et Métiers"
            :prefix-icon="School"
          />
        </el-form-item>

        <el-form-item label="Adresse" prop="adresseEcole">
          <el-input
            v-model="ecoleForm.adresseEcole"
            placeholder="Rue et numéro"
            :prefix-icon="Location"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="Code postal" prop="codePostalEcole">
              <el-input
                v-model="ecoleForm.codePostalEcole"
                placeholder="1000"
                :prefix-icon="Postcard"
              />
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="Ville" prop="villeEcole">
              <el-input
                v-model="ecoleForm.villeEcole"
                placeholder="Bruxelles"
                :prefix-icon="MapLocation"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Téléphone" prop="numEcole">
          <el-input
            v-model="ecoleForm.numEcole"
            placeholder="+32 123 45 67 89"
            :prefix-icon="Phone"
          />
        </el-form-item>

        <el-form-item label="Contact référent" prop="contactReferent">
          <el-input
            v-model="ecoleForm.contactReferent"
            placeholder="Nom et prénom du responsable"
            :prefix-icon="User"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">Annuler</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ isEditMode ? 'Modifier' : 'Créer' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Modal Détails Stagiaire -->
    <el-dialog
      v-model="stagiaireDialogVisible"
      title="Détails du stagiaire"
      width="700px"
      :close-on-click-modal="false"
    >
      <div v-loading="loadingStagiaire" class="stagiaire-details">
        <template v-if="currentStagiaire">
          <!-- Informations personnelles -->
          <el-card shadow="never" class="detail-section">
            <template #header>
              <div class="section-header">
                <el-icon><User /></el-icon>
                <span>Informations personnelles</span>
              </div>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="Nom">
                {{ currentStagiaire.nomStagiaire }}
              </el-descriptions-item>
              <el-descriptions-item label="Prénom">
                {{ currentStagiaire.prenomStagiaire }}
              </el-descriptions-item>
              <el-descriptions-item label="Email" v-if="currentStagiaire.mailStagiaire">
                {{ currentStagiaire.mailStagiaire }}
              </el-descriptions-item>
              <el-descriptions-item label="Téléphone" v-if="currentStagiaire.numStagiaire">
                {{ currentStagiaire.numStagiaire }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- École et période de stage -->
          <el-card shadow="never" class="detail-section">
            <template #header>
              <div class="section-header">
                <el-icon><School /></el-icon>
                <span>École et période de stage</span>
              </div>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="École" :span="2">
                {{ currentStagiaire.nomEcole }}
              </el-descriptions-item>
              <el-descriptions-item label="Contact référent" :span="2" v-if="currentStagiaire.contactReferent">
                {{ currentStagiaire.contactReferent }}
              </el-descriptions-item>
              <el-descriptions-item label="Début de stage">
                <el-tag v-if="currentStagiaire.dateDebutStage" type="success">
                  {{ formatDate(currentStagiaire.dateDebutStage) }}
                </el-tag>
                <span v-else>-</span>
              </el-descriptions-item>
              <el-descriptions-item label="Fin de stage">
                <el-tag v-if="currentStagiaire.dateFinStage" type="warning">
                  {{ formatDate(currentStagiaire.dateFinStage) }}
                </el-tag>
                <span v-else>-</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- Tuteur -->
          <el-card shadow="never" class="detail-section" v-if="currentStagiaire.tuteur">
            <template #header>
              <div class="section-header">
                <el-icon><User /></el-icon>
                <span>Tuteur</span>
              </div>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="Nom complet">
                {{ currentStagiaire.tuteur.prenomEmploye }} {{ currentStagiaire.tuteur.nomEmploye }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- Notes et appréciations -->
          <el-card shadow="never" class="detail-section">
            <template #header>
              <div class="section-header">
                <el-icon><Star /></el-icon>
                <span>Notes et appréciations ({{ currentStagiaire.notes?.length || 0 }})</span>
              </div>
            </template>
            <div v-if="currentStagiaire.notes && currentStagiaire.notes.length > 0" class="notes-list">
              <div
                v-for="note in currentStagiaire.notes"
                :key="note.idRdv"
                class="note-item"
              >
                <div class="note-header">
                  <div class="note-info">
                    <el-icon><Calendar /></el-icon>
                    <span class="note-date">{{ formatDate(note.dateRdv) }}</span>
                    <el-tag size="small" type="info">{{ note.nomPrestation }}</el-tag>
                  </div>
                  <el-rate
                    v-if="note.noteStagiaire"
                    v-model="note.noteStagiaire"
                    disabled
                    show-score
                    text-color="#ff9900"
                  />
                </div>
                <div v-if="note.commentaireStagiaire" class="note-comment">
                  <el-icon><Message /></el-icon>
                  <span>{{ note.commentaireStagiaire }}</span>
                </div>
                <div v-else class="note-no-comment">
                  <el-text type="info" size="small">Aucun commentaire</el-text>
                </div>
              </div>
            </div>
            <el-empty v-else description="Aucune note pour le moment" :image-size="80" />
          </el-card>
        </template>
      </div>

      <template #footer>
        <el-button @click="stagiaireDialogVisible = false">Fermer</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.ecoles-page {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.search-card {
  margin-bottom: 20px;
  border: none;
}

.ecole-card {
  height: 100%;
  border-radius: 12px;
  transition: all 0.3s;
}

.ecole-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.ecole-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.ecole-icon-wrapper {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  padding: 12px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ecole-icon {
  color: white;
}

.ecole-name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
  min-height: 48px;
}

.ecole-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ecole-detail-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
}

.ecole-detail-item .el-icon {
  color: #f59e0b;
  margin-top: 2px;
  flex-shrink: 0;
}

.ecole-stagiaires {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.stagiaires-title {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 8px;
}

.stagiaires-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stagiaire-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.stagiaire-item:hover {
  background: #f3f4f6;
  transform: translateX(4px);
}

.stagiaire-icon {
  color: #10b981;
  font-size: 16px;
}

.stagiaire-name {
  flex: 1;
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.stagiaire-arrow {
  color: #9ca3af;
  font-size: 14px;
}

.ecole-no-stagiaires {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

/* Styles pour la modale de détails du stagiaire */
.stagiaire-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-section {
  border: none;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #374151;
}

.section-header .el-icon {
  color: #f59e0b;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #f59e0b;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.note-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.note-date {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.note-comment {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
}

.note-comment .el-icon {
  color: #3b82f6;
  margin-top: 2px;
  flex-shrink: 0;
}

.note-no-comment {
  padding: 8px 12px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .page-title {
    font-size: 24px;
  }
}
</style>
