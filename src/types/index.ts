// User profile for identification
export interface UserProfile {
  id: string;
  name: string;
  userData: UserData;
}

// User personal data for tax calculations
export interface UserData {
  bruttoMonatsgehalt: number;
  steuerklasse: 1 | 2 | 3 | 4 | 5 | 6;
  bundesland: string;
  steuerjahr: number;
  geburtsjahr: number;
  kinderfreibetraege: number;
  monatsfreibetrag: number;
  kirchensteuer: boolean;
  vorsorgeaufwendungen: {
    rentenversicherung: number;
    krankenversicherung: number;
    zusatzbeitragssatz: number;
  };
}

// Company car data
export interface DienstwagenData {
  id: string;
  name: string;
  bruttolistenpreis: number;
  versteuerungsTyp: 'voll' | 'hybrid' | 'elektro';  // 1%, 0.5%, 0.25%
  konfiguratorCode?: string;
  konfiguratorLink?: string;
  eigenanteil?: {
    type: 'prozentual' | 'fixiert' | 'keiner';
    prozentsatz?: number;   // Percentage value (1.0 = 1%) - used when type is 'prozentual'
    freigrenze?: number;    // Threshold amount (e.g., 47000) - used when type is 'prozentual'
    fixedAmount?: number;   // Fixed monthly amount - used when type is 'fixiert'
  };
}

// Result calculation
export interface BerechnungsErgebnis {
  nettoOhneDienstwagen: number;
  nettoDifferenz: number;
  geldwerterVorteil: number;
  steuerbelastung: number;
  sozialversicherungBelastung: number;
  eigenanteilBetrag: number; // Monthly employee contribution amount
}

// Complete calculation result with car details
export interface DienstwagenVergleich {
  dienstwagen: DienstwagenData;
  ergebnis: BerechnungsErgebnis;
}
