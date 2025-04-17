<template>
  <div v-if="isVisible" class="disclaimer-overlay" @click="closeOnOverlay">
    <div class="disclaimer-container" @click.stop>
      <div class="disclaimer-header">
        <h2>Willkommen beim Dienstwagenrechner</h2>
        <button class="close-button" @click="closeDisclaimer">×</button>
      </div>

      <div class="disclaimer-content">
        <div class="disclaimer-section legal">
          <h3>Rechtlicher Hinweis</h3>
          <p>Der Dienstwagenrechner dient ausschließlich zu Informationszwecken und stellt keine steuerliche oder rechtliche Beratung dar. Die Berechnungen basieren auf vereinfachten Modellen und können von den tatsächlichen steuerlichen Auswirkungen abweichen.</p>
          <p>Für verbindliche Aussagen zu deiner individuellen steuerlichen Situation konsultiere bitte einen Steuerberater oder Rechtsanwalt.</p>
        </div>



        <div class="disclaimer-section guide">
          <h3>So geht's</h3>
          <ol>
            <li><strong>Persönliche Daten eingeben</strong> - Trage deine Gehaltsdaten und steuerlichen Informationen ein oder erstelle verschiedene Profile für Vergleichszwecke.</li>
            <li><strong>Dienstwagen hinzufügen</strong> - Füge einen oder mehrere Dienstwagen mit Bruttolistenpreis und weiteren Details hinzu.</li>
            <li><strong>Ergebnisse vergleichen</strong> - Vergleiche die Auswirkungen auf dein Nettogehalt für verschiedene Fahrzeugoptionen.</li>
          </ol>
        </div>
        <div class="disclaimer-section technical">
          <h3>Datenschutz & Technik</h3>
          <p>Diese Anwendung:</p>
          <ul>
            <li><strong>Verwendet den lokalen Speicher (localStorage)</strong> deines Browsers, um deine Eingaben und Einstellungen zu speichern.</li>
            <li><strong>Benötigt keine Cookies</strong> und setzt auch keine für Tracking- oder Werbezwecke ein.</li>
            <li><strong>Sammelt keine analytischen Daten</strong> und sendet keine Informationen an externe Server.</li>
            <li><strong>Funktioniert vollständig lokal</strong> im Browser - deine Daten verlassen zu keinem Zeitpunkt dein Gerät.</li>
          </ul>
          <p>Alle Berechnungen werden direkt im Browser ausgeführt und deine persönlichen Daten werden ausschließlich im lokalen Speicher deines Browsers gespeichert, bis du diesen löschst.</p>
        </div>

        <!-- <div class="disclaimer-section feedback">
          <h3>Feedback & Unterstützung</h3>
          <p>Hast du Ideen zur Verbesserung oder Vorschläge für neue Funktionen?</p>
          <ul>
            <li><strong>Feedback geben:</strong> Erstelle ein <a href="https://github.com/kamilkosek/dienstwagen-rechner/issues" target="_blank" rel="noopener">GitHub Issue</a> mit deinen Anregungen oder gefundenen Fehlern.</li>
            <li><strong>Projekt unterstützen:</strong> Wenn dir dieser Rechner hilft und du die Entwicklung unterstützen möchtest, kannst du mir gerne <a href="https://buymeacoffee.com/kamilkosek" target="_blank" rel="noopener">ein Bier kaufen</a>.</li>
            <a href="https://www.buymeacoffee.com/kamilkosek"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a Beer&emoji=🍻&slug=kamilkosek&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" /></a>
          </ul>
        </div> -->
      </div>

      <div class="disclaimer-footer">
        <button class="btn primary" @click="agreeAndClose">Verstanden</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineExpose } from 'vue'

// Props and emits
defineEmits(['close'])

// State
const isVisible = ref(true)

// Check if user has already seen the disclaimer
onMounted(() => {
  const hasSeenDisclaimer = localStorage.getItem('hasSeenDisclaimer')
  isVisible.value = !hasSeenDisclaimer
})

// Methods
const showDisclaimer = () => {
  isVisible.value = true
}

const closeDisclaimer = () => {
  isVisible.value = false
}

const agreeAndClose = () => {
  localStorage.setItem('hasSeenDisclaimer', 'true')
  isVisible.value = false
}

const closeOnOverlay = (event: MouseEvent) => {
  if ((event.target as HTMLElement).classList.contains('disclaimer-overlay')) {
    closeDisclaimer()
  }
}

// Expose methods to parent component
defineExpose({
  showDisclaimer
})
</script>

<style scoped>
.disclaimer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.disclaimer-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
}

.disclaimer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
}

.disclaimer-header h2 {
  margin: 0;
  font-size: 1.5rem;
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
  background-color: rgba(0,0,0,0.1);
}

.disclaimer-content {
  padding: 1.5rem;
}

.disclaimer-section {
  margin-bottom: 1.5rem;
}

.disclaimer-section.legal {
  background-color: #fff8e1;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #ffc107;
}

.disclaimer-section.guide {
  background-color: #e1f5fe;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #03a9f4;
}
.disclaimer-section.technical {
  background-color: #fee1e1;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #f40303;
}
.disclaimer-section.feedback {
  background-color: #e1fee3;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #03f427;
}

.disclaimer-section h3 {
  margin-top: 0;
  margin-bottom: 0.8rem;
}

.disclaimer-section p {
  margin: 0.5rem 0;
  line-height: 1.5;
}

.disclaimer-section ol {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.disclaimer-section li {
  margin-bottom: 0.8rem;
  line-height: 1.5;
}

.disclaimer-section li:last-child {
  margin-bottom: 0;
}

.disclaimer-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: center;
}

.btn {
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.3s;
}

.btn.primary {
  background-color: #0066cc;
  color: white;
}

.btn.primary:hover {
  background-color: #0055aa;
}

@media (max-width: 768px) {
  .disclaimer-container {
    width: 95%;
    max-height: 95vh;
  }

  .disclaimer-header {
    padding: 0.8rem 1rem;
  }

  .disclaimer-content {
    padding: 1rem;
  }

  .disclaimer-footer {
    padding: 0.8rem 1rem;
  }
}
</style>
