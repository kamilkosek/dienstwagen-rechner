<template>
  <div class="user-data-summary">
    <div class="summary-header">
      <h2>Persönliche Daten</h2>
      <div class="profile-badge">
        <div class="profile-info">
          <span class="profile-label">Aktives Profil:</span>
          <span class="profile-name">{{ activeProfile?.name || 'Standard-Profil' }}</span>
        </div>
        <button class="edit-button" @click="openUserDataForm">
          Bearbeiten
        </button>
      </div>
    </div>
    
    <div class="summary-content">
      <div class="data-grid">
        <div class="data-item">
          <span class="data-label">Bruttomonatsgehalt:</span>
          <span class="data-value">{{ formatCurrency(userData.bruttoMonatsgehalt) }}</span>
        </div>
        <div class="data-item">
          <span class="data-label">Steuerklasse:</span>
          <span class="data-value">{{ userData.steuerklasse }}</span>
        </div>
        <div class="data-item">
          <span class="data-label">Bundesland:</span>
          <span class="data-value">{{ userData.bundesland }}</span>
        </div>
        <div class="data-item">
          <span class="data-label">Nettogehalt:</span>
          <span class="data-value highlight">{{ formatCurrency(nettoOhneDienstwagen) }}</span>
        </div>
      </div>
    </div>
    
    <!-- User Data Form Modal -->
    <UserDataForm 
      :is-open="isUserDataFormOpen" 
      @close="closeUserDataForm" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCalculatorStore } from '@/stores/calculator'
import UserDataForm from '@/components/UserDataForm.vue'

const store = useCalculatorStore()
const isUserDataFormOpen = ref(false)

// Get active profile and user data
const userProfiles = computed(() => store.userProfiles)
const activeProfileId = computed(() => store.activeProfileId)
const activeProfile = computed(() => 
  userProfiles.value.find(profile => profile.id === activeProfileId.value)
)
const userData = computed(() => store.userData)

// Calculate net income
const nettoOhneDienstwagen = computed(() => {
  return store.calculateNettoOhneDienstwagen(userData.value.bruttoMonatsgehalt)
})

// Format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('de-DE', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(value)
}

// Modal controls
const openUserDataForm = () => {
  isUserDataFormOpen.value = true
}

const closeUserDataForm = () => {
  isUserDataFormOpen.value = false
}
</script>

<style scoped>
.user-data-summary {
  background-color: #f5f5f5;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.summary-header h2 {
  margin: 0;
}

.profile-badge {
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: #e6f7ff;
  padding: 0.5rem 1rem;
  border-radius: 4px;
}

.profile-info {
  display: flex;
  flex-direction: column;
}

.profile-label {
  font-size: 0.8rem;
  color: #666;
}

.profile-name {
  font-weight: 600;
  color: #0066cc;
}

.edit-button {
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.edit-button:hover {
  background-color: #0055aa;
}

.summary-content {
  background-color: white;
  border-radius: 6px;
  padding: 1.2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.2rem;
}

.data-item {
  display: flex;
  flex-direction: column;
}

.data-label {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.3rem;
}

.data-value {
  font-weight: 500;
  font-size: 1.1rem;
}

.data-value.highlight {
  color: #0066cc;
  font-size: 1.2rem;
  font-weight: 600;
}

@media (max-width: 768px) {
  .summary-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .profile-badge {
    margin-top: 1rem;
    width: 100%;
    justify-content: space-between;
  }
}
</style>
