<template>
  <div class="salary-chart-container">
    <h3>Bruttogehalt und Abzüge im Vergleich</h3>
    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { DienstwagenVergleich } from '@/types';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BarController } from 'chart.js';
import { useCalculatorStore } from '@/stores/calculator';

// Register required Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BarController);

const props = defineProps<{
  vergleichsErgebnisse: DienstwagenVergleich[];
  formatCurrency: (value: number) => string;
}>();

const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;
const store = useCalculatorStore();

// Format the currency values for the chart
const formatCurrencyValue = (value: number): string => {
  return props.formatCurrency(value);
};

// Get details for each abzug category for stacked bars
const getDeductionData = (bruttoGehalt: number, geldwerterVorteil: number = 0, eigenanteilBetrag: number = 0) => {
  // Angepasstes Bruttogehalt (nach Eigenanteilabzug)
  const adjustedBrutto = bruttoGehalt - eigenanteilBetrag;

  // Berechnung der Steuer mit/ohne geldwerten Vorteil
  const einkommensteuer = store.calculateEinkommensteuer(adjustedBrutto + geldwerterVorteil);
  const kirchensteuer = store.calculateKirchensteuer(einkommensteuer);

  // Sozialabgaben werden auf das angepasste Bruttogehalt berechnet
  const sozialabgaben = store.calculateSozialversicherung(adjustedBrutto);

  return {
    einkommensteuer,
    kirchensteuer,
    krankenversicherung: sozialabgaben.krankenversicherung,
    pflegeversicherung: sozialabgaben.pflegeversicherung,
    rentenversicherung: sozialabgaben.rentenversicherung,
    arbeitslosenversicherung: sozialabgaben.arbeitslosenversicherung,
    eigenanteil: eigenanteilBetrag,
    netto: adjustedBrutto - einkommensteuer - kirchensteuer - sozialabgaben.gesamt
  };
};

// Create or update the chart
const updateChart = () => {
  if (!chartCanvas.value || props.vergleichsErgebnisse.length === 0) return;

  // Basiswert - Bruttogehalt vom Store holen
  const bruttoMonatsgehalt = store.userData.bruttoMonatsgehalt;

  // Labels für das Chart
  const labels = ['Ohne Dienstwagen', ...props.vergleichsErgebnisse.map(v => v.dienstwagen.name)];

  // Deduktionsdaten für jeden Balken
  const ohneDeductions = getDeductionData(bruttoMonatsgehalt);

  // Daten für die gestapelten Balken
  const mitDeductions = props.vergleichsErgebnisse.map(v => {
    return getDeductionData(
      bruttoMonatsgehalt,
      v.ergebnis.geldwerterVorteil,
      v.ergebnis.eigenanteilBetrag
    );
  });

  // Nettogehälter für die Anzeige
  const nettoWerte = [ohneDeductions.netto, ...mitDeductions.map(d => d.netto)];

  // Erstelle Daten für die einzelnen Abzugskategorien
  const lohnsteuerData = [ohneDeductions.einkommensteuer, ...mitDeductions.map(d => d.einkommensteuer)];
  const kirchensteuerData = [ohneDeductions.kirchensteuer, ...mitDeductions.map(d => d.kirchensteuer)];
  const krankenversicherungData = [ohneDeductions.krankenversicherung, ...mitDeductions.map(d => d.krankenversicherung)];
  const pflegeversicherungData = [ohneDeductions.pflegeversicherung, ...mitDeductions.map(d => d.pflegeversicherung)];
  const rentenversicherungData = [ohneDeductions.rentenversicherung, ...mitDeductions.map(d => d.rentenversicherung)];
  const arbeitslosenversicherungData = [ohneDeductions.arbeitslosenversicherung, ...mitDeductions.map(d => d.arbeitslosenversicherung)];
  const eigenanteilData = [0, ...mitDeductions.map(d => d.eigenanteil)];

  // Generate colors based on whether the car is an advantage or disadvantage
  const barColors = ['#0066cc', ...props.vergleichsErgebnisse.map(v =>
    v.ergebnis.nettoDifferenz >= 0 ? '#4caf50' : '#f44336'
  )];

  // Destroy existing chart if it exists
  if (chart) {
    chart.destroy();
  }

  // Create new chart
  chart = new Chart(chartCanvas.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        // Nettogehalt
        {
          label: 'Nettogehalt',
          data: nettoWerte,
          backgroundColor: barColors,
          stack: 'Gehalt'
        },
        // Lohnsteuer
        {
          label: 'Lohnsteuer',
          data: lohnsteuerData,
          backgroundColor: '#f57c00',
          stack: 'Gehalt'
        },
        // Kirchensteuer (wenn vorhanden)
        {
          label: 'Kirchensteuer',
          data: kirchensteuerData,
          backgroundColor: '#9c27b0',
          stack: 'Gehalt'
        },
        // Krankenversicherung
        {
          label: 'Krankenversicherung',
          data: krankenversicherungData,
          backgroundColor: '#2196f3',
          stack: 'Gehalt'
        },
        // Pflegeversicherung
        {
          label: 'Pflegeversicherung',
          data: pflegeversicherungData,
          backgroundColor: '#03a9f4',
          stack: 'Gehalt'
        },
        // Rentenversicherung
        {
          label: 'Rentenversicherung',
          data: rentenversicherungData,
          backgroundColor: '#00bcd4',
          stack: 'Gehalt'
        },
        // Arbeitslosenversicherung
        {
          label: 'Arbeitslosenversicherung',
          data: arbeitslosenversicherungData,
          backgroundColor: '#009688',
          stack: 'Gehalt'
        },
        // Eigenanteil
        {
          label: 'Eigenanteil',
          data: eigenanteilData,
          backgroundColor: '#ff5722',
          stack: 'Gehalt'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrencyValue(value as number);
            }
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            padding: 20,
            boxWidth: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.raw as number;
              return `${label}: ${formatCurrencyValue(value)}`;
            },
            footer: function(tooltipItems) {
              const datasetIndex = tooltipItems[0].datasetIndex;
              const dataIndex = tooltipItems[0].dataIndex;

              // Wenn es das Nettogehalt-Dataset ist, zeige die Nettodifferenz für Dienstwagen (nicht für den ersten Balken)
              if (datasetIndex === 0 && dataIndex > 0) {
                const nettoDifferenz = props.vergleichsErgebnisse[dataIndex-1].ergebnis.nettoDifferenz;
                const sign = nettoDifferenz >= 0 ? '+' : '';
                return [`Nettodifferenz: ${sign}${formatCurrencyValue(nettoDifferenz)}`];
              }
              return [];
            }
          },
          titleFont: {
            weight: 'bold',
            size: 14
          },
          bodyFont: {
            size: 13
          },
          footerFont: {
            weight: 'bold',
            size: 13
          },
          padding: 10
        },
      }
    }
  });
};

// Update chart when vergleichsErgebnisse changes
watch(() => props.vergleichsErgebnisse, () => {
  updateChart();
}, { deep: true });

// Initialize chart
onMounted(() => {
  updateChart();
});
</script>

<style scoped>
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
  height: 400px;
  margin: 0 auto;
  max-width: 900px;
}
</style>
