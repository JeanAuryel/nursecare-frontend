<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useStagiairesStore, useEcolesStore } from '@/stores'
import { Search, Plus, Edit, Delete, User, Phone, Message as MessageIcon, School } from '@element-plus/icons-vue'
import type { IStagiaire, IStagiaireForm } from '@/types'

const stagiairesStore = useStagiairesStore()
const ecolesStore = useEcolesStore()

const loading = ref(false)
const searchQuery = ref('')
const dialogVisible = ref(false)
const dialogTitle = ref('Ajouter un stagiaire')
const isEditMode = ref(false)
const currentStagiaireId = ref<number | null>(null)

const stagiaireForm = ref<IStagiaireForm>({
  nomStagiaire: '',
  prenomStagiaire: '',
  mailStagiaire: '',
  numStagiaire: '',
  idEcole: 0,
})

const formRules = {
  nomStagiaire: [
    { required: true, message: 'Le nom est requis', trigger: 'blur' },
    { min: 2, message: 'Le nom doit contenir au moins 2 caractères', trigger: 'blur' },
  ],
  prenomStagiaire: [
    { required: true, message: 'Le prénom est requis', trigger: 'blur' },
    { min: 2, message: 'Le prénom doit contenir au moins 2 caractères', trigger: 'blur' },
  ],
  mailStagiaire: [
    { required: true, message: "L'email est requis", trigger: 'blur' },
    { type: 'email', message: 'Format email invalide', trigger: 'blur' },
  ],
  numStagiaire: [
    { required: true, message: 'Le numéro de téléphone est requis', trigger: 'blur' },
    { pattern: /^[0-9+\s()-]+$/, message: 'Format de téléphone invalide', trigger: 'blur' },
  ],
  idEcole: [
    { required: true, message: "L'école est requise", trigger: 'change', type: 'number' },
  ],
}

const formRef = ref()

// Filtered stagiaires based on search
const filteredStagiaires = computed(() => {
  if (!searchQuery.value) {
    return stagiairesStore.stagiaires
  }
  return stagiairesStore.searchStagiaires(searchQuery.value)
})

const openCreateDialog = () => {
  isEditMode.value = false
  dialogTitle.value = 'Ajouter un stagiaire'
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (stagiaire: IStagiaire) => {
  isEditMode.value = true
  dialogTitle.value = 'Modifier le stagiaire'
  currentStagiaireId.value = stagiaire.idStagiaire!

  stagiaireForm.value = {
    nomStagiaire: stagiaire.nomStagiaire,
    prenomStagiaire: stagiaire.prenomStagiaire,
    mailStagiaire: stagiaire.mailStagiaire,
    numStagiaire: stagiaire.numStagiaire,
    idEcole: stagiaire.idEcole,
  }

  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    loading.value = true
    try {
      if (isEditMode.value && currentStagiaireId.value) {
        await stagiairesStore.update(currentStagiaireId.value, stagiaireForm.value)
        ElMessage.success('Stagiaire modifié avec succès')
      } else {
        await stagiairesStore.create(stagiaireForm.value)
        ElMessage.success('Stagiaire créé avec succès')
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

const handleDelete = async (stagiaire: IStagiaire) => {
  ElMessageBox.confirm(
    `Êtes-vous sûr de vouloir supprimer le stagiaire ${stagiaire.prenomStagiaire} ${stagiaire.nomStagiaire} ?`,
    'Confirmation de suppression',
    {
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        await stagiairesStore.delete(stagiaire.idStagiaire!)
        ElMessage.success('Stagiaire supprimé avec succès')
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || 'Erreur lors de la suppression')
      }
    })
    .catch(() => {
      // User cancelled
    })
}

const resetForm = () => {
  stagiaireForm.value = {
    nomStagiaire: '',
    prenomStagiaire: '',
    mailStagiaire: '',
    numStagiaire: '',
    idEcole: 0,
  }
  currentStagiaireId.value = null
  formRef.value?.clearValidate()
}

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([
      stagiairesStore.fetchAll(),
      ecolesStore.fetchAll(),
    ])
  } catch (error) {
    ElMessage.error('Erreur lors du chargement des données')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="stagiaires-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Gestion des Stagiaires</h1>
        <p class="page-subtitle">
          {{ stagiairesStore.totalStagiaires }} stagiaire(s) enregistré(s)
        </p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        Ajouter un stagiaire
      </el-button>
    </div>

    <!-- Search Bar -->
    <el-card shadow="never" class="search-card">
      <el-input
        v-model="searchQuery"
        placeholder="Rechercher par nom, prénom, email ou école..."
        :prefix-icon="Search"
        size="large"
        clearable
      />
    </el-card>

    <!-- Stagiaires Table -->
    <el-card shadow="never" v-loading="loading">
      <el-table
        :data="filteredStagiaires"
        style="width: 100%"
        stripe
        :default-sort="{ prop: 'nomStagiaire', order: 'ascending' }"
      >
        <el-table-column type="index" label="#" width="60" />

        <el-table-column label="Stagiaire" min-width="200" sortable>
          <template #default="{ row }">
            <div class="stagiaire-cell">
              <el-avatar :size="40" class="stagiaire-avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="stagiaire-info">
                <div class="stagiaire-name">
                  {{ row.prenomStagiaire }} {{ row.nomStagiaire }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Contact" min-width="250">
          <template #default="{ row }">
            <div class="contact-cell">
              <div class="contact-item">
                <el-icon><Phone /></el-icon>
                <span>{{ row.numStagiaire }}</span>
              </div>
              <div class="contact-item">
                <el-icon><MessageIcon /></el-icon>
                <span>{{ row.mailStagiaire }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="École" min-width="200">
          <template #default="{ row }">
            <div class="ecole-cell">
              <el-icon><School /></el-icon>
              <span>{{ row.ecole?.nomEcole || 'N/A' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Actions" width="150" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                type="primary"
                :icon="Edit"
                size="small"
                link
                @click="openEditDialog(row)"
              >
                Modifier
              </el-button>
              <el-button
                type="danger"
                :icon="Delete"
                size="small"
                link
                @click="handleDelete(row)"
              >
                Supprimer
              </el-button>
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="Aucun stagiaire trouvé" />
        </template>
      </el-table>
    </el-card>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="stagiaireForm"
        :rules="formRules"
        label-position="top"
        size="large"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Nom" prop="nomStagiaire">
              <el-input
                v-model="stagiaireForm.nomStagiaire"
                placeholder="Nom du stagiaire"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="Prénom" prop="prenomStagiaire">
              <el-input
                v-model="stagiaireForm.prenomStagiaire"
                placeholder="Prénom du stagiaire"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="École" prop="idEcole">
          <el-select
            v-model="stagiaireForm.idEcole"
            placeholder="Sélectionner une école"
            class="w-full"
            :prefix-icon="School"
          >
            <el-option
              v-for="ecole in ecolesStore.ecoles"
              :key="ecole.idEcole"
              :label="ecole.nomEcole"
              :value="ecole.idEcole"
            />
          </el-select>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Téléphone" prop="numStagiaire">
              <el-input
                v-model="stagiaireForm.numStagiaire"
                placeholder="+32 123 45 67 89"
                :prefix-icon="Phone"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="Email" prop="mailStagiaire">
              <el-input
                v-model="stagiaireForm.mailStagiaire"
                type="email"
                placeholder="stagiaire@example.com"
                :prefix-icon="MessageIcon"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">Annuler</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ isEditMode ? 'Modifier' : 'Créer' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.stagiaires-page {
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

.stagiaire-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stagiaire-avatar {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.stagiaire-info {
  display: flex;
  flex-direction: column;
}

.stagiaire-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 15px;
}

.contact-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
}

.contact-item .el-icon {
  color: #8b5cf6;
}

.ecole-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
}

.ecole-cell .el-icon {
  color: #8b5cf6;
}

.action-buttons {
  display: flex;
  gap: 8px;
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
