// ══════════════════════════════════════════════════════════════════════════════
// FLOKS CANONICAL FRNL COMPONENT SUITE EXPORTS
// All components in Floks strictly follow the frnl* prefix rule.
// ══════════════════════════════════════════════════════════════════════════════

// Store & Context
export * from './store.js';
export type { FrnlInputContract } from '@ultrst-armada/frnlts';
export type { FrnlFrontendApi, FrnlFrontendSnapshot, FrnlComponentSnapshot, FrnlComponentControl, FrnlMeasurementAdapter, FrnlRealizedState, FrnlGeometry } from '@ultrst-armada/frnlts';
export { createFrnlDomMeasurementAdapter } from '@ultrst-armada/frnlts';
export { getFloksFrnlFrontendApi, floksFrnlFrontendApi } from './store.js';

// Basic Components (frnl*)
export {
  frnlButton,
  frnlButtonDefinition,
  type FrnlButtonProps,
  type FrnlButtonVariant,
  type FrnlButtonSize,
} from './frnlButton.js';

export {
  frnlTextInput,
  frnlTextInputDefinition,
  type FrnlTextInputProps,
} from './frnlTextInput.js';

export {
  frnlSelect,
  frnlSelectDefinition,
  type FrnlSelectProps,
  type FrnlSelectOption,
  frnlToggle,
  frnlToggleDefinition,
  type FrnlToggleProps,
  frnlSlider,
  type FrnlSliderProps,
  frnlBadge,
  type FrnlBadgeProps,
} from './frnlControls.js';

// Compound & Canonical App Components
export {
  frnlTabWindow,
  type FrnlTabWindowProps,
  type FrnlTabItem,
} from './frnlTabWindow.js';

export {
  frnlTopBar,
  type FrnlTopBarProps,
  type FrnlTopBarTab,
  type FrnlBreadcrumbItem,
  type FrnlUserProfile,
} from './frnlTopBar.js';

export {
  frnlBottomBar,
  type FrnlBottomBarProps,
  type FrnlApiRequestLog,
} from './frnlBottomBar.js';

export {
  frnlPage,
  type FrnlPageProps,
  type FrnlPageTab,
} from './frnlPage.js';
