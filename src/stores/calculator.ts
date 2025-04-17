import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserData, UserProfile, DienstwagenData, DienstwagenVergleich, BerechnungsErgebnis } from '@/types'
import { importConfiguration, exportConfiguration } from '@/utils/importExport'

// Default user data values
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

export const useCalculatorStore = defineStore('calculator', () => {
  // User profiles collection
  const userProfiles = ref<UserProfile[]>([])

  // Active profile ID
  const activeProfileId = ref<string | null>(null)

  // Active user data (points to the selected profile's data)
  const userData = computed<UserData>(() => {
    const activeProfile = userProfiles.value.find(profile => profile.id === activeProfileId.value)
    return activeProfile?.userData || defaultUserData
  })

  // List of cars to compare
  const dienstwagen = ref<DienstwagenData[]>([])

  // Load data from localStorage on initialization
  const loadFromLocalStorage = () => {
    const savedProfiles = localStorage.getItem('userProfiles')
    const savedActiveProfileId = localStorage.getItem('activeProfileId')
    const savedDienstwagen = localStorage.getItem('dienstwagen')

    if (savedProfiles) {
      userProfiles.value = JSON.parse(savedProfiles)
    } else {
      // Create default profile if none exists
      const defaultProfile: UserProfile = {
        id: crypto.randomUUID(),
        name: 'Standard-Profil',
        userData: { ...defaultUserData }
      }
      userProfiles.value = [defaultProfile]
      activeProfileId.value = defaultProfile.id
      saveToLocalStorage()
    }

    if (savedActiveProfileId) {
      activeProfileId.value = JSON.parse(savedActiveProfileId)
    } else if (userProfiles.value.length > 0) {
      activeProfileId.value = userProfiles.value[0].id
    }

    if (savedDienstwagen) {
      dienstwagen.value = JSON.parse(savedDienstwagen)
    }
  }

  // Save data to localStorage
  const saveToLocalStorage = () => {
    localStorage.setItem('userProfiles', JSON.stringify(userProfiles.value))
    localStorage.setItem('activeProfileId', JSON.stringify(activeProfileId.value))
    localStorage.setItem('dienstwagen', JSON.stringify(dienstwagen.value))
  }

  // Add a car to comparison
  const addDienstwagen = (car: DienstwagenData) => {
    dienstwagen.value.push({
      ...car,
      id: crypto.randomUUID()
    })
    saveToLocalStorage()
  }

  // Remove a car from comparison
  const removeDienstwagen = (id: string) => {
    dienstwagen.value = dienstwagen.value.filter(car => car.id !== id)
    saveToLocalStorage()
  }

  // Update an existing car
  const updateDienstwagen = (updatedCar: DienstwagenData) => {
    const index = dienstwagen.value.findIndex(car => car.id === updatedCar.id)
    if (index !== -1) {
      dienstwagen.value[index] = { ...updatedCar }
      saveToLocalStorage()
    }
  }

  // Add a new profile
  const addProfile = (name: string, baseUserData: UserData = defaultUserData) => {
    const newProfile: UserProfile = {
      id: crypto.randomUUID(),
      name,
      userData: { ...baseUserData }
    }
    userProfiles.value.push(newProfile)
    activeProfileId.value = newProfile.id
    saveToLocalStorage()
    return newProfile
  }

  // Update profile name
  const updateProfileName = (id: string, name: string) => {
    const profile = userProfiles.value.find(p => p.id === id)
    if (profile) {
      profile.name = name
      saveToLocalStorage()
    }
  }

  // Delete a profile
  const deleteProfile = (id: string) => {
    userProfiles.value = userProfiles.value.filter(profile => profile.id !== id)

    // If we deleted the active profile, switch to another one
    if (activeProfileId.value === id) {
      activeProfileId.value = userProfiles.value.length > 0 ? userProfiles.value[0].id : null

      // If no profiles left, create a default one
      if (userProfiles.value.length === 0) {
        const defaultProfile = addProfile('Standard-Profil')
        activeProfileId.value = defaultProfile.id
      }
    }

    saveToLocalStorage()
  }

  // Set active profile
  const setActiveProfile = (id: string) => {
    const profileExists = userProfiles.value.some(profile => profile.id === id)
    if (profileExists) {
      activeProfileId.value = id
      saveToLocalStorage()
      return true
    }
    return false
  }

  // Update user data
  const updateUserData = (data: Partial<UserData>) => {
    const activeProfile = userProfiles.value.find(profile => profile.id === activeProfileId.value)
    if (activeProfile) {
      activeProfile.userData = { ...activeProfile.userData, ...data }
      saveToLocalStorage()
    }
  }

  // Calculate income tax (Lohnsteuer)
  const calculateEinkommensteuer = (brutto: number, customUserData?: UserData): number => {
    if (brutto <= 0) return 0;

    // Use provided custom userData or the default store userData
    const data = customUserData || userData.value;

    // 2025 parameters
    const grundfreibetrag = 12084; // Basic tax-free amount for 2025

    // Convert monthly gross to annual for tax calculation
    const bruttoJaehrlich = brutto * 12;

    // Apply monthly tax-free amount
    const jaehrlicherFreibetrag = data.monatsfreibetrag * 12;

    // Calculate taxable income
    const zuVersteuerndesEinkommen = Math.max(0, (bruttoJaehrlich - grundfreibetrag - jaehrlicherFreibetrag));

    // Calculate income tax based on 2025 tax brackets and tax class
    let einkommensteuerJahr = 0;
    const steuerklasse = data.steuerklasse;

    // Special case for tax class 3 (married, splitting)
    if (steuerklasse === 3) {
      // Apply splitting method (half income, calculate tax, double result)
      let E = zuVersteuerndesEinkommen / 2; // Splitting

      let est = 0;
      if (E <= 0) {
        est = 0;
      } else if (E <= 15999) {
        // Calculate using formula for first bracket - grundfreibetrag is already subtracted in zuVersteuerndesEinkommen
        const y = E / 10000;
        est = (979.18 * y + 1755) * y;
      } else if (E <= 62809) {
        const z = (E - 16000) / 10000;
        est = (192.59 * z + 2239) * z + 1068;
      } else if (E <= 277825) {
        est = 0.42 * E - 9136;
      } else {
        est = 0.45 * E - 17374;
      }

      einkommensteuerJahr = est * 2; // Double the tax for splitting
    } else {
      // For other tax classes, use a simplified approximation
      let basisSteuer = 0;

      if (zuVersteuerndesEinkommen <= 0) {
        basisSteuer = 0;
      } else if (zuVersteuerndesEinkommen <= 15999) {
        // grundfreibetrag is already subtracted in zuVersteuerndesEinkommen
        const y = zuVersteuerndesEinkommen / 10000;
        basisSteuer = (979.18 * y + 1755) * y;
      } else if (zuVersteuerndesEinkommen <= 62809) {
        const z = (zuVersteuerndesEinkommen - 16000) / 10000;
        basisSteuer = (192.59 * z + 2239) * z + 1068;
      } else if (zuVersteuerndesEinkommen <= 277825) {
        basisSteuer = 0.42 * zuVersteuerndesEinkommen - 9136;
      } else {
        basisSteuer = 0.45 * zuVersteuerndesEinkommen - 17374;
      }

      // Apply tax class factors
      switch (steuerklasse) {
        case 1:
        case 4:
          einkommensteuerJahr = basisSteuer;
          break;
        case 2:
          einkommensteuerJahr = basisSteuer * 0.90; // Relief for single parents
          break;
        case 5:
          einkommensteuerJahr = basisSteuer * 1.35; // Higher tax for secondary earner
          break;
        case 6:
          einkommensteuerJahr = Math.max(zuVersteuerndesEinkommen * 0.27, basisSteuer * 1.15); // Secondary job
          break;
      }
    }

    // Return monthly income tax
    return einkommensteuerJahr / 12;
  }

  // Calculate church tax (Kirchensteuer)
  const calculateKirchensteuer = (einkommensteuer: number, customUserData?: UserData): number => {
    // Use provided custom userData or the default store userData
    const data = customUserData || userData.value;

    if (!data.kirchensteuer) return 0;

    const kirchensteuerSatz = data.bundesland === 'Bayern' ||
                             data.bundesland === 'Baden-Württemberg' ? 0.08 : 0.09;

    return einkommensteuer * kirchensteuerSatz;
  }

  // Calculate solidarity surcharge (Solidaritätszuschlag) - no longer applicable as of 2025
  const calculateSolidaritaetszuschlag = (einkommensteuer: number): number => {
    // Solidaritätszuschlag has been abolished
    return 0;
  }

  // Calculate social security contributions
  const calculateSozialversicherung = (brutto: number, customUserData?: UserData): {
    krankenversicherung: number;
    pflegeversicherung: number;
    rentenversicherung: number;
    arbeitslosenversicherung: number;
    gesamt: number;
  } => {
    if (brutto <= 0) {
      return {
        krankenversicherung: 0,
        pflegeversicherung: 0,
        rentenversicherung: 0,
        arbeitslosenversicherung: 0,
        gesamt: 0
      };
    }

    // Use provided custom userData or the default store userData
    const data = customUserData || userData.value;

    // Contribution ceilings 2025
    const bbgKrankenPflegeMonat = 5512.50;
    const bbgRentenArbeitslosMonat = 8050.00;

    // Health insurance
    const krankenversicherungBasis = Math.min(brutto, bbgKrankenPflegeMonat);
    const kvGesamt = data.vorsorgeaufwendungen.krankenversicherung +
                    data.vorsorgeaufwendungen.zusatzbeitragssatz;
    const krankenversicherung = krankenversicherungBasis * (kvGesamt / 2) / 100;

    // Care insurance
    let pflegeversicherungSatz = 0;
    const hasBenifit = data.kinderfreibetraege > 0;

    if (hasBenifit) {
      // With children
      if (data.kinderfreibetraege === 1) {
        pflegeversicherungSatz = 0.017; // 1 child
      } else if (data.kinderfreibetraege === 2) {
        pflegeversicherungSatz = 0.0145; // 2 children
      } else if (data.kinderfreibetraege === 3) {
        pflegeversicherungSatz = 0.012; // 3 children
      } else if (data.kinderfreibetraege === 4) {
        pflegeversicherungSatz = 0.0095; // 4 children
      } else if (data.kinderfreibetraege >= 5) {
        pflegeversicherungSatz = 0.007; // 5 or more children
      }
    } else {
      // No children - check age
      if ((2025 - data.geburtsjahr) > 23) {
        pflegeversicherungSatz = 0.023; // Childless above 23
      } else {
        pflegeversicherungSatz = 0.017; // Childless below 23
      }
    }

    // Special case for Sachsen
    if (data.bundesland === 'Sachsen') {
      pflegeversicherungSatz += 0.005;
    }

    const pflegeversicherung = krankenversicherungBasis * pflegeversicherungSatz;

    // Pension insurance
    const rentenversicherungBasis = Math.min(brutto, bbgRentenArbeitslosMonat);
    const rentenversicherungSatz = data.vorsorgeaufwendungen.rentenversicherung;
    const rentenversicherung = rentenversicherungBasis * (rentenversicherungSatz / 2) / 100;

    // Unemployment insurance
    const arbeitslosenversicherungSatz = 2.6;
    const arbeitslosenversicherung = rentenversicherungBasis * (arbeitslosenversicherungSatz / 2) / 100;

    const gesamt = krankenversicherung + pflegeversicherung + rentenversicherung + arbeitslosenversicherung;

    return {
      krankenversicherung,
      pflegeversicherung,
      rentenversicherung,
      arbeitslosenversicherung,
      gesamt
    };
  }

  // Calculate net income without company car
  const calculateNettoOhneDienstwagen = (brutto: number, customUserData?: UserData): number => {
    // Use provided custom userData or the default store userData
    const data = customUserData || userData.value;

    // Get tax components
    const einkommensteuer = calculateEinkommensteuer(brutto, data);
    const kirchensteuerBetrag = calculateKirchensteuer(einkommensteuer, data);
    // No Solidaritätszuschlag as of 2025
    const sozialversicherungsBeitraege = calculateSozialversicherung(brutto, data).gesamt;

    // Calculate net income
    return brutto - einkommensteuer - kirchensteuerBetrag - sozialversicherungsBeitraege;
  }

  // Calculate monetary benefit of company car
  const calculateGeldwerterVorteil = (car: DienstwagenData): number => {
    const steuersatz =
      car.versteuerungsTyp === 'voll' ? 0.01 :
      car.versteuerungsTyp === 'hybrid' ? 0.005 : 0.0025

    return car.bruttolistenpreis * steuersatz
  }

  // Calculate employee contribution for a company car
  const calculateEigenanteil = (car: DienstwagenData): number => {
    // If no eigenanteil is defined, use default values (1.5% above 45000)
    const defaultProzentsatz = 1.5;
    const defaultFreigrenze = 45000;

    // Check if the car has eigenanteil defined
    if (!car.eigenanteil) {
      // Use default percentage-based calculation
      const basisBetrag = Math.max(0, car.bruttolistenpreis - defaultFreigrenze);
      return basisBetrag * (defaultProzentsatz / 100); // Convert percentage to decimal
    }

    // Handle based on eigenanteil type
    if (car.eigenanteil.type === 'keiner') {
      // No employee contribution
      return 0;
    } else if (car.eigenanteil.type === 'fixiert') {
      // Return the fixed monthly amount
      return car.eigenanteil.fixedAmount || 0;
    } else {
      // Percentage-based calculation (prozentual)
      const prozentsatz = car.eigenanteil.prozentsatz || defaultProzentsatz;
      const freigrenze = car.eigenanteil.freigrenze || defaultFreigrenze;

      // Calculate eigenanteil based on percentage and threshold
      const basisBetrag = Math.max(0, car.bruttolistenpreis - freigrenze);
      return basisBetrag * (prozentsatz / 100); // Convert percentage to decimal
    }
  }

  // Calculate full comparison result for a car
  const calculateDienstwagenVergleich = (car: DienstwagenData): DienstwagenVergleich => {
    const bruttoMonatsgehalt = userData.value.bruttoMonatsgehalt
    const geldwerterVorteil = calculateGeldwerterVorteil(car)
    const eigenanteilBetrag = calculateEigenanteil(car)
    console.log('Eigenanteil:', eigenanteilBetrag)
    console.log('Geldwerter Vorteil:', geldwerterVorteil)
    console.log('Brutto Monatsgehalt:', bruttoMonatsgehalt)
    // Adjust gross salary by subtracting the employee contribution
    const adjustedBruttoMonatsgehalt = bruttoMonatsgehalt - eigenanteilBetrag
    console.log('Adjusted Brutto Monatsgehalt:', adjustedBruttoMonatsgehalt)
    // Geldwerter Vorteil is only subject to income tax, not social security
    // So we calculate taxes with it but don't add it to the adjusted gross for social security calculations
    const nettoOhneDienstwagen = calculateNettoOhneDienstwagen(bruttoMonatsgehalt)
    console.log('Netto ohne Dienstwagen:', nettoOhneDienstwagen)
    // Only apply income tax to geldwerter Vorteil, not social security
    const steuerklasseFaktor = {
      1: 0.36, 2: 0.32, 3: 0.28, 4: 0.36, 5: 0.42, 6: 0.45
    }[userData.value.steuerklasse]

    const steuerbelastung = geldwerterVorteil * steuerklasseFaktor

    // Since Geldwerter Vorteil is not subject to social security contributions
    const sozialversicherungBelastung = 0

    // Calculate net salary with the adjusted gross (without Eigenanteil)
    const nettoMitDienstwagen = calculateNettoOhneDienstwagen(adjustedBruttoMonatsgehalt) - steuerbelastung
    console.log('Netto mit Dienstwagen:', nettoMitDienstwagen)
    return {
      dienstwagen: car,
      ergebnis: {
        nettoOhneDienstwagen,
        nettoDifferenz: nettoMitDienstwagen - nettoOhneDienstwagen,
        geldwerterVorteil,
        steuerbelastung,
        sozialversicherungBelastung,
        eigenanteilBetrag
      }
    }
  }

  // Computed property to get all comparison results
  const vergleichsErgebnisse = computed((): DienstwagenVergleich[] => {
    return dienstwagen.value.map(car => calculateDienstwagenVergleich(car))
  })

  // Initialize by loading from localStorage
  loadFromLocalStorage()

  // Export configuration to file
  const exportConfig = () => {
    exportConfiguration()
  }

  // Import configuration from file
  const importConfig = async (file: File): Promise<boolean> => {
    try {
      const success = await importConfiguration(file)
      if (success) {
        // Reload data from localStorage after successful import
        loadFromLocalStorage()
      }
      return success
    } catch (error) {
      console.error('Failed to import configuration:', error)
      return false
    }
  }

  return {
    userData,
    userProfiles,
    activeProfileId,
    dienstwagen,
    updateUserData,
    addDienstwagen,
    removeDienstwagen,
    updateDienstwagen,
    addProfile,
    updateProfileName,
    deleteProfile,
    setActiveProfile,
    vergleichsErgebnisse,
    exportConfig,
    importConfig,
    calculateNettoOhneDienstwagen,
    calculateEinkommensteuer,
    calculateKirchensteuer,
    calculateSolidaritaetszuschlag,
    calculateSozialversicherung
  }
})
