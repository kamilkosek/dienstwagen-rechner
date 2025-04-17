// Utility functions for importing and exporting configuration data

/**
 * Configuration data structure that will be exported/imported
 */
export interface ExportData {
  userProfiles: any[];
  activeProfileId: string | null;
  dienstwagen: any[];
  exportDate: string;
  version: string;
}

/**
 * Export configuration data to a JSON file
 */
export function exportConfiguration(): void {
  // Get data from localStorage
  const userProfiles = localStorage.getItem('userProfiles');
  const activeProfileId = localStorage.getItem('activeProfileId');
  const dienstwagen = localStorage.getItem('dienstwagen');

  // Create export data object
  const exportData: ExportData = {
    userProfiles: userProfiles ? JSON.parse(userProfiles) : [],
    activeProfileId: activeProfileId ? JSON.parse(activeProfileId) : null,
    dienstwagen: dienstwagen ? JSON.parse(dienstwagen) : [],
    exportDate: new Date().toISOString(),
    version: '1.0'  // Version of the export format
  };

  // Convert to JSON string
  const jsonString = JSON.stringify(exportData, null, 2);

  // Create file download
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Create a link element and trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = `dienstwagen-config-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Import configuration data from a JSON file
 * @param file The file to import
 * @returns A promise that resolves to true if import was successful
 */
export function importConfiguration(file: File): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        if (!event.target || typeof event.target.result !== 'string') {
          throw new Error('Failed to read file');
        }

        const importData: ExportData = JSON.parse(event.target.result);

        // Validate required fields
        if (!importData.userProfiles || !Array.isArray(importData.userProfiles)) {
          throw new Error('Invalid import data: missing user profiles');
        }

        // Save to localStorage
        localStorage.setItem('userProfiles', JSON.stringify(importData.userProfiles));
        localStorage.setItem('activeProfileId', JSON.stringify(importData.activeProfileId));
        localStorage.setItem('dienstwagen', JSON.stringify(importData.dienstwagen || []));

        resolve(true);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read the file'));
    };

    reader.readAsText(file);
  });
}
