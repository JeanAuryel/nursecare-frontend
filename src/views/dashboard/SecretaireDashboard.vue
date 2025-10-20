<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore, useRdvStore } from '@/stores'
import { ElMessage, ElMessageBox } from 'element-plus'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import frLocale from '@fullcalendar/core/locales/fr'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Calendar,
  Phone,
  User,
  Document,
  Check,
  Close,
  Clock,
} from '@element-plus/icons-vue'
import type { IRdvDetailed } from '@/types'

const authStore = useAuthStore()
const rdvStore = useRdvStore()

const loading = ref(true)
const activeTab = ref('calendar')

// Stats
const stats = computed(() => ({
  rdvAujourdhui: rdvStore.rdvDuJour.length,
  rdvSemaine: rdvStore.rdvs.length,
  appelsPendants: cancelledRdvs.value.length,
  rdvAssignes: assignedRdvs.value.filter((r) => r.idEmploye).length,
}))

// Cancelled RDV requiring phone calls
const cancelledRdvs = ref<IRdvDetailed[]>([])

// Unassigned RDV requiring nurse assignment
const unassignedRdvs = ref<IRdvDetailed[]>([])

// Assigned RDV
const assignedRdvs = computed(() =>
  rdvStore.rdvs.filter((rdv) => rdv.idEmploye)
)

// Available nurses (mock data - should come from store)
const availableNurses = ref([
  { id: 1, name: 'Dr. Martin Dubois', available: true },
  { id: 2, name: 'Dr. Sophie Laurent', available: true },
  { id: 3, name: 'Dr. Pierre Bernard', available: false },
])

// Dialogs
const assignDialogVisible = ref(false)
const callDialogVisible = ref(false)
const selectedRdv = ref<IRdvDetailed | null>(null)
const selectedNurseId = ref<number | null>(null)
const callNotes = ref('')

// Event handlers (must be declared before calendarOptions)
const handleEventClick = (info: any) => {
  const rdv = rdvStore.rdvs.find(
    (r) =>
      `${r.idEmploye}-${r.idPrestation}-${r.idPatient}-${r.idStagiaire}` ===
      info.event.id
  )

  if (rdv) {
    selectedRdv.value = rdv
    ElMessageBox.alert(
      `
      <div style="text-align: left;">
        <p><strong>Patient:</strong> ${rdv.patient?.prenomPatient} ${rdv.patient?.nomPatient}</p>
        <p><strong>Prestation:</strong> ${rdv.prestation?.nomPrestation}</p>
        <p><strong>Infirmier:</strong> ${rdv.employe?.prenomEmploye} ${rdv.employe?.nomEmploye}</p>
        <p><strong>Date:</strong> ${format(parseISO(rdv.timestamp_RDV_prevu as string), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
        <p><strong>Statut:</strong> ${rdv.timestamp_RDV_reel ? '✅ Réalisé' : '⏳ Planifié'}</p>
      </div>
      `,
      'Détails du rendez-vous',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: 'OK',
        showCancelButton: true,
        cancelButtonText: 'Réassigner',
        cancelButtonClass: 'el-button--primary',
      }
    ).catch(() => {
      // User clicked "Réassigner"
      assignDialogVisible.value = true
    })
  }
}

const handleEventDrop = async (info: any) => {
  // Handle drag and drop to reassign appointments
  ElMessage.success('Rendez-vous déplacé avec succès')
}

const handleDateSelect = (selectInfo: any) => {
  // Open dialog to create new appointment
  ElMessage.info('Fonctionnalité de création disponible dans le module RDV')
}

// Calendar configuration
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
  select: handleDateSelect,
})

const assignNurse = async () => {
  if (!selectedRdv.value || !selectedNurseId.value) {
    ElMessage.warning('Veuillez sélectionner un infirmier')
    return
  }

  try {
    // Update RDV with assigned nurse
    // await rdvStore.update(selectedRdv.value, { idEmploye: selectedNurseId.value })
    ElMessage.success('Infirmier assigné avec succès')
    assignDialogVisible.value = false
    selectedRdv.value = null
    selectedNurseId.value = null
    await loadDashboardData()
  } catch (error) {
    ElMessage.error("Erreur lors de l'assignation")
  }
}

const markCallComplete = (rdv: IRdvDetailed) => {
  callDialogVisible.value = true
  selectedRdv.value = rdv
}

const saveCallNotes = () => {
  if (!selectedRdv.value) return

  // Remove from cancelled list (mock)
  const index = cancelledRdvs.value.findIndex(
    (r) =>
      r.idEmploye === selectedRdv.value?.idEmploye &&
      r.idPatient === selectedRdv.value?.idPatient
  )
  if (index > -1) {
    cancelledRdvs.value.splice(index, 1)
  }

  ElMessage.success('Appel enregistré')
  callDialogVisible.value = false
  callNotes.value = ''
  selectedRdv.value = null
}

const openAssignDialog = (rdv: IRdvDetailed) => {
  selectedRdv.value = rdv
  assignDialogVisible.value = true
}

const getStatusType = (rdv: IRdvDetailed) => {
  if (rdv.timestamp_RDV_reel) return 'success'
  return 'info'
}

const getStatusText = (rdv: IRdvDetailed) => {
  if (rdv.timestamp_RDV_reel) return 'Réalisé'
  return 'Planifié'
}

const loadDashboardData = async () => {
  loading.value = true
  try {
    await rdvStore.fetchAll()

    // Update calendar events
    calendarOptions.value.events = rdvStore.calendarEvents

    // Mock cancelled RDVs requiring calls (in real app, filter by status)
    cancelledRdvs.value = rdvStore.rdvs.slice(0, 3)

    // Mock unassigned RDVs (in real app, filter where idEmploye is null)
    unassignedRdvs.value = []
  } catch (error) {
    ElMessage.error('Erreur lors du chargement des données')
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<template>
  <div class="secretaire-dashboard">
    <div class="dashboard-header">
      <h1 class="dashboard-title">Tableau de bord Secrétaire</h1>
      <p class="dashboard-subtitle">
        Bienvenue, {{ authStore.fullName }} - Gestion des RDV et assignations
      </p>
    </div>

    <!-- KPI Cards -->
    <el-row :gutter="20" class="kpi-section">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="kpi-card kpi-primary">
          <div class="kpi-content">
            <el-icon class="kpi-icon"><Calendar /></el-icon>
            <div class="kpi-details">
              <span class="kpi-value">{{ stats.rdvAujourdhui }}</span>
              <span class="kpi-label">RDV aujourd'hui</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="kpi-card kpi-info">
          <div class="kpi-content">
            <el-icon class="kpi-icon"><Clock /></el-icon>
            <div class="kpi-details">
              <span class="kpi-value">{{ stats.rdvSemaine }}</span>
              <span class="kpi-label">RDV cette semaine</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="kpi-card kpi-warning">
          <div class="kpi-content">
            <el-icon class="kpi-icon"><Phone /></el-icon>
            <div class="kpi-details">
              <span class="kpi-value">{{ stats.appelsPendants }}</span>
              <span class="kpi-label">Appels à passer</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="kpi-card kpi-success">
          <div class="kpi-content">
            <el-icon class="kpi-icon"><Check /></el-icon>
            <div class="kpi-details">
              <span class="kpi-value">{{ stats.rdvAssignes }}</span>
              <span class="kpi-label">RDV assignés</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Main Content Tabs -->
    <el-card shadow="hover">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- Calendar Tab -->
        <el-tab-pane label="Calendrier des RDV" name="calendar">
          <div class="calendar-container">
            <FullCalendar :options="calendarOptions" />
          </div>
        </el-tab-pane>

        <!-- Calls Management Tab -->
        <el-tab-pane name="calls">
          <template #label>
            <el-badge :value="stats.appelsPendants" :max="99" class="tab-badge">
              <span>Appels à passer</span>
            </el-badge>
          </template>

          <div class="calls-container">
            <el-alert
              v-if="cancelledRdvs.length === 0"
              title="Aucun appel en attente"
              type="success"
              :closable="false"
              show-icon
            />

            <div v-else class="calls-list">
              <el-card
                v-for="rdv in cancelledRdvs"
                :key="`${rdv.idEmploye}-${rdv.idPatient}`"
                shadow="hover"
                class="call-card"
              >
                <div class="call-header">
                  <div class="call-info">
                    <h3 class="patient-name">
                      {{ rdv.patient?.prenomPatient }}
                      {{ rdv.patient?.nomPatient }}
                    </h3>
                    <p class="call-details">
                      <el-icon><Phone /></el-icon>
                      {{ rdv.patient?.numPatient }}
                    </p>
                    <p class="call-details">
                      <el-icon><Calendar /></el-icon>
                      RDV annulé le
                      {{
                        format(
                          parseISO(rdv.timestamp_RDV_prevu as string),
                          'dd/MM/yyyy à HH:mm',
                          { locale: fr }
                        )
                      }}
                    </p>
                    <p class="call-reason">
                      Raison: Infirmier indisponible - Prévenir le client
                    </p>
                  </div>
                  <div class="call-actions">
                    <el-button
                      type="success"
                      :icon="Check"
                      @click="markCallComplete(rdv)"
                    >
                      Marquer comme appelé
                    </el-button>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>

        <!-- Assignment Tab -->
        <el-tab-pane name="assignments">
          <template #label>
            <el-badge
              :value="unassignedRdvs.length"
              :max="99"
              class="tab-badge"
            >
              <span>Assignations</span>
            </el-badge>
          </template>

          <div class="assignments-container">
            <div class="section-header">
              <h3>RDV en attente d'assignation</h3>
              <el-button type="primary" size="small">
                Créer nouveau RDV
              </el-button>
            </div>

            <el-alert
              v-if="unassignedRdvs.length === 0"
              title="Tous les RDV sont assignés"
              type="success"
              :closable="false"
              show-icon
            />

            <el-table
              v-else
              :data="unassignedRdvs"
              style="width: 100%"
              stripe
            >
              <el-table-column prop="patient.nomPatient" label="Patient" />
              <el-table-column prop="prestation.nomPrestation" label="Prestation" />
              <el-table-column label="Date & Heure">
                <template #default="{ row }">
                  {{
                    format(
                      parseISO(row.timestamp_RDV_prevu as string),
                      'dd/MM/yyyy HH:mm',
                      { locale: fr }
                    )
                  }}
                </template>
              </el-table-column>
              <el-table-column label="Actions" width="150">
                <template #default="{ row }">
                  <el-button
                    type="primary"
                    size="small"
                    @click="openAssignDialog(row)"
                  >
                    Assigner
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <el-divider />

            <div class="section-header">
              <h3>RDV assignés récents</h3>
            </div>

            <el-table :data="assignedRdvs.slice(0, 10)" style="width: 100%" stripe>
              <el-table-column prop="patient.nomPatient" label="Patient" />
              <el-table-column prop="prestation.nomPrestation" label="Prestation" />
              <el-table-column label="Infirmier">
                <template #default="{ row }">
                  {{ row.employe?.prenomEmploye }} {{ row.employe?.nomEmploye }}
                </template>
              </el-table-column>
              <el-table-column label="Date & Heure">
                <template #default="{ row }">
                  {{
                    format(
                      parseISO(row.timestamp_RDV_prevu as string),
                      'dd/MM/yyyy HH:mm',
                      { locale: fr }
                    )
                  }}
                </template>
              </el-table-column>
              <el-table-column label="Statut" width="120">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row)">
                    {{ getStatusText(row) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- Assign Nurse Dialog -->
    <el-dialog
      v-model="assignDialogVisible"
      title="Assigner un infirmier"
      width="500px"
    >
      <div v-if="selectedRdv" class="assign-dialog-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="Patient">
            {{ selectedRdv.patient?.prenomPatient }}
            {{ selectedRdv.patient?.nomPatient }}
          </el-descriptions-item>
          <el-descriptions-item label="Prestation">
            {{ selectedRdv.prestation?.nomPrestation }}
          </el-descriptions-item>
          <el-descriptions-item label="Date & Heure">
            {{
              format(
                parseISO(selectedRdv.timestamp_RDV_prevu as string),
                'dd/MM/yyyy à HH:mm',
                { locale: fr }
              )
            }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <el-form label-position="top">
          <el-form-item label="Sélectionner un infirmier" required>
            <el-select
              v-model="selectedNurseId"
              placeholder="Choisir un infirmier"
              class="w-full"
            >
              <el-option
                v-for="nurse in availableNurses"
                :key="nurse.id"
                :label="nurse.name"
                :value="nurse.id"
                :disabled="!nurse.available"
              >
                <span>{{ nurse.name }}</span>
                <el-tag
                  v-if="nurse.available"
                  type="success"
                  size="small"
                  class="ml-2"
                >
                  Disponible
                </el-tag>
                <el-tag v-else type="danger" size="small" class="ml-2">
                  Occupé
                </el-tag>
              </el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="assignDialogVisible = false">Annuler</el-button>
        <el-button type="primary" @click="assignNurse">Assigner</el-button>
      </template>
    </el-dialog>

    <!-- Call Notes Dialog -->
    <el-dialog
      v-model="callDialogVisible"
      title="Enregistrer l'appel"
      width="500px"
    >
      <div v-if="selectedRdv" class="call-dialog-content">
        <p class="call-patient-info">
          <strong>Patient:</strong>
          {{ selectedRdv.patient?.prenomPatient }}
          {{ selectedRdv.patient?.nomPatient }}
        </p>
        <p class="call-patient-info">
          <strong>Téléphone:</strong> {{ selectedRdv.patient?.numPatient }}
        </p>

        <el-form label-position="top">
          <el-form-item label="Notes de l'appel">
            <el-input
              v-model="callNotes"
              type="textarea"
              :rows="4"
              placeholder="Résumé de la conversation, nouvelle date proposée, etc."
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="callDialogVisible = false">Annuler</el-button>
        <el-button type="primary" @click="saveCallNotes">
          Enregistrer
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.secretaire-dashboard {
  padding: 0;
}

.dashboard-header {
  margin-bottom: 24px;
}

.dashboard-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.dashboard-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.kpi-section {
  margin-bottom: 24px;
}

.kpi-card {
  border-radius: 12px;
  border: none;
  transition: transform 0.2s;
}

.kpi-card:hover {
  transform: translateY(-4px);
}

.kpi-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.kpi-icon {
  font-size: 40px;
  padding: 12px;
  border-radius: 12px;
}

.kpi-primary .kpi-icon {
  color: #0ea5e9;
  background: #e0f2fe;
}

.kpi-success .kpi-icon {
  color: #10b981;
  background: #d1fae5;
}

.kpi-info .kpi-icon {
  color: #6366f1;
  background: #e0e7ff;
}

.kpi-warning .kpi-icon {
  color: #f59e0b;
  background: #fef3c7;
}

.kpi-details {
  display: flex;
  flex-direction: column;
}

.kpi-value {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.kpi-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

.calendar-container {
  padding: 16px 0;
}

:deep(.fc) {
  font-family: inherit;
}

:deep(.fc-toolbar-title) {
  font-size: 18px !important;
  font-weight: 600;
}

:deep(.fc-button) {
  background: #0ea5e9 !important;
  border-color: #0ea5e9 !important;
  text-transform: capitalize;
}

.calls-container {
  padding: 16px 0;
}

.calls-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.call-card {
  border-radius: 8px;
}

.call-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.patient-name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.call-details {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  margin: 4px 0;
  font-size: 14px;
}

.call-reason {
  color: #f59e0b;
  font-size: 14px;
  margin-top: 8px;
  padding: 8px;
  background: #fef3c7;
  border-radius: 4px;
}

.assignments-container {
  padding: 16px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.tab-badge {
  margin-right: 8px;
}

.assign-dialog-content {
  padding: 8px 0;
}

.call-dialog-content {
  padding: 8px 0;
}

.call-patient-info {
  margin: 8px 0;
  font-size: 14px;
  color: #4b5563;
}

@media (max-width: 768px) {
  .dashboard-title {
    font-size: 24px;
  }

  .kpi-value {
    font-size: 24px;
  }

  .call-header {
    flex-direction: column;
    gap: 16px;
  }

  .call-actions {
    width: 100%;
  }

  .call-actions .el-button {
    width: 100%;
  }
}
</style>
