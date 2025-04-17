<template>
  <div v-if="isVisible" class="config-popup-overlay" @click="closeOnOverlay">
    <div class="config-popup" @click.stop>
      <div class="popup-header">
        <h3>Konfiguration verwalten</h3>
        <button class="close-button" @click="close">×</button>
      </div>

      <div class="popup-content">
        <p class="description">
          Speichere deine Konfiguration (Profile, Einstellungen und Fahrzeugdaten) in einer Datei oder lade eine vorherige Konfiguration.
        </p>

        <div class="action-buttons">
          <button class="action-button export" @click="exportConfig">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path d="M12 21l-8-9h6v-12h4v12h6l-8 9zm9-1v2h-18v-2h18z"/>
            </svg>
            <span>Konfiguration exportieren</span>
          </button>

          <div class="file-upload action-button import">
            <input
              type="file"
              ref="fileInput"
              @change="importConfig"
              accept=".json"
              class="file-input"
              id="config-file-upload"
            />
            <label for="config-file-upload">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path d="M12 3l8 9h-6v12h-4v-12h-6l8-9zm9 18v-2h-18v2h18z"/>
              </svg>
              <span>Konfiguration importieren</span>
            </label>
          </div>
        </div>

        <div class="info-section">
          <h4>Synchronisierung mit Cloud-Diensten</h4>
          <p>
            Die exportierte Konfigurationsdatei kannst du in Cloud-Diensten wie OneDrive, Google Drive oder Dropbox speichern,
            um sie zwischen Geräten zu synchronisieren oder als Backup zu nutzen.
          </p>
          <ol class="steps">
            <li>Exportiere die Konfiguration mit dem obigen Button</li>
            <li>Speichere die Datei in deinem Cloud-Ordner (OneDrive, Dropbox, etc.)</li>
            <li>Auf einem anderen Gerät: Öffne diese Seite und importiere die Datei aus dem Cloud-Ordner</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits } from 'vue'
import { useCalculatorStore } from '@/stores/calculator'

const props = defineProps<{
  isVisible: boolean
}>()

const emit = defineEmits(['close', 'status-update'])

const store = useCalculatorStore()
const fileInput = ref<HTMLInputElement | null>(null)

// Close the popup
const close = () => {
  emit('close')
}

// Export configuration
const exportConfig = () => {
  store.exportConfig()
  close()
  emit('status-update', 'Konfiguration erfolgreich exportiert!')
}

// Import configuration
const importConfig = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (!files || files.length === 0) {
    return
  }

  try {
    const file = files[0]
    const success = await store.importConfig(file)

    close()

    if (success) {
      emit('status-update', 'Konfiguration erfolgreich importiert!')
    } else {
      emit('status-update', 'Import fehlgeschlagen: Ungültiges Dateiformat')
    }
  } catch (error) {
    close()
    emit('status-update', `Import fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
  } finally {
    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

// Close when clicking outside the popup
const closeOnOverlay = (event: MouseEvent) => {
  if ((event.target as HTMLElement).classList.contains('config-popup-overlay')) {
    close()
  }
}
</script>

<style scoped>
.config-popup-overlay {
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

.config-popup {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
}

.popup-header h3 {
  margin: 0;
  color: #0066cc;
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
  background-color: rgba(0, 0, 0, 0.1);
}

.popup-content {
  padding: 1.5rem;
}

.description {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #555;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  border: none;
  transition: background-color 0.2s;
  width: 100%;
}

.action-button svg {
  flex-shrink: 0;
}

.action-button.export {
  background-color: #35c759;
  color: white;
}

.action-button.export:hover {
  background-color: #27a348;
}

.action-button.export svg {
  fill: white;
}

.action-button.import {
  background-color: #007aff;
  color: white;
  position: relative;
}

.action-button.import:hover {
  background-color: #0055aa;
}

.action-button.import label {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.action-button.import svg {
  fill: white;
}

.file-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
}

.info-section {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 6px;
  margin-top: 1rem;
}

.info-section h4 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: #333;
}

.info-section p {
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  color: #555;
}

.steps {
  margin: 0.75rem 0 0;
  padding-left: 1.5rem;
  color: #555;
  font-size: 0.95rem;
}

.steps li {
  margin-bottom: 0.5rem;
}

.steps li:last-child {
  margin-bottom: 0;
}
</style>
