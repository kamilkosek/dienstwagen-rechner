<template>
  <main class="dienstwagen-rechner">
    <header class="header">
      <h1>Dienstwagenrechner</h1>
      <p class="subtitle">
        Vergleiche die finanziellen Auswirkungen verschiedener Dienstwagen auf dein Nettogehalt
      </p>
      <div class="header-buttons">
        <button class="info-button" @click="showDisclaimer" title="Rechtliche Hinweise & Hilfe">
          <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-.001 5.75c.69 0 1.251.56 1.251 1.25s-.561 1.25-1.251 1.25-1.249-.56-1.249-1.25.559-1.25 1.249-1.25zm2.001 12.25h-4v-1c.484-.179 1-.201 1-.735v-4.467c0-.534-.516-.618-1-.797v-1h3v6.265c0 .535.517.558 1 .735v.999z"/>
          </svg>
        </button>
        <a href="https://www.buymeacoffee.com/kamilkosek" target="_blank" rel="noopener" class="bmc-button">
          <img src="https://img.buymeacoffee.com/button-api/?text=Buy me a Beer&emoji=🍻&slug=kamilkosek&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" alt="Buy me a beer" />
        </a>
        <!-- Config button -->
        <button class="header-button config-button" @click="showConfigPopup" title="Konfiguration verwalten">
          <svg class="config-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M24 13.616v-3.232l-2.869-1.02c-.198-.687-.472-1.342-.811-1.955l1.308-2.751-2.285-2.285-2.751 1.307c-.613-.339-1.269-.613-1.955-.811l-1.021-2.869h-3.232l-1.021 2.869c-.686.198-1.342.471-1.955.811l-2.751-1.308-2.285 2.285 1.308 2.752c-.339.613-.614 1.268-.811 1.955l-2.869 1.02v3.232l2.869 1.02c.197.687.472 1.342.811 1.955l-1.308 2.751 2.285 2.286 2.751-1.308c.613.339 1.269.613 1.955.811l1.021 2.869h3.232l1.021-2.869c.687-.198 1.342-.472 1.955-.811l2.751 1.308 2.285-2.286-1.308-2.751c.339-.613.613-1.268.811-1.955l2.869-1.02zm-12 2.384c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z" />
          </svg>
        </button>

        <!-- <a href="https://github.com/kamilkosek/dienstwagen-rechner" target="_blank" rel="noopener" class="github-link">
          <svg class="github-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a> -->
      </div>
    </header>

    <div class="container">
      <UserDataSummary />
      <DienstwagenVergleich />
      <BerechnungsErgebnisse />
    </div>

    <!-- Disclaimer popup -->
    <DisclaimerPopup ref="disclaimerPopupRef" />

    <!-- Configuration popup -->
    <ConfigPopup
      :is-visible="isConfigPopupVisible"
      @close="closeConfigPopup"
      @status-update="handleStatusUpdate"
    />

    <!-- Status message overlay -->
    <div v-if="statusMessage" class="status-message">
      {{ statusMessage }}
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import UserDataSummary from '@/components/UserDataSummary.vue'
import DienstwagenVergleich from '@/components/DienstwagenVergleich.vue'
import BerechnungsErgebnisse from '@/components/BerechnungsErgebnisse.vue'
import DisclaimerPopup from '@/components/DisclaimerPopup.vue'
import ConfigPopup from '@/components/ConfigPopup.vue'

// Reference components
const disclaimerPopupRef = ref<InstanceType<typeof DisclaimerPopup> | null>(null)
const isConfigPopupVisible = ref<boolean>(false)
const statusMessage = ref<string>('')

// Method to show the disclaimer popup
const showDisclaimer = () => {
  if (disclaimerPopupRef.value) {
    disclaimerPopupRef.value.showDisclaimer()
  }
}

// Method to show the configuration popup
const showConfigPopup = () => {
  isConfigPopupVisible.value = true
}

// Method to hide the configuration popup
const closeConfigPopup = () => {
  isConfigPopupVisible.value = false
}

// Handle status updates from the config popup
const handleStatusUpdate = (message: string) => {
  showTemporaryMessage(message)
}

// Helper function to show and hide status messages
const showTemporaryMessage = (message: string) => {
  statusMessage.value = message

  // Clear the message after a short delay
  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}
</script>

<style scoped>
.dienstwagen-rechner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
  padding-top: 45px; /* Add spacing for the buttons */
}

h1 {
  color: #0066cc;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
  margin-top: 0;
}

.header-buttons {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.github-link, .info-button, .header-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  transition: transform 0.2s ease;
  background: none;
  border: none;
  cursor: pointer;
}

.export-icon {
  fill: #35c759;
  transition: fill 0.2s ease;
}

.import-icon {
  fill: #007aff;
  transition: fill 0.2s ease;
}

.header-button:hover .export-icon {
  fill: #27a348;
}

.header-button:hover .import-icon {
  fill: #0055aa;
}

.header-button:hover {
  transform: scale(1.1);
}

.file-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
}

.import-button {
  position: relative;
}

.status-message {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(46, 125, 50, 0.9);
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 500;
  z-index: 1000;
  animation: fadeIn 0.3s, fadeOut 0.3s 2.7s;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, 20px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

@keyframes fadeOut {
  from { opacity: 1; transform: translate(-50%, 0); }
  to { opacity: 0; transform: translate(-50%, 20px); }
}

.bmc-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  transition: transform 0.2s ease;
}

.bmc-button img {
  height: 36px;
  width: auto;
  max-width: 130px;
}

.github-link:hover, .info-button:hover {
  transform: scale(1.1);
}

.github-icon {
  fill: #333;
  transition: fill 0.2s ease;
}

.info-icon {
  fill: #0066cc;
  transition: fill 0.2s ease;
}

.github-link:hover .github-icon {
  fill: #0066cc;
}

.info-button:hover .info-icon {
  fill: #0055aa;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

@media (max-width: 768px) {
  .dienstwagen-rechner {
    padding: 0.5rem;
  }

  .github-link {
    top: -10px;
    right: -10px;
  }
}
</style>
