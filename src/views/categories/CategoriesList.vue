<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCategoriesStore } from '@/stores'
import { Search, Plus, Edit, Delete, Grid } from '@element-plus/icons-vue'
import type { ICategorie, ICategorieForm } from '@/types'

const categoriesStore = useCategoriesStore()

const loading = ref(false)
const searchQuery = ref('')
const dialogVisible = ref(false)
const dialogTitle = ref('Ajouter une catégorie')
const isEditMode = ref(false)
const currentCategorieId = ref<number | null>(null)

const categorieForm = ref<ICategorieForm>({
  nomCategorie: '',
})

const formRules = {
  nomCategorie: [
    { required: true, message: 'Le nom de la catégorie est requis', trigger: 'blur' },
    { min: 3, message: 'Le nom doit contenir au moins 3 caractères', trigger: 'blur' },
  ],
}

const formRef = ref()

// Predefined colors for categories
const categoryColors = [
  '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#6366f1', '#84cc16', '#f97316', '#ec4899',
]

// Filtered categories based on search
const filteredCategories = computed(() => {
  if (!searchQuery.value) {
    return categoriesStore.categories
  }
  return categoriesStore.searchCategories(searchQuery.value)
})

const getCategoryColor = (index: number) => {
  return categoryColors[index % categoryColors.length]
}

const openCreateDialog = () => {
  isEditMode.value = false
  dialogTitle.value = 'Ajouter une catégorie'
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (categorie: ICategorie) => {
  isEditMode.value = true
  dialogTitle.value = 'Modifier la catégorie'
  currentCategorieId.value = categorie.idCategorie!

  categorieForm.value = {
    nomCategorie: categorie.nomCategorie,
  }

  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    loading.value = true
    try {
      if (isEditMode.value && currentCategorieId.value) {
        await categoriesStore.update(currentCategorieId.value, categorieForm.value)
        ElMessage.success('Catégorie modifiée avec succès')
      } else {
        await categoriesStore.create(categorieForm.value)
        ElMessage.success('Catégorie créée avec succès')
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

const handleDelete = async (categorie: ICategorie) => {
  ElMessageBox.confirm(
    `Êtes-vous sûr de vouloir supprimer la catégorie "${categorie.nomCategorie}" ?`,
    'Confirmation de suppression',
    {
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      type: 'warning',
      message: 'Attention: Les prestations liées à cette catégorie ne seront pas supprimées.',
    }
  )
    .then(async () => {
      try {
        await categoriesStore.delete(categorie.idCategorie!)
        ElMessage.success('Catégorie supprimée avec succès')
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || 'Erreur lors de la suppression')
      }
    })
    .catch(() => {
      // User cancelled
    })
}

const resetForm = () => {
  categorieForm.value = {
    nomCategorie: '',
  }
  currentCategorieId.value = null
  formRef.value?.clearValidate()
}

const loadCategories = async () => {
  loading.value = true
  try {
    await categoriesStore.fetchAll()
  } catch (error) {
    ElMessage.error('Erreur lors du chargement des catégories')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCategories()
})
</script>

<template>
  <div class="categories-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Gestion des Catégories</h1>
        <p class="page-subtitle">
          {{ categoriesStore.totalCategories }} catégorie(s) de prestations
        </p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        Ajouter une catégorie
      </el-button>
    </div>

    <!-- Search Bar -->
    <el-card shadow="never" class="search-card">
      <el-input
        v-model="searchQuery"
        placeholder="Rechercher une catégorie..."
        :prefix-icon="Search"
        size="large"
        clearable
      />
    </el-card>

    <!-- Categories Grid View -->
    <el-row :gutter="20" v-loading="loading">
      <el-col
        v-for="(categorie, index) in filteredCategories"
        :key="categorie.idCategorie"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
        class="mb-5"
      >
        <el-card shadow="hover" class="category-card">
          <div class="category-content">
            <div
              class="category-icon-wrapper"
              :style="{ background: getCategoryColor(index) }"
            >
              <el-icon :size="32" class="category-icon">
                <Grid />
              </el-icon>
            </div>

            <h3 class="category-name">{{ categorie.nomCategorie }}</h3>

            <div class="category-actions">
              <el-button
                type="primary"
                :icon="Edit"
                size="small"
                @click="openEditDialog(categorie)"
              >
                Modifier
              </el-button>
              <el-button
                type="danger"
                :icon="Delete"
                size="small"
                @click="handleDelete(categorie)"
              >
                Supprimer
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col v-if="filteredCategories.length === 0" :span="24">
        <el-empty description="Aucune catégorie trouvée">
          <el-button type="primary" @click="openCreateDialog">
            Créer une catégorie
          </el-button>
        </el-empty>
      </el-col>
    </el-row>

    <!-- Table View (Alternative) -->
    <el-card shadow="never" class="mt-6" v-if="false">
      <el-table
        :data="filteredCategories"
        style="width: 100%"
        stripe
        :default-sort="{ prop: 'nomCategorie', order: 'ascending' }"
      >
        <el-table-column type="index" label="#" width="60" />

        <el-table-column label="Catégorie" prop="nomCategorie" sortable>
          <template #default="{ row, $index }">
            <div class="category-table-cell">
              <div
                class="category-color-badge"
                :style="{ background: getCategoryColor($index) }"
              />
              <span class="font-semibold">{{ row.nomCategorie }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Actions" width="200">
          <template #default="{ row }">
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
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="categorieForm"
        :rules="formRules"
        label-position="top"
        size="large"
      >
        <el-form-item label="Nom de la catégorie" prop="nomCategorie">
          <el-input
            v-model="categorieForm.nomCategorie"
            placeholder="Ex: Soins de base, Injections, Prélèvements..."
            :prefix-icon="Grid"
          />
          <template #extra>
            <span class="text-sm text-gray-500">
              Les catégories permettent d'organiser les prestations de soins
            </span>
          </template>
        </el-form-item>
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
.categories-page {
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

.category-card {
  height: 100%;
  border-radius: 12px;
  transition: all 0.3s;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.category-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 10px;
}

.category-icon-wrapper {
  padding: 16px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.category-icon {
  color: white;
}

.category-name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 20px 0;
  min-height: 48px;
  display: flex;
  align-items: center;
}

.category-actions {
  display: flex;
  gap: 8px;
  width: 100%;
  justify-content: center;
}

.category-table-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-color-badge {
  width: 12px;
  height: 12px;
  border-radius: 50%;
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

  .category-actions {
    flex-direction: column;
  }

  .category-actions .el-button {
    width: 100%;
  }
}
</style>
