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

  // Calculate income tax (Lohnsteuer) - gemäß Programmablaufplan (PAP) 2025
  const calculateEinkommensteuer = (brutto: number, customUserData?: UserData): number => {
    if (brutto <= 0) return 0;

    // Use provided custom userData or the default store userData
    const data = customUserData || userData.value;



    // Konstanten nach PAP 2025
    const GRUNDFREIBETRAG = 11784; // Grundfreibetrag in Euro
    const ANP_WERT = 1230;  // Arbeitnehmer-Pauschbetrag in Euro
    const SAP_WERT = 36;    // Sonderausgaben-Pauschbetrag in Euro
    const EFA_WERT = 4260;  // Entlastungsbetrag für Alleinerziehende

    // 1. Jahreswerte ermitteln (monatliche Werte auf Jahreswerte hochrechnen)
    const RE4 = Math.round(brutto * 100); // Bruttolohn in Cent
    const JRE4 = RE4 * 12;  // Jahresbruttolohn in Cent
    const JFREIB = data.monatsfreibetrag * 100 * 12; // Freibeträge in Cent/Jahr

    // 2. Ermittlung der Freibeträge
    let ANP = 0;  // Arbeitnehmer-Pauschbetrag
    let SAP = 0;  // Sonderausgaben-Pauschbetrag
    // Keine Kinderfreibeträge mehr für die Lohnsteuerberechnung gemäß BMF:
    // "Die Freibeträge für Kinder wirken sich beim Lohnsteuerabzug auf die Höhe des
    // Solidaritätszuschlags und der Kirchensteuer aus. Auf die Höhe der Lohnsteuer
    // haben diese Freibeträge keine Auswirkung."
    let EFA = 0;  // Entlastungsbetrag für Alleinerziehende in Steuerklasse 2
    let KZTAB = 1; // Kennzahl für die Einkommensteuer-Tabellenart (1 = Grundtabelle, 2 = Splittingtabelle)

    // ANP ist der Arbeitnehmer-Pauschbetrag (max. 1230€)
    ANP = ANP_WERT;

    // Steuerklassen-spezifische Freibeträge setzen
    switch (data.steuerklasse) {
      case 1:
        SAP = SAP_WERT;
        break;
      case 2:
        EFA = EFA_WERT; // Entlastungsbetrag für Alleinerziehende
        SAP = SAP_WERT;
        break;
      case 3:
        KZTAB = 2; // Splittingtabelle für SK 3
        SAP = SAP_WERT;
        break;
      case 4:
        SAP = SAP_WERT;
        break;
      case 5:
        SAP = SAP_WERT;
        break;
      case 6:
        // Keine speziellen Freibeträge für SK 6
        break;
    }

    // 3. Ermittlung der Vorsorgepauschale nach PAP 2025
    let VSP1 = 0; // Vorsorgepauschale für Rentenversicherung
    let VSP2 = 0; // Vorsorgepauschale für sonstige Vorsorgeaufwendungen (Höchstbetrag)
    let VSP3 = 0; // Vorsorgepauschale für Kranken- und Pflegeversicherung

    // 3.1 Berechnung von VSP1 (Rentenversicherung)
    const BBGRV = 96600; // Beitragsbemessungsgrenze Rentenversicherung 2025
    const RVSATZAN = 0.093; // Arbeitnehmerbeitragssatz zur Rentenversicherung 2025
    const ZRE4VP = Math.min(BBGRV, JRE4/100); // Auf Jahreswert hochgerechnetes RE4 für VSP-Berechnung

    VSP1 = Math.floor(ZRE4VP * RVSATZAN * 100) / 100; // Auf 2 Nachkommastellen abgerundet

    // 3.2 Berechnung VSP2 (sonstige Vorsorgeaufwendungen - Höchstbetrag abhängig von Steuerklasse)
    VSP2 = Math.min((ZRE4VP * 0.12), (data.steuerklasse == 3 ? 3000 : 1900));
    VSP2 = Math.floor(VSP2 * 100) / 100; // Auf 2 Nachkommastellen abgerundet

    // 3.3 Berechnung VSP3 (Kranken- und Pflegeversicherung)
    const BBGKVPV = 66150; // Beitragsbemessungsgrenze Kranken-/Pflegeversicherung 2025
    const KVSATZAN = (data.vorsorgeaufwendungen.krankenversicherung + data.vorsorgeaufwendungen.zusatzbeitragssatz) / 100 / 2;

    // Pflegeversicherung - gestaffelt nach Anzahl der Kinder
    let PVSATZ = 0.018; // Standardsatz 1,8%

    // Falls Kinder vorhanden, reduzierter Satz
    if (data.kinderfreibetraege > 0) {
      if (data.kinderfreibetraege >= 0 && data.kinderfreibetraege < 1.5) PVSATZ = 0.017;
      else if (data.kinderfreibetraege >= 1.5 && data.kinderfreibetraege < 2.5) PVSATZ = 0.0145;
      else if (data.kinderfreibetraege >= 2.5 && data.kinderfreibetraege < 3.5) PVSATZ = 0.012;
      else if (data.kinderfreibetraege >= 3.5 && data.kinderfreibetraege < 4.5) PVSATZ = 0.0095;
      else PVSATZ = 0.007; // 4.5 oder mehr Kinder
    } else {
      // Kinderlos über 23 Jahre
      if ((2025 - data.geburtsjahr) > 23) {
        PVSATZ = 0.023;
      }
    }

    // Zusätzlicher Beitrag für Sachsen
    if (data.bundesland === 'Sachsen') {
      PVSATZ += 0.005;
    }

    const KVPVBeitrag = Math.min(BBGKVPV, ZRE4VP) * (KVSATZAN + PVSATZ);
    VSP3 = Math.floor(KVPVBeitrag * 100) / 100; // 2 Nachkommastellen abgerundet

    // 3.4 Gesamte Vorsorgepauschale ermitteln
    const VSPN = Math.ceil(VSP1 + VSP2); // VSP1 + VSP2 wird aufgerundet
    const VSP = Math.max(VSP3 + VSP1, VSPN); // Größerer Wert aus (VSP3+VSP1) und VSPN    // 4. Ermittlung des zu versteuernden Einkommens (ZVE)
    const ZRE4 = Math.max(0, JRE4/100 - JFREIB/100); // Entspricht ZRE4 im PAP, jährliches RE4 nach Abzug der Freibeträge

    // Summe der festen Tabellenfreibeträge (ZTABFB) berechnen
    const ZTABFB = EFA + ANP + SAP;

    // ZVE gemäß PAP (ohne Kinderfreibeträge gemäß BMF)
    const ZVE = Math.max(0, ZRE4 - ZTABFB - VSP);

    // 5. Berechnung der Lohnsteuer nach dem Einkommensteuertarif
    let X = 0;
    let ST = 0;

    if (ZVE < 1) {
      ST = 0; // Keine Steuer unter 1€
    } else {
      // Berechnung X abhängig von KZTAB (1=Grundtabelle, 2=Splittingtabelle)
      X = Math.floor(ZVE / KZTAB);

      // Steuerberechnung nach dem Einkommensteuertarif 2025
      if (X <= 0) {
        ST = 0;
      } else if (X <= 17005) {
        // Erste Progressionszone
        const y = (X - GRUNDFREIBETRAG) / 10000;
        ST = Math.floor((954.8 * y + 1400) * y);
      } else if (X <= 66760) {
        // Zweite Progressionszone
        const y = (X - 17005) / 10000;
        ST = Math.floor((181.19 * y + 2397) * y + 991.21);
      } else if (X <= 277825) {
        // Dritte Progressionszone
        ST = Math.floor(0.42 * X - 10636.31);
      } else {
        // Vierte Progressionszone
        ST = Math.floor(0.45 * X - 18971.06);
      }

      // Steuerberechnung für Steuerklasse 5 oder 6
      if (data.steuerklasse >= 5) {
        // Mindeststeuersatz für SK 5/6
        const MIST = Math.floor(X * 0.14);

        // Spezielle Berechnung für SK 5/6
        let ST1 = 0;
        let ST2 = 0;

        // Berechnung für 1,25 * X
        const X1 = Math.floor(X * 1.25);

        if (X1 <= 0) {
          ST1 = 0;
        } else if (X1 <= 17005) {
          const y = (X1 - GRUNDFREIBETRAG) / 10000;
          ST1 = Math.floor((954.8 * y + 1400) * y);
        } else if (X1 <= 66760) {
          const y = (X1 - 17005) / 10000;
          ST1 = Math.floor((181.19 * y + 2397) * y + 991.21);
        } else if (X1 <= 277825) {
          ST1 = Math.floor(0.42 * X1 - 10636.31);
        } else {
          ST1 = Math.floor(0.45 * X1 - 18971.06);
        }

        // Berechnung für 0,75 * X
        const X2 = Math.floor(X * 0.75);

        if (X2 <= 0) {
          ST2 = 0;
        } else if (X2 <= 17005) {
          const y = (X2 - GRUNDFREIBETRAG) / 10000;
          ST2 = Math.floor((954.8 * y + 1400) * y);
        } else if (X2 <= 66760) {
          const y = (X2 - 17005) / 10000;
          ST2 = Math.floor((181.19 * y + 2397) * y + 991.21);
        } else if (X2 <= 277825) {
          ST2 = Math.floor(0.42 * X2 - 10636.31);
        } else {
          ST2 = Math.floor(0.45 * X2 - 18971.06);
        }

        const DIFF = (ST1 - ST2) * 2;

        // Wähle den höheren Wert
        ST = Math.max(MIST, DIFF);
      }

      // Bei Steuerklasse 2 (Alleinerziehende) Steuervergünstigung berechnen
      if (data.steuerklasse === 2) {
        // 10% Entlastung für Alleinerziehende
        const entlastung = Math.floor(ST * 0.1);
        ST -= entlastung;
      }
    }

    // Bei Splittingverfahren (KZTAB = 2, Steuerklasse 3) mit Faktor multiplizieren
    ST = Math.floor(ST * KZTAB);

    // 6. Jahreslohnsteuer in Monatslohnsteuer umrechnen
    return ST / 12;
  }

  // Calculate church tax (Kirchensteuer)
  const calculateKirchensteuer = (einkommensteuer: number, customUserData?: UserData): number => {
    // Use provided custom userData or the default store userData
    const data = customUserData || userData.value;

    if (!data.kirchensteuer) return 0;

    // Kirchensteuersatz je nach Bundesland
    const kirchensteuerSatz = data.bundesland === 'Bayern' ||
                             data.bundesland === 'Baden-Württemberg' ? 0.08 : 0.09;

    // Bei der Kirchensteuer werden Kinderfreibeträge berücksichtigt
    // Gemäß BMF wirken sich die Kinderfreibeträge auf die Kirchensteuer aus
    const kinderfreibetraege = data.kinderfreibetraege || 0;

    // Berechnung der fiktiven Kinderfreibetragsreduktion für die Kirchensteuer
    // Je nach Steuerklasse werden unterschiedliche Kinderfreibeträge angesetzt
    let kinderFreibetragWert = 0;

    // Kinderfreibeträge werden bei SK 1-4 berücksichtigt
    // Unterstützt auch Kommazahlen (z.B. 1.5 Kinderfreibeträge)
    if (data.steuerklasse >= 1 && data.steuerklasse <= 3) {
      // Voller Kinderfreibetrag für SK 1-3: 9540€ pro Kind
      kinderFreibetragWert = kinderfreibetraege * 9540;
    } else if (data.steuerklasse === 4) {
      // Halber Kinderfreibetrag für SK 4: 4770€ pro Kind
      kinderFreibetragWert = kinderfreibetraege * 4770;
    }

    // Für SK 5-6 keine Kinderfreibeträge

    // Reduktionsfaktor für die Kirchensteuer berechnen
    // Je höher der Kinderfreibetrag, desto niedriger die Kirchensteuer
    // Vereinfachte Berechnung: Reduction = KFB / (Annual Income * 10)
    const annualIncome = einkommensteuer * 12;
    let kfbReduction = 0;

    if (annualIncome > 0 && kinderFreibetragWert > 0) {
      // Reduktionsfaktor berechnen - begrenzt auf max. 30%
      kfbReduction = Math.min(0.3, kinderFreibetragWert / (annualIncome * 10));
    }

    // Reduzierte Kirchensteuer zurückgeben
    return einkommensteuer * kirchensteuerSatz * (1 - kfbReduction);
  }

  // Calculate solidarity surcharge (Solidaritätszuschlag) - no longer applicable as of 2025
  const calculateSolidaritaetszuschlag = (): number => {
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
      if (data.kinderfreibetraege >= 0 && data.kinderfreibetraege < 1.5) {
        pflegeversicherungSatz = 0.017; // Up to 1.5 children
      } else if (data.kinderfreibetraege >= 1.5 && data.kinderfreibetraege < 2.5) {
        pflegeversicherungSatz = 0.0145; // 1.5 to 2.5 children
      } else if (data.kinderfreibetraege >= 2.5 && data.kinderfreibetraege < 3.5) {
        pflegeversicherungSatz = 0.012; // 2.5 to 3.5 children
      } else if (data.kinderfreibetraege >= 3.5 && data.kinderfreibetraege < 4.5) {
        pflegeversicherungSatz = 0.0095; // 3.5 to 4.5 children
      } else if (data.kinderfreibetraege >= 4.5) {
        pflegeversicherungSatz = 0.007; // 4.5 or more children
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
  }  // Calculate full comparison result for a car
  const calculateDienstwagenVergleich = (car: DienstwagenData): DienstwagenVergleich => {
    const bruttoMonatsgehalt = userData.value.bruttoMonatsgehalt
    const geldwerterVorteil = calculateGeldwerterVorteil(car)
    const eigenanteilBetrag = calculateEigenanteil(car)

    // Berechnung ohne Dienstwagen als Basiswert (reguläres Nettogehalt)
    const nettoOhneDienstwagen = calculateNettoOhneDienstwagen(bruttoMonatsgehalt)

    // Gemäß dem Lohnsteuer-Programmablaufplan 2025:
    // 1. Eigenanteil wird vom Bruttogehalt abgezogen
    const adjustedBruttoMonatsgehalt = bruttoMonatsgehalt - eigenanteilBetrag

    // 2. Geldwerter Vorteil erhöht das zu versteuernde Einkommen als geldwerter Vorteil
    //    Sozialversicherungsbeiträge werden auf das um den Eigenanteil verminderte Gehalt berechnet
    const sozialversicherungBeitraege = calculateSozialversicherung(adjustedBruttoMonatsgehalt).gesamt

    // 3. Berechnung der Lohnsteuer auf das angepasste Brutto plus geldwerten Vorteil
    // Im Programmablaufplan wird der geldwerte Vorteil zum steuerpflichtigen Einkommen addiert
    const lohnsteuerMitDienstwagen = calculateEinkommensteuer(adjustedBruttoMonatsgehalt + geldwerterVorteil)
    const kirchensteuerMitDienstwagen = calculateKirchensteuer(lohnsteuerMitDienstwagen)

    // 4. Berechnung des Nettogehalts mit Dienstwagen
    const nettoMitDienstwagen = adjustedBruttoMonatsgehalt - lohnsteuerMitDienstwagen - kirchensteuerMitDienstwagen - sozialversicherungBeitraege

    // Ermittlung der Steuerbelastung durch den geldwerten Vorteil
    // Berechne Steuern ohne den geldwerten Vorteil als Vergleich
    const lohnsteuerOhneDienstwagen = calculateEinkommensteuer(adjustedBruttoMonatsgehalt)
    const kirchensteuerOhneDienstwagen = calculateKirchensteuer(lohnsteuerOhneDienstwagen)

    // Differenz der Steuern mit und ohne geldwerten Vorteil
    const steuerbelastung = lohnsteuerMitDienstwagen - lohnsteuerOhneDienstwagen
    const kirchensteuerBelastung = kirchensteuerMitDienstwagen - kirchensteuerOhneDienstwagen
    const gesamteSteuerbelastung = steuerbelastung + kirchensteuerBelastung

    // Nach Bundesfinanzhof fallen keine Sozialversicherungsbeiträge auf den geldwerten Vorteil an
    const sozialversicherungBelastung = 0

    return {
      dienstwagen: car,
      ergebnis: {
        nettoOhneDienstwagen,
        nettoDifferenz: nettoMitDienstwagen - nettoOhneDienstwagen,
        geldwerterVorteil,
        steuerbelastung: gesamteSteuerbelastung,
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
