export const scenarioDefaults = {
  downloadTemplate: {
    selectDate: false,
  },
  editTemplate: {
    selectionStrategy: 'first-eligible-group' as const,
  },
  uploadFilters: {
    loadType: 'Nuevo menú',
    versionMenu: 'No',
  },
  uploadMenu: {
    descriptionPrefix: 'Carga de nuevo menú',
  },
  updateExistingMenu: {
    loadType: 'Actualizar menú',
    versionMenu: 'Si',
  },
} as const;

