<template>
  <div class="dienstwagen-vergleich">
    <div class="dienstwagen-header">
      <h2>Dienstwagen Vergleich</h2>
      <button @click="openModal" class="add-car-button">
        <span class="plus-icon">+</span> Dienstwagen hinzufügen
      </button>
    </div>

    <!-- Modal dialog for adding/editing a car -->
    <div v-if="isModalOpen" class="modal-overlay" @click="closeOnOverlay">
      <div class="car-form-container" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditMode ? 'Dienstwagen bearbeiten' : 'Neuen Dienstwagen hinzufügen' }}</h3>
          <button @click="closeModal" class="close-button">×</button>
        </div>
        <form @submit.prevent="saveCar" class="car-form">
          <div class="form-group">
            <label for="car-name">Bezeichnung</label>
            <input
              id="car-name"
              type="text"
              v-model="newCar.name"
              placeholder="ID Buzz GTX oder ID4"
              required
            />
          </div>

          <div class="form-group">
            <label for="car-price">Bruttolistenpreis (€)</label>
            <input
              id="car-price"
              type="number"
              v-model.number="newCar.bruttolistenpreis"
              min="0"
              step="100"
              required
            />
          </div>

          <div class="form-group">
            <label for="car-type">Art der Versteuerung</label>
            <select
              id="car-type"
              v-model="newCar.versteuerungsTyp"
              required
            >
              <option value="voll">Verbrenner (1% Regelung)</option>
              <option value="hybrid">Hybrid (0,5% Regelung)</option>
              <option value="elektro">Elektro (0,25% Regelung)</option>
            </select>
          </div>

          <div class="form-group">
            <label for="car-konfig-code">Konfigurator-Code (optional)</label>
            <input
              id="car-konfig-code"
              type="text"
              v-model="newCar.konfiguratorCode"
              placeholder="Code vom Fahrzeugkonfigurator"
            />
          </div>

          <div class="form-group">
            <label for="car-konfig-link">Konfigurator-Link (optional)</label>
            <input
              id="car-konfig-link"
              type="url"
              v-model="newCar.konfiguratorLink"
              placeholder="https://konfigurator.beispiel.de/..."
            />
          </div>

          <div class="form-group">
            <label>Eigenanteil</label>
            <div class="eigenanteil-type-selector">
              <label>
                <input type="radio" v-model="eigenanteilType" value="prozentual" />
                Prozentual
              </label>
              <label>
                <input type="radio" v-model="eigenanteilType" value="fixiert" />
                Fester Monatsbetrag
              </label>
              <label>
                <input type="radio" v-model="eigenanteilType" value="keiner" />
                Kein Eigenanteil
              </label>
            </div>

            <div v-if="eigenanteilType === 'prozentual'" class="eigenanteil-inputs">
              <div class="eigenanteil-field">
                <label for="eigenanteil-prozentsatz">Prozentsatz (%)</label>
                <input
                  id="eigenanteil-prozentsatz"
                  type="number"
                  v-model.number="eigenanteilProzentsatz"
                  min="0"
                  step="0.1"
                  placeholder="1.5"
                />
              </div>
              <div class="eigenanteil-field">
                <label for="eigenanteil-freigrenze">ab Betrag (€)</label>
                <input
                  id="eigenanteil-freigrenze"
                  type="number"
                  v-model.number="eigenanteilFreigrenze"
                  min="0"
                  step="1000"
                  placeholder="45000"
                />
              </div>
            </div>

            <div v-else-if="eigenanteilType === 'fixiert'" class="eigenanteil-inputs">
              <div class="eigenanteil-field">
                <label for="eigenanteil-fixed">Monatlicher Festbetrag (€)</label>
                <input
                  id="eigenanteil-fixed"
                  type="number"
                  v-model.number="eigenanteilFixedAmount"
                  min="0"
                  step="10"
                  placeholder="200"
                />
              </div>
            </div>
          </div>

          <div class="form-group button-container">
            <button type="submit" class="add-button">{{ isEditMode ? 'Speichern' : 'Hinzufügen' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- List of cars to compare -->
    <div class="cars-list" v-if="cars.length > 0">
      <div class="car-card" v-for="car in cars" :key="car.id">
        <div class="car-header">
          <h4>{{ car.name }}</h4>
          <div class="car-actions">
            <button @click="editCar(car)" class="edit-button">
              Bearbeiten
            </button>
            <button @click="removeCar(car.id)" class="remove-button">
              Entfernen
            </button>
          </div>
        </div>
        <div class="car-details">
          <p><strong>Bruttolistenpreis:</strong> {{ formatCurrency(car.bruttolistenpreis) }}</p>
          <p><strong>Versteuerung:</strong>
            {{ car.versteuerungsTyp === 'voll' ? 'Verbrenner (1%)' :
              car.versteuerungsTyp === 'hybrid' ? 'Hybrid (0,5%)' : 'Elektro (0,25%)' }}
          </p>
          <p>
            <strong>Eigenanteil:</strong>
            <span v-if="car.eigenanteil?.type === 'prozentual'">
              {{ car.eigenanteil.prozentsatz }}% ab {{ formatCurrency(car.eigenanteil.freigrenze || 0) }}
            </span>
            <span v-else-if="car.eigenanteil?.type === 'fixiert'">
              {{ formatCurrency(car.eigenanteil.fixedAmount || 0) }} monatlich
            </span>
            <span v-else-if="car.eigenanteil?.type === 'keiner'">
              Kein Eigenanteil
            </span>
            <span v-else>1,5% ab 45.000€</span>
          </p>
          <p v-if="car.konfiguratorCode">
            <strong>Konfigurator-Code:</strong> {{ car.konfiguratorCode }}
          </p>
          <p v-if="car.konfiguratorLink">
            <strong>Konfigurator-Link:</strong>
            <a :href="car.konfiguratorLink" target="_blank" rel="noopener noreferrer">
              Zum Konfigurator öffnen
            </a>
          </p>
        </div>
      </div>
    </div>
    <div v-else class="no-cars">
      <p>Noch keine Fahrzeuge hinzugefügt. Füge oben ein Fahrzeug hinzu.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCalculatorStore } from '@/stores/calculator'
import type { DienstwagenData } from '@/types'

const store = useCalculatorStore()

// Get cars from store
const cars = computed(() => store.dienstwagen)

// Modal state
const isModalOpen = ref<boolean>(false)
const isEditMode = ref<boolean>(false)
const editingCarId = ref<string>('')

// Eigenanteil values (separate from newCar to make binding easier)
const eigenanteilType = ref<'prozentual' | 'fixiert' | 'keiner'>('prozentual')
const eigenanteilProzentsatz = ref<number>(1.5)
const eigenanteilFreigrenze = ref<number>(45000)
const eigenanteilFixedAmount = ref<number>(0)

// New car form data
const newCar = ref<DienstwagenData>({
  id: '',
  name: '',
  bruttolistenpreis: 0,
  versteuerungsTyp: 'voll',
  konfiguratorCode: '',
  konfiguratorLink: ''
})

// Modal functions
const openModal = () => {
  isEditMode.value = false
  resetForm()
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  resetForm()
}

// Close when clicking outside the modal
const closeOnOverlay = (event: MouseEvent) => {
  if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
    closeModal()
  }
}

// Reset the form to default values
const resetForm = () => {
  newCar.value = {
    id: '',
    name: '',
    bruttolistenpreis: 0,
    versteuerungsTyp: 'voll',
    konfiguratorCode: '',
    konfiguratorLink: ''
  }
  eigenanteilType.value = 'prozentual'
  eigenanteilProzentsatz.value = 1.5
  eigenanteilFreigrenze.value = 45000
  eigenanteilFixedAmount.value = 0
  editingCarId.value = ''
}

// Edit an existing car
const editCar = (car: DienstwagenData) => {
  isEditMode.value = true
  editingCarId.value = car.id

  // Populate form with car data
  newCar.value = {
    id: car.id,
    name: car.name,
    bruttolistenpreis: car.bruttolistenpreis,
    versteuerungsTyp: car.versteuerungsTyp,
    konfiguratorCode: car.konfiguratorCode || '',
    konfiguratorLink: car.konfiguratorLink || ''
  }

  // Set eigenanteil values if they exist
  if (car.eigenanteil) {
    eigenanteilType.value = car.eigenanteil.type

    if (car.eigenanteil.type === 'prozentual') {
      eigenanteilProzentsatz.value = car.eigenanteil.prozentsatz || 1.5
      eigenanteilFreigrenze.value = car.eigenanteil.freigrenze || 45000
    } else if (car.eigenanteil.type === 'fixiert') {
      eigenanteilFixedAmount.value = car.eigenanteil.fixedAmount || 0
    }
  } else {
    eigenanteilType.value = 'prozentual'
    eigenanteilProzentsatz.value = 1.5
    eigenanteilFreigrenze.value = 45000
    eigenanteilFixedAmount.value = 0
  }

  isModalOpen.value = true
}

// Save car data (add new or update existing)
const saveCar = () => {
  // Add eigenanteil parameters if provided
  const carData = {...newCar.value}

  // Set eigenanteil based on the selected type
  if (eigenanteilType.value === 'prozentual' && eigenanteilProzentsatz.value && eigenanteilFreigrenze.value) {
    carData.eigenanteil = {
      type: 'prozentual',
      prozentsatz: eigenanteilProzentsatz.value,
      freigrenze: eigenanteilFreigrenze.value
    }
  } else if (eigenanteilType.value === 'fixiert' && eigenanteilFixedAmount.value > 0) {
    carData.eigenanteil = {
      type: 'fixiert',
      fixedAmount: eigenanteilFixedAmount.value
    }
  } else if (eigenanteilType.value === 'keiner') {
    carData.eigenanteil = {
      type: 'keiner'
    }
  }

  if (isEditMode.value) {
    store.updateDienstwagen(carData)
  } else {
    store.addDienstwagen(carData)
  }

  // Close the modal after saving the car
  closeModal()
}

// Remove a car from comparison
const removeCar = (id: string) => {
  store.removeDienstwagen(id)
}

// Format numbers as currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}
</script>

<style scoped>
.dienstwagen-vergleich {
  margin-bottom: 2rem;
}

.dienstwagen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.add-car-button {
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.6rem 1rem;
  cursor: pointer;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: background-color 0.2s;
}

.add-car-button:hover {
  background-color: #0055aa;
}

.plus-icon {
  font-weight: bold;
  font-size: 1.2rem;
}

/* Modal styles */
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

.car-form-container {
  background-color: #f5f5f5;
  padding: 1.5rem;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
}

.modal-header h3 {
  margin: 0;
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

.form-group {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}

.button-container {
  margin-top: 1rem;
}

.eigenanteil-inputs {
  display: flex;
  gap: 1rem;
}

.eigenanteil-field {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.eigenanteil-field label {
  font-size: 0.9rem;
  margin-bottom: 0.2rem;
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

.add-button {
  background-color: #4caf50;
  color: white;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.add-button:hover {
  background-color: #45a049;
}

.cars-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.car-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.car-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.car-header h4 {
  margin: 0;
}

.car-details p {
  margin: 0.5rem 0;
}

.no-cars {
  text-align: center;
  color: #666;
  padding: 2rem 0;
}

.car-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-button {
  background-color: #2196F3;
  color: white;
  border: none;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.edit-button:hover {
  background-color: #0b7dda;
}

.remove-button {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.remove-button:hover {
  background-color: #d32f2f;
}
</style>
