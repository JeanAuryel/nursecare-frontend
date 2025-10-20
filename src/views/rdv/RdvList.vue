<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRdvStore, usePatientsStore, useStagiairesStore, usePrestationsStore, useAuthStore } from '@/stores'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import frLocale from '@fullcalendar/core/locales/fr'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar, Plus, Edit, Delete, User, Document, Clock, Check } from '@element-plus/icons-vue'
import type { IRdvForm, IRdvDetailed } from '@/types'
import { RoleEmploye } from '@/types'

const rdvStore = useRdvStore()
const patientsStore = usePatientsStore()
const stagiairesStore = useStagiairesStore()
const prestationsStore = usePrestationsStore()
const authStore = useAuthStore()

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('Créer un rendez-vous')
const isEditMode = ref(false)
const selectedRdv = ref<IRdvDetailed | null>(null)

const rdvForm = ref<IRdvForm>({
  idEmploye: 0,
  idPrestation: 0,
  idPatient: 0,
  idStagiaire: 0,
  timestamp_RDV_prevu: '',
})

const formRules = {
  idPatient: [
    { required: true, message: 'Le patient est requis', trigger: 'change', type: 'number' },
  ],
  idPrestation: [
    { required: true, message: 'La prestation est requise', trigger: 'change', type: 'number' },
  ],
  idEmploye: [
    { required: true, message: "L'infirmier est requis", trigger: 'change', type: 'number' },
  ],
  timestamp_RDV_prevu: [
    { required: true, message: 'La date et heure sont requises', trigger: 'change' },
  ],
}

const formRef = ref()

// Available nurses (mock - should come from an employees store)
const availableNurses = ref([
  { id: 1, name: 'Dr. Martin Dubois', role: RoleEmploye.INFIRMIER },
  { id: 2, name: 'Dr. Sophie Laurent', role: RoleEmploye.INFIRMIER },
  { id: 3, name: 'Dr. Pierre Bernard', role: RoleEmploye.INFIRMIER },
])

// Filter options
const filterEmployeId = ref<number | null>(null)
const filterPatientId = ref<number | null>(null)
const showCompletedOnly = ref(false)

// Filtered events for calendar
const filteredEvents = computed(() => {
  let events = rdvStore.calendarEvents

  if (filterEmployeId.value) {
    events = events.filter(
      (e: any) => e.extendedProps.employe?.idEmploye === filterEmployeId.value
    )
  }

  if (filterPatientId.value) {
    events = events.filter(
      (e: any) => e.extendedProps.patient?.idPatient === filterPatientId.value
    )
  }

  if (showCompletedOnly.value) {
    events = events.filter((e: any) => e.extendedProps.completed)
  }

  return events
})

// Event handlers (must be declared before calendarOptions)
const handleEventClick = (info: any) => {
  const rdv = rdvStore.rdvs.find(
    (r) =>
      `${r.idEmploye}-${r.idPrestation}-${r.idPatient}-${r.idStagiaire}` ===
      info.event.id
  )

  if (rdv) {
    selectedRdv.value = rdv
    showRdvDetails()
  }
}

const handleEventDrop = async (info: any) => {
  const newDate = info.event.start
  ElMessage.success(`Rendez-vous déplacé au ${format(newDate, 'dd/MM/yyyy HH:mm', { locale: fr })}`)
  // TODO: Update RDV in backend
}

const handleEventResize = async (info: any) => {
  ElMessage.success('Durée du rendez-vous modifiée')
  // TODO: Update RDV duration in backend
}

const handleDateSelect = (selectInfo: any) => {
  const selectedDate = selectInfo.start
  rdvForm.value.timestamp_RDV_prevu = format(selectedDate, "yyyy-MM-dd'T'HH:mm")
  openCreateDialog()
}

// Calendar configuration (declared after event handlers)
const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
  initialView: 'timeGridWeek',
  locale: frLocale,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
  },
  events: [],
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  height: 'auto',
  slotMinTime: '07:00:00',
  slotMaxTime: '20:00:00',
  eventClick: handleEventClick,
  eventDrop: handleEventDrop,
  eventResize: handleEventResize,
  select: handleDateSelect,
  businessHours: {
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: '08:00',
    endTime: '18:00',
  },
})

const openCreateDialog = () => {
  isEditMode.value = false
  dialogTitle.value = 'Créer un rendez-vous'
  resetForm()
  dialogVisible.value = true
}

const showRdvDetails = () => {
  if (!selectedRdv.value) return

  ElMessageBox.alert(
    `
    <div style="text-align: left; line-height: 1.8;">
      <p><strong>Patient:</strong> ${selectedRdv.value.patient?.prenomPatient} ${selectedRdv.value.patient?.nomPatient}</p>
      <p><strong>Téléphone:</strong> ${selectedRdv.value.patient?.numPatient}</p>
      <p><strong>Prestation:</strong> ${selectedRdv.value.prestation?.nomPrestation}</p>
      <p><strong>Infirmier:</strong> ${selectedRdv.value.employe?.prenomEmploye} ${selectedRdv.value.employe?.nomEmploye}</p>
      <p><strong>Date prévue:</strong> ${format(parseISO(selectedRdv.value.timestamp_RDV_prevu as string), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
      ${selectedRdv.value.stagiaire ? `<p><strong>Stagiaire:</strong> ${selectedRdv.value.stagiaire.prenomStagiaire} ${selectedRdv.value.stagiaire.nomStagiaire}</p>` : ''}
      <p><strong>Statut:</strong> ${selectedRdv.value.timestamp_RDV_reel ? '✅ Réalisé' : '⏳ Planifié'}</p>
      ${selectedRdv.value.timestamp_RDV_reel ? `<p><strong>Réalisé le:</strong> ${format(parseISO(selectedRdv.value.timestamp_RDV_reel as string), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>` : ''}
    </div>
    `,
    'Détails du rendez-vous',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: 'Fermer',
      showCancelButton: !selectedRdv.value.timestamp_RDV_reel,
      cancelButtonText: 'Supprimer',
      cancelButtonClass: 'el-button--danger',
    }
  ).catch(() => {
    // User clicked "Supprimer"
    if (selectedRdv.value) {
      handleDelete(selectedRdv.value)
    }
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    loading.value = true
    try {
      await rdvStore.create(rdvForm.value)
      ElMessage.success('Rendez-vous créé avec succès')
      dialogVisible.value = false
      resetForm()
      await loadData()
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || 'Une erreur est survenue')
    } finally {
      loading.value = false
    }
  })
}

const handleDelete = async (rdv: IRdvDetailed) => {
  ElMessageBox.confirm(
    `Êtes-vous sûr de vouloir supprimer ce rendez-vous ?`,
    'Confirmation de suppression',
    {
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        await rdvStore.delete(
          rdv.idEmploye,
          rdv.idPrestation,
          rdv.idPatient,
          rdv.idStagiaire
        )
        ElMessage.success('Rendez-vous supprimé avec succès')
        selectedRdv.value = null
        await loadData()
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || 'Erreur lors de la suppression')
      }
    })
    .catch(() => {
      // User cancelled
    })
}

const resetForm = () => {
  rdvForm.value = {
    idEmploye: 0,
    idPrestation: 0,
    idPatient: 0,
    idStagiaire: 0,
    timestamp_RDV_prevu: '',
  }
  formRef.value?.clearValidate()
}

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([
      rdvStore.fetchAll(),
      patientsStore.fetchAll(),
      stagiairesStore.fetchAll(),
      prestationsStore.fetchAll(),
    ])

    // Update calendar events
    calendarOptions.value.events = filteredEvents.value
  } catch (error) {
    ElMessage.error('Erreur lors du chargement des données')
  } finally {
    loading.value = false
  }
}

// Watch for filter changes
const applyFilters = () => {
  calendarOptions.value.events = filteredEvents.value
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="rdv-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Gestion des Rendez-vous</h1>
        <p class="page-subtitle">
          {{ rdvStore.rdvs.length }} rendez-vous planifié(s)
        </p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        Créer un rendez-vous
      </el-button>
    </div>

    <!-- Filters -->
    <el-card shadow="never" class="filters-card">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="8">
          <el-select
            v-model="filterEmployeId"
            placeholder="Filtrer par infirmier"
            clearable
            class="w-full"
            @change="applyFilters"
          >
            <el-option
              v-for="nurse in availableNurses"
              :key="nurse.id"
              :label="nurse.name"
              :value="nurse.id"
            />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="8">
          <el-select
            v-model="filterPatientId"
            placeholder="Filtrer par patient"
            clearable
            filterable
            class="w-full"
            @change="applyFilters"
          >
            <el-option
              v-for="patient in patientsStore.patients"
              :key="patient.idPatient"
              :label="`${patient.prenomPatient} ${patient.nomPatient}`"
              :value="patient.idPatient"
            />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="8">
          <el-checkbox
            v-model="showCompletedOnly"
            @change="applyFilters"
          >
            Afficher uniquement les RDV réalisés
          </el-checkbox>
        </el-col>
      </el-row>
    </el-card>

    <!-- Calendar -->
    <el-card shadow="never" v-loading="loading" class="calendar-card">
      <FullCalendar :options="calendarOptions" />
    </el-card>

    <!-- Create Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="rdvForm"
        :rules="formRules"
        label-position="top"
        size="large"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Patient" prop="idPatient">
              <el-select
                v-model="rdvForm.idPatient"
                placeholder="Sélectionner un patient"
                filterable
                class="w-full"
              >
                <el-option
                  v-for="patient in patientsStore.patients"
                  :key="patient.idPatient"
                  :label="`${patient.prenomPatient} ${patient.nomPatient}`"
                  :value="patient.idPatient"
                >
                  <div class="select-option-content">
                    <span>{{ patient.prenomPatient }} {{ patient.nomPatient }}</span>
                    <span class="text-xs text-gray-400">{{ patient.numPatient }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="Prestation" prop="idPrestation">
              <el-select
                v-model="rdvForm.idPrestation"
                placeholder="Sélectionner une prestation"
                filterable
                class="w-full"
              >
                <el-option
                  v-for="prestation in prestationsStore.prestations"
                  :key="prestation.idPrestation"
                  :label="prestation.nomPrestation"
                  :value="prestation.idPrestation"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Infirmier assigné" prop="idEmploye">
              <el-select
                v-model="rdvForm.idEmploye"
                placeholder="Sélectionner un infirmier"
                class="w-full"
              >
                <el-option
                  v-for="nurse in availableNurses"
                  :key="nurse.id"
                  :label="nurse.name"
                  :value="nurse.id"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="Stagiaire (optionnel)" prop="idStagiaire">
              <el-select
                v-model="rdvForm.idStagiaire"
                placeholder="Sélectionner un stagiaire"
                clearable
                filterable
                class="w-full"
              >
                <el-option
                  v-for="stagiaire in stagiairesStore.stagiaires"
                  :key="stagiaire.idStagiaire"
                  :label="`${stagiaire.prenomStagiaire} ${stagiaire.nomStagiaire}`"
                  :value="stagiaire.idStagiaire"
                >
                  <div class="select-option-content">
                    <span>{{ stagiaire.prenomStagiaire }} {{ stagiaire.nomStagiaire }}</span>
                    <span class="text-xs text-gray-400">{{ stagiaire.ecole?.nomEcole }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Date et heure du rendez-vous" prop="timestamp_RDV_prevu">
          <el-date-picker
            v-model="rdvForm.timestamp_RDV_prevu"
            type="datetime"
            placeholder="Sélectionner la date et l'heure"
            format="DD/MM/YYYY HH:mm"
            value-format="YYYY-MM-DDTHH:mm"
            class="w-full"
            :disabled-date="(time: Date) => time < new Date()"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">Annuler</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          Créer le rendez-vous
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.rdv-page {
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

.filters-card {
  margin-bottom: 20px;
  border: none;
}

.calendar-card {
  border: none;
}

:deep(.fc) {
  font-family: inherit;
}

:deep(.fc-toolbar-title) {
  font-size: 20px !important;
  font-weight: 600;
}

:deep(.fc-button) {
  background: #0ea5e9 !important;
  border-color: #0ea5e9 !important;
  text-transform: capitalize;
}

:deep(.fc-button:hover) {
  background: #0369a1 !important;
  border-color: #0369a1 !important;
}

:deep(.fc-button-active) {
  background: #075985 !important;
  border-color: #075985 !important;
}

:deep(.fc-event) {
  cursor: pointer;
  border-radius: 4px;
}

:deep(.fc-daygrid-event) {
  padding: 2px 4px;
}

:deep(.fc-timegrid-event) {
  border-radius: 4px;
}

.select-option-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
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
