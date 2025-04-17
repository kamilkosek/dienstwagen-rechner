<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeOnOverlay">
    <div class="user-data-form" @click.stop>
      <div class="header-section">
        <h2>Persönliche Daten</h2>
        <div class="control-buttons">
          <div class="profile-controls">
            <div class="profile-selector">
              <label for="profile-select">Profil:</label>
              <select id="profile-select" v-model="selectedProfileId" @change="switchProfile">
                <option v-for="profile in profiles" :key="profile.id" :value="profile.id">
                  {{ profile.name }}
                </option>
              </select>
            </div>
            <button class="profile-button" @click="showAddProfileModal">
              <span class="button-icon">+</span> Neues Profil
            </button>
            <button class="profile-button" @click="showEditProfileModal" :disabled="!selectedProfileId">
              <span class="button-icon">✎</span> Bearbeiten
            </button>
          </div>
          <button class="close-button" @click="close">×</button>
        </div>
      </div>

    <form @submit.prevent>
      <div class="form-group">
        <label for="brutto">Bruttomonatsgehalt (€)</label>
        <input
          id="brutto"
          type="number"
          v-model.number="userInput.bruttoMonatsgehalt"
          @change="updateUserData"
          min="0"
          step="100"
          required
        />
      </div>

      <div class="form-group">
        <label for="steuerklasse">Steuerklasse</label>
        <select
          id="steuerklasse"
          v-model.number="userInput.steuerklasse"
          @change="updateUserData"
          required
        >
          <option :value="1">Steuerklasse 1</option>
          <option :value="2">Steuerklasse 2</option>
          <option :value="3">Steuerklasse 3</option>
          <option :value="4">Steuerklasse 4</option>
          <option :value="5">Steuerklasse 5</option>
          <option :value="6">Steuerklasse 6</option>
        </select>
      </div>

      <div class="form-group">
        <label for="bundesland">Bundesland</label>
        <select
          id="bundesland"
          v-model="userInput.bundesland"
          @change="updateUserData"
          required
        >
          <option value="Baden-Württemberg">Baden-Württemberg</option>
          <option value="Bayern">Bayern</option>
          <option value="Berlin">Berlin</option>
          <option value="Brandenburg">Brandenburg</option>
          <option value="Bremen">Bremen</option>
          <option value="Hamburg">Hamburg</option>
          <option value="Hessen">Hessen</option>
          <option value="Mecklenburg-Vorpommern">Mecklenburg-Vorpommern</option>
          <option value="Niedersachsen">Niedersachsen</option>
          <option value="Nordrhein-Westfalen">Nordrhein-Westfalen</option>
          <option value="Rheinland-Pfalz">Rheinland-Pfalz</option>
          <option value="Saarland">Saarland</option>
          <option value="Sachsen">Sachsen</option>
          <option value="Sachsen-Anhalt">Sachsen-Anhalt</option>
          <option value="Schleswig-Holstein">Schleswig-Holstein</option>
          <option value="Thüringen">Thüringen</option>
        </select>
      </div>

      <div class="form-group">
        <label for="steuerjahr">Steuerjahr</label>
        <input
          id="steuerjahr"
          type="number"
          v-model.number="userInput.steuerjahr"
          @change="updateUserData"
          min="2023"
          max="2030"
          required
        />
      </div>

      <div class="form-group">
        <label for="geburtsjahr">Geburtsjahr</label>
        <input
          id="geburtsjahr"
          type="number"
          v-model.number="userInput.geburtsjahr"
          @change="updateUserData"
          min="1940"
          max="2006"
          required
        />
      </div>

      <div class="form-group">
        <label for="kinder">Anzahl Kinderfreibeträge</label>
        <input
          id="kinder"
          type="number"
          v-model.number="userInput.kinderfreibetraege"
          @change="updateUserData"
          min="0"
          step="0.5"
        />
      </div>

      <div class="form-group">
        <label for="monatsfreibetrag">Monatsfreibetrag (€)</label>
        <input
          id="monatsfreibetrag"
          type="number"
          v-model.number="userInput.monatsfreibetrag"
          @change="updateUserData"
          min="0"
          step="10"
        />
      </div>

      <div class="form-group checkbox">
        <input
          id="kirchensteuer"
          type="checkbox"
          v-model="userInput.kirchensteuer"
          @change="updateUserData"
        />
        <label for="kirchensteuer">Kirchensteuer</label>
      </div>

      <h3>Vorsorgeaufwendungen</h3>

      <div class="form-group">
        <label for="rentenversicherung">Rentenversicherung (%)</label>
        <input
          id="rentenversicherung"
          type="number"
          v-model.number="userInput.vorsorgeaufwendungen.rentenversicherung"
          @change="updateUserData"
          min="0"
          step="0.1"
          required
        />
      </div>

      <div class="form-group">
        <label for="krankenversicherung">Krankenversicherung (%)</label>
        <input
          id="krankenversicherung"
          type="number"
          v-model.number="userInput.vorsorgeaufwendungen.krankenversicherung"
          @change="updateUserData"
          min="0"
          step="0.1"
          required
        />
      </div>

      <div class="form-group">
        <label for="zusatzbeitrag">Zusatzbeitragssatz (%)</label>
        <input
          id="zusatzbeitrag"
          type="number"
          v-model.number="userInput.vorsorgeaufwendungen.zusatzbeitragssatz"
          @change="updateUserData"
          min="0"
          step="0.1"
          required
        />
      </div>
    </form>

    <div class="calculation-summary" v-if="userInput.bruttoMonatsgehalt > 0">
      <h3>Abgaben und Nettogehalt</h3>

      <div class="deductions-summary">
        <div class="deduction-group">
          <h4>Steuerabgaben</h4>
          <div class="deduction-item">
            <span class="deduction-label">Lohnsteuer:</span>
            <span class="deduction-value">{{ formatCurrency(einkommensteuer) }}</span>
          </div>
          <div class="deduction-item" v-if="userInput.kirchensteuer">
            <span class="deduction-label">Kirchensteuer:</span>
            <span class="deduction-value">{{ formatCurrency(kirchensteuer) }}</span>
          </div>
          <div class="deduction-item">
            <span class="deduction-label">Solidaritätszuschlag:</span>
            <span class="deduction-value">{{ formatCurrency(soli) }}</span>
          </div>
          <div class="deduction-item total">
            <span class="deduction-label">Summe Steuern:</span>
            <span class="deduction-value">{{ formatCurrency(einkommensteuer + kirchensteuer + soli) }}</span>
          </div>
        </div>

        <div class="deduction-group">
          <h4>Sozialversicherungen</h4>
          <div class="deduction-item">
            <span class="deduction-label">Krankenversicherung:</span>
            <span class="deduction-value">{{ formatCurrency(sozialAbgaben.krankenversicherung) }}</span>
          </div>
          <div class="deduction-item">
            <span class="deduction-label">Pflegeversicherung:</span>
            <span class="deduction-value">{{ formatCurrency(sozialAbgaben.pflegeversicherung) }}</span>
          </div>
          <div class="deduction-item">
            <span class="deduction-label">Rentenversicherung:</span>
            <span class="deduction-value">{{ formatCurrency(sozialAbgaben.rentenversicherung) }}</span>
          </div>
          <div class="deduction-item">
            <span class="deduction-label">Arbeitslosenversicherung:</span>
            <span class="deduction-value">{{ formatCurrency(sozialAbgaben.arbeitslosenversicherung) }}</span>
          </div>
          <div class="deduction-item total">
            <span class="deduction-label">Summe Sozialabgaben:</span>
            <span class="deduction-value">{{ formatCurrency(sozialAbgaben.gesamt) }}</span>
          </div>
        </div>
      </div>

      <div class="salary-container">
        <div class="salary-item">
          <span class="salary-label">Bruttogehalt:</span>
          <span class="salary-value">{{ formatCurrency(userInput.bruttoMonatsgehalt) }}</span>
        </div>
        <div class="salary-item">
          <span class="salary-label">Gesamtabzüge:</span>
          <span class="salary-value">{{ formatCurrency(gesamtabzuege) }}</span>
        </div>
        <div class="salary-item netto">
          <span class="salary-label">Nettogehalt:</span>
          <span class="salary-value">{{ formatCurrency(nettoOhneDienstwagen) }}</span>
        </div>
      </div>
    </div>

    <!-- Import/Export Configuration -->
    <ConfigImportExport />

    <!-- Profile modals -->
    <ProfileModal
      :is-open="isAddProfileModalOpen"
      @close="closeModals"
      @save="handleSaveProfile"
    />

    <ProfileModal
      :is-open="isEditProfileModalOpen"
      :profile="currentEditProfile"
      :allow-delete="profiles.length > 1"
      @close="closeModals"
      @save="handleSaveProfile"
      @delete="handleDeleteProfile"
    />
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCalculatorStore } from '@/stores/calculator'
import type { UserData, UserProfile } from '@/types'
import ProfileModal from './ProfileModal.vue'
import ConfigImportExport from './ConfigImportExport.vue'

// Props
const props = defineProps<{
  isOpen: boolean
}>()

// Emits
const emit = defineEmits<{
  close: []
}>()

// Store
const store = useCalculatorStore()

// Profile management
const profiles = computed(() => store.userProfiles)
const selectedProfileId = ref<string | null>(store.activeProfileId)

// Modal visibility states
const isAddProfileModalOpen = ref(false)
const isEditProfileModalOpen = ref(false)
const currentEditProfile = ref<UserProfile | undefined>(undefined)

// Create a local copy of user data to work with
const userInput = ref<UserData>({...store.userData})

// Watch for changes in the active profile's data
watch(() => store.userData, (newUserData) => {
  userInput.value = {...newUserData}
}, { deep: true })

// Get calculated net income without company car
const nettoOhneDienstwagen = computed(() => {
  return store.calculateNettoOhneDienstwagen(userInput.value.bruttoMonatsgehalt, userInput.value)
})

// Use the calculator store's functions to get tax components
// Get income tax from calculator
const einkommensteuer = computed(() => {
  return store.calculateEinkommensteuer(userInput.value.bruttoMonatsgehalt, userInput.value)
})

// Get church tax from calculator
const kirchensteuer = computed(() => {
  return store.calculateKirchensteuer(einkommensteuer.value, userInput.value)
})

// Get solidarity surcharge from calculator
const soli = computed(() => {
  return store.calculateSolidaritaetszuschlag(einkommensteuer.value)
})

// Get social security contributions from calculator
const sozialAbgaben = computed(() => {
  return store.calculateSozialversicherung(userInput.value.bruttoMonatsgehalt, userInput.value)
})

// Calculate total deductions
const gesamtabzuege = computed(() => {
  return einkommensteuer.value + kirchensteuer.value + soli.value + sozialAbgaben.value.gesamt
})

// Update store when form changes
const updateUserData = () => {
  store.updateUserData(userInput.value)
}

// Format numbers as currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

// Switch active profile
const switchProfile = () => {
  if (selectedProfileId.value) {
    store.setActiveProfile(selectedProfileId.value)
  }
}

// Open modal to add a new profile
const showAddProfileModal = () => {
  isAddProfileModalOpen.value = true
}

// Open modal to edit the current profile
const showEditProfileModal = () => {
  const profile = profiles.value.find(p => p.id === selectedProfileId.value)
  if (profile) {
    currentEditProfile.value = profile
    isEditProfileModalOpen.value = true
  }
}

// Handle saving a profile (new or edited)
const handleSaveProfile = (profileData: {name: string, id?: string, userData: UserData}) => {
  if (profileData.id) {
    // Updating existing profile
    store.updateProfileName(profileData.id, profileData.name)
    store.updateUserData(profileData.userData)
  } else {
    // Creating new profile
    store.addProfile(profileData.name, profileData.userData)
  }
}

// Handle deleting a profile
const handleDeleteProfile = (profileId: string) => {
  store.deleteProfile(profileId)
}

// Close profile modals
const closeModals = () => {
  isAddProfileModalOpen.value = false
  isEditProfileModalOpen.value = false
  currentEditProfile.value = undefined
}

// Close the UserDataForm modal
const close = () => {
  emit('close')
}

// Close when clicking outside the modal
const closeOnOverlay = (event: MouseEvent) => {
  if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
    close()
  }
}

// Initialize form with data from store
onMounted(() => {
  userInput.value = {...store.userData}
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.user-data-form {
  background-color: #f5f5f5;
  padding: 1.5rem;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.header-section h2 {
  margin: 0;
  margin-bottom: 0.5rem;
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: rgba(0,0,0,0.1);
}

.profile-controls {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.profile-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.profile-selector label {
  margin-bottom: 0;
  white-space: nowrap;
}

.profile-selector select {
  min-width: 150px;
  padding: 0.4rem 0.5rem;
}

.profile-button {
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: background-color 0.2s;
}

.profile-button:hover {
  background-color: #0055aa;
}

.profile-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.button-icon {
  font-weight: bold;
  font-size: 1rem;
}

.form-group {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}

.form-group.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

label {
  margin-bottom: 0.3rem;
  font-weight: 500;
}

input, select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
}

h3 {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}

.calculation-summary {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: #e6f7ff;
  border-radius: 6px;
}

.deductions-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.deduction-group {
  background-color: #ffffff;
  padding: 1rem;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.deduction-group h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.deduction-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.deduction-item.total {
  margin-top: 0.8rem;
  padding-top: 0.8rem;
  border-top: 1px dashed #ddd;
  font-weight: 600;
}

.salary-container {
  background-color: #ffffff;
  padding: 1.2rem;
  border-radius: 6px;
  margin-top: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.salary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 1.05rem;
}

.salary-item.netto {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #eee;
  font-size: 1.3rem;
  font-weight: bold;
}

.salary-value {
  color: #0066cc;
}

@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .profile-controls {
    width: 100%;
    margin-top: 1rem;
    justify-content: space-between;
  }

  .deductions-summary {
    grid-template-columns: 1fr;
  }
}
</style>
