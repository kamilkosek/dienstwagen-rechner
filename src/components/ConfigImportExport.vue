<template>
  <div class="import-export-tools">
    <h3>Daten speichern & laden</h3>

    <div class="button-group">
      <button
        class="btn btn-primary"
        @click="exportData"
        title="Alle Konfigurationen und Profile als Datei exportieren">
        <i class="fas fa-download"></i> Konfiguration exportieren
      </button>

      <div class="file-upload">
        <input
          type="file"
          ref="fileInput"
          @change="handleFileSelect"
          accept=".json"
          class="file-input"
          id="file-upload"
        />
        <label for="file-upload" class="btn btn-secondary">
          <i class="fas fa-upload"></i> Konfiguration importieren
        </label>
      </div>
    </div>

    <!-- Status messages -->
    <div v-if="importStatus" class="status-message" :class="statusClass">
      {{ importStatus }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineExpose } from 'vue'
import { useCalculatorStore } from '@/stores/calculator'

const props = defineProps({
  showLocalUI: {
    type: Boolean,
    default: true
  }
})

const emits = defineEmits(['status-update'])

const store = useCalculatorStore()
const fileInput = ref<HTMLInputElement | null>(null)
const importStatus = ref<string>('')
const statusClass = ref<string>('')

// Export configuration data to file
const exportData = () => {
  store.exportConfig()
  updateStatus('Konfiguration erfolgreich exportiert!', 'success')
}

// Update status message and emit event
const updateStatus = (message: string, status: string) => {
  importStatus.value = message
  statusClass.value = status

  // Emit status update for parent components
  emits('status-update', { message, status })

  // Clear status message after delay
  setTimeout(() => {
    importStatus.value = ''
  }, 3000)
}

// Expose methods for external use
defineExpose({
  exportData,
  triggerFileInput: () => {
    if (fileInput.value) {
      fileInput.value.click()
    }
  }
})

// Handle file selection for import
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (!files || files.length === 0) {
    return
  }

  try {
    importStatus.value = 'Import wird verarbeitet...'
    statusClass.value = 'pending'

    const file = files[0]
    const success = await store.importConfig(file)

    if (success) {
      importStatus.value = 'Konfiguration erfolgreich importiert!'
      statusClass.value = 'success'
    } else {
      importStatus.value = 'Import fehlgeschlagen: Ungültiges Dateiformat'
      statusClass.value = 'error'
    }
  } catch (error) {
    importStatus.value = `Import fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    statusClass.value = 'error'
  } finally {
    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }

    // Clear status message after 5 seconds
    setTimeout(() => {
      importStatus.value = ''
    }, 5000)
  }
}
</script>

<style scoped>
.import-export-tools {
  margin: 1.5rem 0;
  padding: 1rem;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background-color: #45a049;
}

.btn-secondary {
  background-color: #2196F3;
  color: white;
}

.btn-secondary:hover {
  background-color: #0b7dda;
}

.file-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
}

.file-upload {
  position: relative;
}

.status-message {
  margin-top: 1rem;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.success {
  background-color: rgba(76, 175, 80, 0.1);
  color: #2e7d32;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.error {
  background-color: rgba(244, 67, 54, 0.1);
  color: #d32f2f;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.pending {
  background-color: rgba(33, 150, 243, 0.1);
  color: #1976d2;
  border: 1px solid rgba(33, 150, 243, 0.3);
}
</style>
