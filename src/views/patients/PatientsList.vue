<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { usePatientsStore } from '@/stores'
import { Search, Plus, Edit, Delete, User, Phone, Location, Message as MessageIcon } from '@element-plus/icons-vue'
import type { IPatient, IPatientForm } from '@/types'

const patientsStore = usePatientsStore()

const loading = ref(false)
const searchQuery = ref('')
const dialogVisible = ref(false)
const dialogTitle = ref('Ajouter un patient')
const isEditMode = ref(false)
const currentPatientId = ref<number | null>(null)

const patientForm = ref<IPatientForm>({
  nomPatient: '',
  prenomPatient: '',
  adressePatient: '',
  numPatient: '',
  mailPatient: '',
})

const formRules = {
  nomPatient: [
    { required: true, message: 'Le nom est requis', trigger: 'blur' },
    { min: 2, message: 'Le nom doit contenir au moins 2 caractères', trigger: 'blur' },
  ],
  prenomPatient: [
    { required: true, message: 'Le prénom est requis', trigger: 'blur' },
    { min: 2, message: 'Le prénom doit contenir au moins 2 caractères', trigger: 'blur' },
  ],
  adressePatient: [
    { required: true, message: "L'adresse est requise", trigger: 'blur' },
  ],
  numPatient: [
    { required: true, message: 'Le numéro de téléphone est requis', trigger: 'blur' },
    { pattern: /^[0-9+\s()-]+$/, message: 'Format de téléphone invalide', trigger: 'blur' },
  ],
  mailPatient: [
    { required: true, message: "L'email est requis", trigger: 'blur' },
    { type: 'email', message: 'Format email invalide', trigger: 'blur' },
  ],
}

const formRef = ref()

// Filtered patients based on search
const filteredPatients = computed(() => {
  if (!searchQuery.value) {
    return patientsStore.patients
  }
  return patientsStore.searchPatients(searchQuery.value)
})

const openCreateDialog = () => {
  isEditMode.value = false
  dialogTitle.value = 'Ajouter un patient'
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (patient: IPatient) => {
  isEditMode.value = true
  dialogTitle.value = 'Modifier le patient'
  currentPatientId.value = patient.idPatient!

  patientForm.value = {
    nomPatient: patient.nomPatient,
    prenomPatient: patient.prenomPatient,
    adressePatient: patient.adressePatient,
    numPatient: patient.numPatient,
    mailPatient: patient.mailPatient,
  }

  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    loading.value = true
    try {
      if (isEditMode.value && currentPatientId.value) {
        await patientsStore.update(currentPatientId.value, patientForm.value)
        ElMessage.success('Patient modifié avec succès')
      } else {
        await patientsStore.create(patientForm.value)
        ElMessage.success('Patient créé avec succès')
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

const handleDelete = async (patient: IPatient) => {
  ElMessageBox.confirm(
    `Êtes-vous sûr de vouloir supprimer le patient ${patient.prenomPatient} ${patient.nomPatient} ?`,
    'Confirmation de suppression',
    {
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        await patientsStore.delete(patient.idPatient!)
        ElMessage.success('Patient supprimé avec succès')
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || 'Erreur lors de la suppression')
      }
    })
    .catch(() => {
      // User cancelled
    })
}

const resetForm = () => {
  patientForm.value = {
    nomPatient: '',
    prenomPatient: '',
    adressePatient: '',
    numPatient: '',
    mailPatient: '',
  }
  currentPatientId.value = null
  formRef.value?.clearValidate()
}

const loadPatients = async () => {
  loading.value = true
  try {
    await patientsStore.fetchAll()
  } catch (error) {
    ElMessage.error('Erreur lors du chargement des patients')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPatients()
})
</script>

<template>
  <div class="patients-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Gestion des Patients</h1>
        <p class="page-subtitle">
          {{ patientsStore.totalPatients }} patient(s) enregistré(s)
        </p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        Ajouter un patient
      </el-button>
    </div>

    <!-- Search Bar -->
    <el-card shadow="never" class="search-card">
      <el-input
        v-model="searchQuery"
        placeholder="Rechercher par nom, prénom ou email..."
        :prefix-icon="Search"
        size="large"
        clearable
      />
    </el-card>

    <!-- Patients Table -->
    <el-card shadow="never" v-loading="loading">
      <el-table
        :data="filteredPatients"
        style="width: 100%"
        stripe
        :default-sort="{ prop: 'nomPatient', order: 'ascending' }"
      >
        <el-table-column type="index" label="#" width="60" />

        <el-table-column label="Patient" min-width="200" sortable>
          <template #default="{ row }">
            <div class="patient-cell">
              <el-avatar :size="40" class="patient-avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="patient-info">
                <div class="patient-name">
                  {{ row.prenomPatient }} {{ row.nomPatient }}
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
                <span>{{ row.numPatient }}</span>
              </div>
              <div class="contact-item">
                <el-icon><MessageIcon /></el-icon>
                <span>{{ row.mailPatient }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Adresse" min-width="250">
          <template #default="{ row }">
            <div class="address-cell">
              <el-icon><Location /></el-icon>
              <span>{{ row.adressePatient }}</span>
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
          <el-empty description="Aucun patient trouvé" />
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
        :model="patientForm"
        :rules="formRules"
        label-position="top"
        size="large"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Nom" prop="nomPatient">
              <el-input
                v-model="patientForm.nomPatient"
                placeholder="Nom du patient"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="Prénom" prop="prenomPatient">
              <el-input
                v-model="patientForm.prenomPatient"
                placeholder="Prénom du patient"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Adresse" prop="adressePatient">
          <el-input
            v-model="patientForm.adressePatient"
            placeholder="Adresse complète"
            :prefix-icon="Location"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Téléphone" prop="numPatient">
              <el-input
                v-model="patientForm.numPatient"
                placeholder="+32 123 45 67 89"
                :prefix-icon="Phone"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="Email" prop="mailPatient">
              <el-input
                v-model="patientForm.mailPatient"
                type="email"
                placeholder="patient@example.com"
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
.patients-page {
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

.patient-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.patient-avatar {
  background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%);
  color: white;
}

.patient-info {
  display: flex;
  flex-direction: column;
}

.patient-name {
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
  color: #0ea5e9;
}

.address-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
}

.address-cell .el-icon {
  color: #0ea5e9;
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
