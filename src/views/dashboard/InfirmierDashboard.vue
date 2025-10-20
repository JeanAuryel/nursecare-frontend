<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore, useRdvStore } from '@/stores'
import { ElMessage } from 'element-plus'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import frLocale from '@fullcalendar/core/locales/fr'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Calendar,
  User,
  Document,
  Clock,
  Check,
  Star,
  VideoCamera,
} from '@element-plus/icons-vue'
import type { IRdvDetailed } from '@/types'

const authStore = useAuthStore()
const rdvStore = useRdvStore()

const loading = ref(true)
const activeTab = ref('calendar')

// Filter RDV for current nurse
const myRdvs = computed(() => {
  if (!authStore.user) return []
  return rdvStore.rdvs.filter(
    (rdv) => rdv.idEmploye === authStore.user?.id
  )
})

// Today's appointments
const todayRdvs = computed(() => {
  return myRdvs.value.filter((rdv) =>
    isToday(parseISO(rdv.timestamp_RDV_prevu as string))
  )
})

// Tomorrow's appointments
const tomorrowRdvs = computed(() => {
  return myRdvs.value.filter((rdv) =>
    isTomorrow(parseISO(rdv.timestamp_RDV_prevu as string))
  )
})

// Upcoming appointments
const upcomingRdvs = computed(() => {
  const now = new Date()
  return myRdvs.value
    .filter(
      (rdv) =>
        parseISO(rdv.timestamp_RDV_prevu as string) > now &&
        !rdv.timestamp_RDV_reel
    )
    .sort(
      (a, b) =>
        parseISO(a.timestamp_RDV_prevu as string).getTime() -
        parseISO(b.timestamp_RDV_prevu as string).getTime()
    )
    .slice(0, 5)
})

// Completed appointments this week
const completedThisWeek = computed(() => {
  return myRdvs.value.filter((rdv) => rdv.timestamp_RDV_reel).length
})

// Stats
const stats = computed(() => ({
  rdvAujourdhui: todayRdvs.value.length,
  rdvDemain: tomorrowRdvs.value.length,
  rdvSemaine: myRdvs.value.length,
  rdvRealises: completedThisWeek.value,
}))

// Dialogs
const rdvDetailDialogVisible = ref(false)
const completeRdvDialogVisible = ref(false)
const selectedRdv = ref<IRdvDetailed | null>(null)
const internRating = ref<number>(0)
const internComment = ref('')

// Event handler (must be declared before calendarOptions)
const handleEventClick = (info: any) => {
  const rdv = myRdvs.value.find(
    (r) =>
      `${r.idEmploye}-${r.idPrestation}-${r.idPatient}-${r.idStagiaire}` ===
      info.event.id
  )

  if (rdv) {
    selectedRdv.value = rdv
    rdvDetailDialogVisible.value = true
  }
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
  selectable: false,
  dayMaxEvents: true,
  weekends: true,
  height: 'auto',
  slotMinTime: '07:00:00',
  slotMaxTime: '20:00:00',
  eventClick: handleEventClick,
  eventClassNames: (arg: any) => {
    // Highlight completed appointments
    if (arg.event.extendedProps.completed) {
      return ['completed-event']
    }
    return []
  },
})

const openCompleteDialog = (rdv: IRdvDetailed) => {
  selectedRdv.value = rdv
  completeRdvDialogVisible.value = true
}

const markAsCompleted = async () => {
  if (!selectedRdv.value) return

  try {
    await rdvStore.marquerRealise(
      selectedRdv.value.idEmploye,
      selectedRdv.value.idPrestation,
      selectedRdv.value.idPatient,
      selectedRdv.value.idStagiaire,
      internRating.value,
      internComment.value
    )

    ElMessage.success('Rendez-vous marqué comme réalisé')
    completeRdvDialogVisible.value = false
    rdvDetailDialogVisible.value = false
    internRating.value = 0
    internComment.value = ''
    selectedRdv.value = null

    await loadDashboardData()
  } catch (error) {
    ElMessage.error('Erreur lors de la mise à jour')
  }
}

const getTimeLabel = (dateStr: string) => {
  const date = parseISO(dateStr)
  return format(date, 'HH:mm', { locale: fr })
}

const getDateLabel = (dateStr: string) => {
  const date = parseISO(dateStr)
  if (isToday(date)) return "Aujourd'hui"
  if (isTomorrow(date)) return 'Demain'
  return format(date, 'dd/MM/yyyy', { locale: fr })
}

const loadDashboardData = async () => {
  loading.value = true
  try {
    await rdvStore.fetchAll()

    // Filter calendar events for current nurse
    calendarOptions.value.events = rdvStore.calendarEvents.filter(
      (event: any) =>
        event.extendedProps.employe?.idEmploye === authStore.user?.id
    )
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
  <div class="infirmier-dashboard">
    <div class="dashboard-header">
      <h1 class="dashboard-title">Tableau de bord Infirmier</h1>
      <p class="dashboard-subtitle">
        Bienvenue, {{ authStore.fullName }} - Vos rendez-vous et prestations
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
              <span class="kpi-value">{{ stats.rdvDemain }}</span>
              <span class="kpi-label">RDV demain</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="kpi-card kpi-warning">
          <div class="kpi-content">
            <el-icon class="kpi-icon"><Document /></el-icon>
            <div class="kpi-details">
              <span class="kpi-value">{{ stats.rdvSemaine }}</span>
              <span class="kpi-label">RDV cette semaine</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="kpi-card kpi-success">
          <div class="kpi-content">
            <el-icon class="kpi-icon"><Check /></el-icon>
            <div class="kpi-details">
              <span class="kpi-value">{{ stats.rdvRealises }}</span>
              <span class="kpi-label">RDV réalisés</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Main Content -->
    <el-row :gutter="20">
      <!-- Calendar Section -->
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">Mon calendrier</span>
            </div>
          </template>
          <FullCalendar :options="calendarOptions" />
        </el-card>
      </el-col>

      <!-- Sidebar Section -->
      <el-col :xs="24" :lg="8">
        <!-- Today's Appointments -->
        <el-card shadow="hover" class="sidebar-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">Aujourd'hui</span>
              <el-badge :value="todayRdvs.length" type="primary" />
            </div>
          </template>

          <div v-if="todayRdvs.length === 0" class="empty-state">
            <el-empty description="Aucun RDV aujourd'hui" :image-size="80" />
          </div>

          <div v-else class="rdv-list">
            <div
              v-for="rdv in todayRdvs"
              :key="`${rdv.idEmploye}-${rdv.idPatient}`"
              class="rdv-item"
              :class="{ completed: rdv.timestamp_RDV_reel }"
              @click="selectedRdv = rdv; rdvDetailDialogVisible = true"
            >
              <div class="rdv-time">
                <el-icon><Clock /></el-icon>
                {{ getTimeLabel(rdv.timestamp_RDV_prevu as string) }}
              </div>
              <div class="rdv-info">
                <div class="rdv-patient">
                  {{ rdv.patient?.prenomPatient }}
                  {{ rdv.patient?.nomPatient }}
                </div>
                <div class="rdv-prestation">
                  {{ rdv.prestation?.nomPrestation }}
                </div>
                <div v-if="rdv.stagiaire" class="rdv-stagiaire">
                  <el-icon><User /></el-icon>
                  Stagiaire: {{ rdv.stagiaire?.prenomStagiaire }}
                  {{ rdv.stagiaire?.nomStagiaire }}
                </div>
              </div>
              <div v-if="rdv.timestamp_RDV_reel" class="rdv-status">
                <el-icon class="completed-icon"><Check /></el-icon>
              </div>
            </div>
          </div>
        </el-card>

        <!-- Upcoming Appointments -->
        <el-card shadow="hover" class="sidebar-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">Prochains RDV</span>
            </div>
          </template>

          <div v-if="upcomingRdvs.length === 0" class="empty-state">
            <el-empty
              description="Aucun RDV à venir"
              :image-size="80"
            />
          </div>

          <div v-else class="rdv-list-compact">
            <div
              v-for="rdv in upcomingRdvs"
              :key="`${rdv.idEmploye}-${rdv.idPatient}-upcoming`"
              class="rdv-compact-item"
            >
              <div class="rdv-compact-date">
                {{ getDateLabel(rdv.timestamp_RDV_prevu as string) }}
              </div>
              <div class="rdv-compact-time">
                {{ getTimeLabel(rdv.timestamp_RDV_prevu as string) }}
              </div>
              <div class="rdv-compact-info">
                <strong>{{ rdv.patient?.prenomPatient }} {{ rdv.patient?.nomPatient }}</strong>
                <span class="rdv-compact-prestation">{{ rdv.prestation?.nomPrestation }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- RDV Detail Dialog -->
    <el-dialog
      v-model="rdvDetailDialogVisible"
      title="Détails du rendez-vous"
      width="600px"
    >
      <div v-if="selectedRdv" class="rdv-detail-content">
        <el-descriptions :column="1" border size="large">
          <el-descriptions-item label="Patient">
            <div class="detail-with-icon">
              <el-icon><User /></el-icon>
              {{ selectedRdv.patient?.prenomPatient }}
              {{ selectedRdv.patient?.nomPatient }}
            </div>
          </el-descriptions-item>

          <el-descriptions-item label="Téléphone">
            {{ selectedRdv.patient?.numPatient }}
          </el-descriptions-item>

          <el-descriptions-item label="Adresse">
            {{ selectedRdv.patient?.adressePatient }}
          </el-descriptions-item>

          <el-descriptions-item label="Prestation">
            <div class="detail-with-icon">
              <el-icon><Document /></el-icon>
              {{ selectedRdv.prestation?.nomPrestation }}
            </div>
          </el-descriptions-item>

          <el-descriptions-item label="Date & Heure">
            <div class="detail-with-icon">
              <el-icon><Calendar /></el-icon>
              {{
                format(
                  parseISO(selectedRdv.timestamp_RDV_prevu as string),
                  "dd MMMM yyyy 'à' HH:mm",
                  { locale: fr }
                )
              }}
            </div>
          </el-descriptions-item>

          <el-descriptions-item label="Stagiaire">
            <div v-if="selectedRdv.stagiaire" class="detail-with-icon">
              <el-icon><User /></el-icon>
              {{ selectedRdv.stagiaire.prenomStagiaire }}
              {{ selectedRdv.stagiaire.nomStagiaire }}
              <el-tag size="small" class="ml-2">
                {{ selectedRdv.stagiaire.ecole?.nomEcole }}
              </el-tag>
            </div>
            <span v-else class="text-gray-500">Aucun stagiaire</span>
          </el-descriptions-item>

          <el-descriptions-item label="Statut">
            <el-tag v-if="selectedRdv.timestamp_RDV_reel" type="success" size="large">
              ✅ Réalisé le
              {{
                format(
                  parseISO(selectedRdv.timestamp_RDV_reel as string),
                  'dd/MM/yyyy à HH:mm',
                  { locale: fr }
                )
              }}
            </el-tag>
            <el-tag v-else type="info" size="large">
              ⏳ Planifié
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item
            v-if="selectedRdv.noteStagiaire"
            label="Note stagiaire"
          >
            <el-rate
              v-model="selectedRdv.noteStagiaire"
              disabled
              show-score
              text-color="#ff9900"
            />
          </el-descriptions-item>

          <el-descriptions-item
            v-if="selectedRdv.commentaireStagiaire"
            label="Commentaire"
          >
            {{ selectedRdv.commentaireStagiaire }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <el-button @click="rdvDetailDialogVisible = false">Fermer</el-button>
        <el-button
          v-if="selectedRdv && !selectedRdv.timestamp_RDV_reel"
          type="primary"
          @click="openCompleteDialog(selectedRdv)"
        >
          Marquer comme réalisé
        </el-button>
      </template>
    </el-dialog>

    <!-- Complete RDV Dialog -->
    <el-dialog
      v-model="completeRdvDialogVisible"
      title="Marquer le rendez-vous comme réalisé"
      width="500px"
    >
      <div v-if="selectedRdv" class="complete-dialog-content">
        <p class="complete-info">
          <strong>Patient:</strong>
          {{ selectedRdv.patient?.prenomPatient }}
          {{ selectedRdv.patient?.nomPatient }}
        </p>
        <p class="complete-info">
          <strong>Prestation:</strong> {{ selectedRdv.prestation?.nomPrestation }}
        </p>

        <el-divider />

        <el-form v-if="selectedRdv.stagiaire" label-position="top">
          <el-alert
            title="Évaluation du stagiaire"
            type="info"
            :closable="false"
            class="mb-4"
          >
            <template #default>
              <p class="mb-2">
                Stagiaire: {{ selectedRdv.stagiaire.prenomStagiaire }}
                {{ selectedRdv.stagiaire.nomStagiaire }}
              </p>
            </template>
          </el-alert>

          <el-form-item label="Note du stagiaire">
            <el-rate
              v-model="internRating"
              :max="5"
              show-text
              :texts="['Très faible', 'Faible', 'Moyen', 'Bon', 'Excellent']"
            />
          </el-form-item>

          <el-form-item label="Commentaire sur la prestation du stagiaire">
            <el-input
              v-model="internComment"
              type="textarea"
              :rows="4"
              placeholder="Points forts, axes d'amélioration, comportement professionnel..."
            />
          </el-form-item>
        </el-form>

        <el-alert
          v-else
          title="Aucun stagiaire n'a participé à ce rendez-vous"
          type="info"
          :closable="false"
        />
      </div>

      <template #footer>
        <el-button @click="completeRdvDialogVisible = false">
          Annuler
        </el-button>
        <el-button type="primary" @click="markAsCompleted">
          Confirmer la réalisation
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.infirmier-dashboard {
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.sidebar-card {
  margin-bottom: 20px;
}

.sidebar-card:last-child {
  margin-bottom: 0;
}

.rdv-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rdv-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.rdv-item:hover {
  border-color: #0ea5e9;
  background: #f0f9ff;
  transform: translateX(4px);
}

.rdv-item.completed {
  background: #f0fdf4;
  border-color: #86efac;
}

.rdv-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  border-radius: 8px;
  padding: 8px;
  min-width: 60px;
  font-weight: 600;
  color: #0369a1;
  font-size: 14px;
}

.rdv-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rdv-patient {
  font-weight: 600;
  color: #1f2937;
  font-size: 15px;
}

.rdv-prestation {
  color: #6b7280;
  font-size: 13px;
}

.rdv-stagiaire {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #8b5cf6;
  font-size: 12px;
  margin-top: 4px;
}

.rdv-status {
  display: flex;
  align-items: center;
}

.completed-icon {
  font-size: 24px;
  color: #10b981;
}

.rdv-list-compact {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rdv-compact-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
}

.rdv-compact-item:hover {
  border-color: #0ea5e9;
  background: #f0f9ff;
}

.rdv-compact-date {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  min-width: 70px;
}

.rdv-compact-time {
  font-weight: 600;
  color: #0369a1;
  min-width: 45px;
}

.rdv-compact-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
}

.rdv-compact-prestation {
  color: #6b7280;
  font-size: 12px;
}

.empty-state {
  padding: 20px 0;
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

:deep(.completed-event) {
  background: #10b981 !important;
  border-color: #059669 !important;
}

.rdv-detail-content {
  padding: 8px 0;
}

.detail-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
}

.complete-dialog-content {
  padding: 8px 0;
}

.complete-info {
  margin: 8px 0;
  font-size: 14px;
}

@media (max-width: 768px) {
  .dashboard-title {
    font-size: 24px;
  }

  .kpi-value {
    font-size: 24px;
  }
}
</style>
