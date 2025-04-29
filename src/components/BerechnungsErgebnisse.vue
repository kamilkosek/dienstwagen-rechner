<template>
  <div class="ergebnisse-container">
    <div v-if="vergleichsErgebnisse.length > 0" class="results">
      <div class="baseline-info">
        <h3>Ausgangssituation</h3>
        <p class="salary-info">
          <span class="label">Bruttogehalt:</span>
          <span class="value">{{ formatCurrency(userData.bruttoMonatsgehalt) }}</span> / Monat
        </p>
        <p class="salary-info">
          <span class="label">Nettogehalt ohne Dienstwagen:</span>
          <span class="value highlight">{{ formatCurrency(vergleichsErgebnisse[0].ergebnis.nettoOhneDienstwagen) }}</span> / Monat
        </p>
      </div>

      <div class="results-table-container">
        <table class="results-table">
          <thead>
            <tr>
              <th class="attribute-column"></th>
              <th
                v-for="vergleich in vergleichsErgebnisse"
                :key="vergleich.dienstwagen.id"
                :class="{
                  'cheapest-car': isCheapestCar(vergleich.dienstwagen.bruttolistenpreis),
                  'selected-car': isCarSelected(vergleich.dienstwagen.id)
                }"
                @click="toggleCarSelection(vergleich.dienstwagen.id)"
              >
                <div class="car-header">
                  {{ vergleich.dienstwagen.name }}
                  <span v-if="isCheapestCar(vergleich.dienstwagen.bruttolistenpreis)" class="cheapest-indicator">(günstigster)</span>
                  <span v-if="isCarSelected(vergleich.dienstwagen.id)" class="selection-indicator">
                    {{ selectedCars.indexOf(vergleich.dienstwagen.id) + 1 }}
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- Bruttolistenpreis -->
            <tr>
              <td class="attribute-label">Bruttolistenpreis</td>
              <td v-for="vergleich in vergleichsErgebnisse"
                  :key="vergleich.dienstwagen.id"
                  :class="{'cheapest-car': isCheapestCar(vergleich.dienstwagen.bruttolistenpreis)}">
                {{ formatCurrency(vergleich.dienstwagen.bruttolistenpreis) }}
              </td>
            </tr>

            <!-- Versteuerungstyp -->
            <tr>
              <td class="attribute-label">Versteuerungstyp</td>
              <td v-for="vergleich in vergleichsErgebnisse"
                  :key="vergleich.dienstwagen.id"
                  :class="{'cheapest-car': isCheapestCar(vergleich.dienstwagen.bruttolistenpreis)}">
                {{ vergleich.dienstwagen.versteuerungsTyp === 'voll' ? '1% (Verbrenner)' :
                   vergleich.dienstwagen.versteuerungsTyp === 'hybrid' ? '0,5% (Hybrid)' : '0,25% (Elektro)' }}
              </td>
            </tr>

            <!-- Geldwerter Vorteil -->
            <tr>
              <td class="attribute-label">Geldwerter Vorteil</td>
              <td v-for="vergleich in vergleichsErgebnisse"
                  :key="vergleich.dienstwagen.id"
                  :class="{'cheapest-car': isCheapestCar(vergleich.dienstwagen.bruttolistenpreis)}">
                {{ formatCurrency(vergleich.ergebnis.geldwerterVorteil) }} / Monat
              </td>
            </tr>

            <!-- Steuerbelastung -->
            <tr>
              <td class="attribute-label">Steuerbelastung</td>
              <td v-for="vergleich in vergleichsErgebnisse"
                  :key="vergleich.dienstwagen.id"
                  :class="{'cheapest-car': isCheapestCar(vergleich.dienstwagen.bruttolistenpreis)}">
                {{ formatCurrency(vergleich.ergebnis.steuerbelastung) }} / Monat
              </td>
            </tr>

            <!-- Eigenanteil vom Brutto -->
            <tr>
              <td class="attribute-label">Eigenanteil vom Brutto</td>
              <td v-for="vergleich in vergleichsErgebnisse"
                  :key="vergleich.dienstwagen.id"
                  :class="{'cheapest-car': isCheapestCar(vergleich.dienstwagen.bruttolistenpreis)}">
                {{ vergleich.ergebnis.eigenanteilBetrag > 0
                   ? " - " + formatCurrency(vergleich.ergebnis.eigenanteilBetrag) + ' / Monat'
                   : '–' }}
              </td>
            </tr>

            <!-- Netto-Differenz -->
            <tr class="netto-difference-row">
              <td class="attribute-label">Netto-Differenz</td>
              <td
                v-for="vergleich in vergleichsErgebnisse"
                :key="vergleich.dienstwagen.id"
                :class="{
                  'positive': vergleich.ergebnis.nettoDifferenz >= 0,
                  'negative': vergleich.ergebnis.nettoDifferenz < 0,
                  'cheapest-car': isCheapestCar(vergleich.dienstwagen.bruttolistenpreis)
                }"
              >
                {{ formatCurrency(Math.abs(vergleich.ergebnis.nettoDifferenz)) }} / Monat
                {{ vergleich.ergebnis.nettoDifferenz >= 0 ? '(Vorteil)' : '(Nachteil)' }}
              </td>
            </tr>

            <!-- Gesamtkosten über wählbaren Zeitraum -->
            <tr class="total-cost-row">
              <td class="attribute-label">
                <div class="month-selector">
                  <span>Kosten über</span>
                  <select v-model.number="selectedMonths" class="months-dropdown">
                    <option v-for="month in availableMonths" :key="month" :value="month">{{ month }}</option>
                  </select>
                  <span>Monate</span>
                </div>
              </td>
              <td
                v-for="vergleich in vergleichsErgebnisse"
                :key="vergleich.dienstwagen.id"
                :class="{
                  'positive': vergleich.ergebnis.nettoDifferenz >= 0,
                  'negative': vergleich.ergebnis.nettoDifferenz < 0,
                  'cheapest-car': isCheapestCar(vergleich.dienstwagen.bruttolistenpreis)
                }"
              >
                {{ formatCurrency(Math.abs(vergleich.ergebnis.nettoDifferenz * selectedMonths)) }}
                {{ vergleich.ergebnis.nettoDifferenz >= 0 ? '(Gesamtvorteil)' : '(Gesamtnachteil)' }}
              </td>
            </tr>

            <!-- Direktvergleich Auswahl -->
            <tr class="comparison-selection-row">
              <td class="attribute-label">Direktvergleich</td>
              <td
                v-for="vergleich in vergleichsErgebnisse"
                :key="vergleich.dienstwagen.id"
                :class="{
                  'selected-for-comparison': isCarSelected(vergleich.dienstwagen.id),
                  'cheapest-car': isCheapestCar(vergleich.dienstwagen.bruttolistenpreis)
                }"
                @click="toggleCarSelection(vergleich.dienstwagen.id)"
              >
                <div class="comparison-selection">
                  {{ isCarSelected(vergleich.dienstwagen.id) ?
                    'Ausgewählt für Vergleich (' + (selectedCars.indexOf(vergleich.dienstwagen.id) + 1) + '/2)' :
                    'Klicken zur Auswahl' }}
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <!-- Effektives Nettogehalt -->
            <tr class="effektives-nettogehalt-row">
              <td class="attribute-label">Effektives Nettogehalt</td>
              <td
                v-for="vergleich in vergleichsErgebnisse"
                :key="vergleich.dienstwagen.id"
                :class="{
                  'positive': vergleich.ergebnis.nettoDifferenz >= 0,
                  'negative': vergleich.ergebnis.nettoDifferenz < 0,
                  'cheapest-car': isCheapestCar(vergleich.dienstwagen.bruttolistenpreis)
                }"
              >
                {{ formatCurrency(vergleich.ergebnis.nettoOhneDienstwagen + vergleich.ergebnis.nettoDifferenz) }} / Monat
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Car comparison section -->
      <div v-if="selectedCarsForComparison" class="car-comparison">
        <h3>Vergleich ausgewählter Fahrzeuge</h3>
        <div class="comparison-content">
          <div class="comparison-header">
            <div class="comparison-car">{{ selectedCarsForComparison.car1.dienstwagen.name }}</div>
            <div class="comparison-vs">vs.</div>
            <div class="comparison-car">{{ selectedCarsForComparison.car2.dienstwagen.name }}</div>
          </div>

          <div class="comparison-details">
            <div class="comparison-item">
              <div class="comparison-label">Monatliche Differenz:</div>
              <div class="comparison-value" :class="{'positive': selectedCarsForComparison.monthlyDiff > 0}">
                {{ formatCurrency(Math.abs(selectedCarsForComparison.monthlyDiff)) }} / Monat
                <span class="comparison-note">
                  {{ selectedCarsForComparison.monthlyDiff > 0 ?
                    `(${selectedCarsForComparison.car1.dienstwagen.name} ist günstiger)` :
                    `(${selectedCarsForComparison.car2.dienstwagen.name} ist günstiger)` }}
                </span>
              </div>
            </div>

            <div class="comparison-item">
              <div class="comparison-label">Differenz über {{ selectedMonths }} Monate:</div>
              <div class="comparison-value" :class="{'positive': selectedCarsForComparison.totalDiff > 0}">
                {{ formatCurrency(Math.abs(selectedCarsForComparison.monthlyDiff * selectedMonths)) }}
                <span class="comparison-note">
                  {{ selectedCarsForComparison.totalDiff > 0 ?
                    `(${selectedCarsForComparison.car1.dienstwagen.name} ist günstiger)` :
                    `(${selectedCarsForComparison.car2.dienstwagen.name} ist günstiger)` }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="comparison-info">
          <p>Klicke auf die Spaltenköpfe, um andere Fahrzeuge für den Vergleich auszuwählen.</p>
        </div>
      </div>

      <div v-else-if="selectedCars.length === 1" class="car-comparison-hint">
        <p>Wähle ein weiteres Fahrzeug aus, um einen Vergleich zu sehen.</p>
      </div>

      <!-- Gehalt Balkendiagramm -->
      <GehaltsVergleichsChart
        :vergleichsErgebnisse="vergleichsErgebnisse"
        :formatCurrency="formatCurrency"
      />

      <div class="explanation">
        <h3>Erklärung</h3>
        <p>
          Diese Berechnung zeigt die finanzielle Auswirkung eines Dienstwagens auf dein Nettogehalt.
          Der geldwerte Vorteil wird je nach Fahrzeugtyp mit 0,25% (Elektro), 0,5% (Hybrid) oder 1% (Verbrenner)
          des Bruttolistenpreises pro Monat berechnet und zu deinem zu versteuernden Einkommen hinzugerechnet.
        </p>
        <p>
          Der Eigenanteil beträgt standardmäßig 1,5% des Betrags über 45.000€ vom Bruttolistenpreis und wird monatlich
          vom Bruttogehalt abgezogen. Bei manchen Fahrzeugen können auch andere Eigenanteile definiert sein (z.B. 1% ab 47.000€).
          Bei Fahrzeugen mit einem Listpreis unter der definierten Grenze fällt kein Eigenanteil an.
        </p>

        <h4>Berechnete Ausgaben für das Nettogehalt</h4>
        <p>
          Bei der Berechnung des Nettogehalts werden folgende Ausgaben berücksichtigt:
        </p>
        <ul class="explanation-list">
          <li><strong>Einkommensteuer:</strong> Berechnet nach dem Steuertarif 2025, abhängig von deinem Bruttoeinkommen und deiner Steuerklasse.</li>
          <li><strong>Kirchensteuer:</strong> Falls aktiviert, 8% (Bayern, Baden-Württemberg) oder 9% (andere Bundesländer) der Einkommensteuer.</li>
          <li><strong>Krankenversicherung:</strong> Basierend auf deinen angegebenen Sätzen, berechnet bis zur Beitragsbemessungsgrenze (5.512,50€ in 2025).</li>
          <li><strong>Pflegeversicherung:</strong> Abhängig von Alter, Anzahl der Kinder und Bundesland (zusätzlicher Satz in Sachsen).</li>
          <li><strong>Rentenversicherung:</strong> Basierend auf dem angegebenen Satz (Standard: 18,6%), berechnet bis zur Beitragsbemessungsgrenze (8.050,00€ in 2025).</li>
          <li><strong>Arbeitslosenversicherung:</strong> 2,6% (Arbeitnehmeranteil: 1,3%), berechnet bis zur Beitragsbemessungsgrenze der Rentenversicherung.</li>
        </ul>

        <p>
          Die Netto-Differenz zeigt, wie sich dein monatlich verfügbares Einkommen durch den Dienstwagen verändert,
          nachdem alle zusätzlichen Steuern, Abgaben und der Eigenanteil berücksichtigt wurden.
          Ein positiver Wert bedeutet einen finanziellen Vorteil für dich.
        </p>
      </div>
    </div>

    <div v-else class="no-results">
      <p>Füge mindestens einen Dienstwagen hinzu, um Berechnungen anzuzeigen.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCalculatorStore } from '@/stores/calculator'
import GehaltsVergleichsChart from './GehaltsVergleichsChart.vue'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

// Register required Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const store = useCalculatorStore()

// Get user data and comparison results from store
const userData = computed(() => store.userData)
const vergleichsErgebnisse = computed(() => store.vergleichsErgebnisse)

// Chart data and options are moved to GehaltsVergleichsChart.vue component

// Number of months for total cost calculation
const selectedMonths = ref<number>(36) // Default: 36 months
const availableMonths = [12, 24, 36, 48, 60] // Available options for months dropdown

// Selected cars for comparison
const selectedCars = ref<string[]>([])

// Toggle car selection for comparison
const toggleCarSelection = (dienstwagenId: string) => {
  const index = selectedCars.value.indexOf(dienstwagenId)

  if (index === -1) {
    // If not selected and we have less than 2 cars, add it
    if (selectedCars.value.length < 2) {
      selectedCars.value.push(dienstwagenId)
    } else {
      // If we already have 2 cars, replace the first one
      selectedCars.value.shift() // Remove first car
      selectedCars.value.push(dienstwagenId) // Add new car
    }
  } else {
    // If already selected, remove it
    selectedCars.value.splice(index, 1)
  }
}

// Check if a car is selected
const isCarSelected = (dienstwagenId: string): boolean => {
  return selectedCars.value.includes(dienstwagenId)
}

// Get the two selected car objects for comparison
const selectedCarsForComparison = computed(() => {
  if (selectedCars.value.length !== 2) return null

  const car1 = vergleichsErgebnisse.value.find(v => v.dienstwagen.id === selectedCars.value[0])
  const car2 = vergleichsErgebnisse.value.find(v => v.dienstwagen.id === selectedCars.value[1])

  if (!car1 || !car2) return null

  const monthlyDiff = car1.ergebnis.nettoDifferenz - car2.ergebnis.nettoDifferenz
  const totalDiff = monthlyDiff * 36 // 36 months

  return {
    car1,
    car2,
    monthlyDiff,
    totalDiff
  }
})

// Find the cheapest car's price
const cheapestCarPrice = computed(() => {
  if (vergleichsErgebnisse.value.length === 0) return 0
  return Math.min(...vergleichsErgebnisse.value.map(v => v.dienstwagen.bruttolistenpreis))
})

// Check if this car is the cheapest
const isCheapestCar = (price: number): boolean => {
  return price === cheapestCarPrice.value
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
.ergebnisse-container {
  margin-top: 2rem;
}

.baseline-info {
  background-color: #f0f8ff;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.salary-info {
  display: flex;
  justify-content: space-between;
  font-size: 1.1rem;
  margin: 0.5rem 0;
}

.label {
  font-weight: 500;
}

.value {
  font-weight: bold;
}

.value.highlight {
  color: #0066cc;
}

.results-table-container {
  margin-bottom: 2rem;
  overflow-x: auto;
  position: relative;
  max-width: 100%;
}

.results-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  box-shadow: 0 3px 6px rgba(0,0,0,0.08);
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  table-layout: auto;
}

.results-table th,
.results-table td {
  padding: 0.8rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.results-table th {
  background-color: #0066cc;
  color: white;
  font-weight: 600;
  white-space: nowrap;
  min-width: 160px;
}

/* Mobile-specific styles for denser table */
@media (max-width: 767px) {
  .results-table th,
  .results-table td {
    padding: 0.3rem;
    font-size: 0.85rem;
  }

  .results-table th {
    min-width: 120px;
  }

  .ergebnisse-container {
    padding: 0.3rem;
    margin-top: 1rem;
  }
}

.attribute-column {
  position: sticky;
  left: 0;
  z-index: 2;
  background-color: #f5f5f5;
  min-width: 180px;
  max-width: 200px;
  border-right: 1px solid #e0e0e0;
}

.attribute-label {
  position: sticky;
  left: 0;
  z-index: 1;
  background-color: #f5f5f5;
  border-right: 1px solid #e0e0e0;
}

.attribute-label {
  font-weight: 500;
}

.cheapest-car {
  background-color: #e8f5e9 !important;
}

th.cheapest-car {
  background-color: #2e7d32 !important;
}

.cheapest-indicator {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  margin-top: 0.25rem;
}

/* Car selection styling */
.car-header {
  position: relative;
  cursor: pointer;
}

th.selected-car {
  background-color: #5c6bc0 !important;
  position: relative;
}

.selection-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #ff9800;
  color: white;
  font-weight: bold;
  font-size: 0.9rem;
}

/* Car comparison styling */
.car-comparison {
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.car-comparison h3 {
  margin-top: 0;
  margin-bottom: 1.2rem;
  color: #333;
}

.comparison-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.comparison-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.comparison-car {
  font-weight: bold;
  font-size: 1.2rem;
}

.comparison-vs {
  font-size: 1rem;
  color: #666;
}

.comparison-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Styling for the comparison selection row */
.comparison-selection-row td {
  padding: 1rem;
  text-align: center;
}

.comparison-selection {
  padding: 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.95rem;
  color: #666;
}

td.selected-for-comparison {
  background-color: #e3f2fd !important;
}

td.selected-for-comparison .comparison-selection {
  color: #0066cc;
  font-weight: bold;
}

.comparison-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1rem;
  background-color: #f5f5f5;
  border-radius: 6px;
}

.comparison-label {
  font-weight: 500;
}

.comparison-value {
  font-weight: bold;
  color: #c62828;
}

.comparison-value.positive {
  color: #2e7d32;
}

.comparison-note {
  display: block;
  font-size: 0.85rem;
  font-weight: normal;
  margin-top: 0.3rem;
}

.comparison-info {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
}

.car-comparison-hint {
  background-color: #fff3e0;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  text-align: center;
  color: #e65100;
}

.netto-difference-row td {
  border-bottom: none;
  border-top: 1px solid #eee;
  padding-top: 1rem;
}

.netto-difference-row td.positive {
  color: #2e7d32;
}

.netto-difference-row td.negative {
  color: #c62828;
}

.effektives-nettogehalt-row {
  font-weight: bold;
  background-color: #f5f5f5;
}

.effektives-nettogehalt-row td.positive {
  background-color: #e8f5e9;
}

.effektives-nettogehalt-row td.negative {
  background-color: #ffebee;
}

.effektives-nettogehalt-row td {
  padding: 1rem;
  color: #0066cc;
}

.netto-difference {
  font-size: 1.1rem;
  font-weight: bold;
  border-top: 1px solid #eee;
  padding-top: 0.8rem;
  margin-top: 0.5rem;
}

.netto-difference.positive .detail-value {
  color: #2e7d32;
}

.netto-difference:not(.positive) .detail-value {
  color: #c62828;
}

.result-summary {
  background-color: #f5f5f5;
  padding: 1rem 1.2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1rem;
  font-weight: bold;
}

.result-summary.positive {
  background-color: #e8f5e9;
}

.result-summary:not(.positive) {
  background-color: #ffebee;
}

.summary-value {
  color: #0066cc;
}

.no-results {
  text-align: center;
  background-color: #f5f5f5;
  padding: 2rem;
  border-radius: 8px;
  color: #666;
}

.explanation {
  background-color: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 2rem;
}

.explanation h3 {
  margin-top: 0;
}

.explanation p {
  line-height: 1.6;
  margin-bottom: 1rem;
}

.explanation p:last-child {
  margin-bottom: 0;
}

.salary-chart-container {
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.salary-chart-container h3 {
  margin-top: 0;
  margin-bottom: 1.2rem;
  color: #333;
  text-align: center;
}

.chart-container {
  position: relative;
  height: 300px;
  margin: 0 auto;
  max-width: 900px;
}
</style>
