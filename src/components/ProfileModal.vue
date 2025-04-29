<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeOnOverlay">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2>{{ isEditMode ? 'Profil bearbeiten' : 'Neues Profil erstellen' }}</h2>
        <button class="close-button" @click="close">×</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label for="profile-name">Profilname</label>
          <input
            id="profile-name"
            type="text"
            v-model="profileName"
            placeholder="z.B. Aktuelles Gehalt, Beförderungsgehalt, etc."
            required
          />
        </div>

        <!-- When editing, show the form with profile data -->
        <div v-if="isEditMode" class="user-data-form">
          <div class="form-group">
            <label for="brutto">Bruttomonatsgehalt (€)</label>
            <input
              id="brutto"
              type="number"
              v-model.number="formData.bruttoMonatsgehalt"
              min="0"
              step="100"
              required
            />
          </div>

          <div class="form-group">
            <label for="steuerklasse">Steuerklasse</label>
            <select
              id="steuerklasse"
              v-model.number="formData.steuerklasse"
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
              v-model="formData.bundesland"
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
              v-model.number="formData.steuerjahr"
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
              v-model.number="formData.geburtsjahr"
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
              v-model.number="formData.kinderfreibetraege"
              min="0"
              step="0.5"
            />
            <small class="info-text">
              Hinweis: Kinderfreibeträge beeinflussen nur die Kirchensteuer, nicht die Lohnsteuer.
              Sie reduzieren jedoch die Pflegeversicherungsbeiträge und damit das Nettogehalt.
            </small>
          </div>

          <div class="form-group">
            <label for="monatsfreibetrag">Monatsfreibetrag (€)</label>
            <input
              id="monatsfreibetrag"
              type="number"
              v-model.number="formData.monatsfreibetrag"
              min="0"
              step="10"
            />
          </div>

          <div class="form-group checkbox">
            <input
              id="kirchensteuer"
              type="checkbox"
              v-model="formData.kirchensteuer"
            />
            <label for="kirchensteuer">Kirchensteuer</label>
          </div>

          <h3>Vorsorgeaufwendungen</h3>

          <div class="form-group">
            <label for="rentenversicherung">Rentenversicherung (%)</label>
            <input
              id="rentenversicherung"
              type="number"
              v-model.number="formData.vorsorgeaufwendungen.rentenversicherung"
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
              v-model.number="formData.vorsorgeaufwendungen.krankenversicherung"
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
              v-model.number="formData.vorsorgeaufwendungen.zusatzbeitragssatz"
              min="0"
              step="0.1"
              required
            />
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn secondary" @click="close">Abbrechen</button>
        <button class="btn primary" @click="save" :disabled="!isValid">Speichern</button>
        <button v-if="isEditMode && allowDelete" class="btn danger" @click="deleteProfile">Löschen</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { UserData, UserProfile } from '@/types'
import { useCalculatorStore } from '@/stores/calculator'

const store = useCalculatorStore()

const props = defineProps<{
  isOpen: boolean,
  profile?: UserProfile,
  allowDelete?: boolean
}>()

const emit = defineEmits(['close', 'save', 'delete'])

// Form state
const isEditMode = computed(() => !!props.profile)

// Default user data for new profile
const defaultUserData: UserData = {
  bruttoMonatsgehalt: 0,
  steuerklasse: 1,
  bundesland: 'Bayern',
  steuerjahr: 2025,
  geburtsjahr: 1980,
  kinderfreibetraege: 0,
  monatsfreibetrag: 0,
  kirchensteuer: false,
  vorsorgeaufwendungen: {
    rentenversicherung: 18.6,
    krankenversicherung: 14.6,
    zusatzbeitragssatz: 1.3
  }
}

const profileName = ref('')
const formData = ref<UserData>({ ...defaultUserData })

// Watch for prop changes to initialize form data
watch(() => props.profile, (newProfile) => {
  if (newProfile) {
    profileName.value = newProfile.name
    formData.value = JSON.parse(JSON.stringify(newProfile.userData)) // Deep copy
  } else {
    profileName.value = ''
    formData.value = { ...defaultUserData }
  }
}, { immediate: true })

// Validation
const isValid = computed(() => {
  return profileName.value.trim() !== ''
})

// Close modal
const close = () => {
  emit('close')
}

// Close when clicking the overlay (outside the modal)
const closeOnOverlay = (event: MouseEvent) => {
  if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
    close()
  }
}

// Save changes
const save = () => {
  if (!isValid.value) return

  if (isEditMode.value && props.profile) {
    // Update existing profile
    emit('save', {
      id: props.profile.id,
      name: profileName.value,
      userData: formData.value
    })
  } else {
    // Create new profile
    emit('save', {
      name: profileName.value,
      userData: formData.value
    })
  }
  close()
}

// Delete profile
const deleteProfile = () => {
  if (props.profile) {
    emit('delete', props.profile.id)
  }
  close()
}
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

.modal-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #0066cc;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.btn.primary {
  background-color: #4caf50;
  color: white;
}

.btn.primary:hover {
  background-color: #45a049;
}

.btn.secondary {
  background-color: #f1f1f1;
  color: #333;
}

.btn.secondary:hover {
  background-color: #e0e0e0;
}

.btn.danger {
  background-color: #f44336;
  color: white;
  margin-right: auto; /* Push to left */
}

.btn.danger:hover {
  background-color: #d32f2f;
}

.btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.info-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
}

/* Form styling */
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

h3 {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}
</style>
