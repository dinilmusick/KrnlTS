/**
 * @file validator.ts
 * @description Deterministic ThemePack compatibility validator.
 * Enforces docs/04_THETA_COMPONENT_CONTRACTS.md:
 * Validate(theme, component)
 * <=>
 *   Target(theme) = component
 *   ^ theme.slots ⊆ component.slots
 *   ^ theme.states ⊆ component.states
 *   ^ theme.parameters ⊆ component.parameters
 *   ^ theme.assetTypes ⊆ component.acceptedAssetTypes
 */

import { ComponentThemeContract, ThemePack, ThemePackSchema } from './schemas.js';
import { FLOKS_COMPONENT_REGISTRY } from './registry.js';

export interface ThemeValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  targetComponentId: string;
}

export function validateThemePackAgainstContract(
  themePack: ThemePack,
  contract?: ComponentThemeContract
): ThemeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const targetCompId = themePack.target.componentId;
  const targetContract = contract ?? FLOKS_COMPONENT_REGISTRY[targetCompId];

  // 1. Target check
  if (!targetContract) {
    return {
      valid: false,
      errors: [`Target component '${targetCompId}' is not registered in Floks ComponentThemeContract registry.`],
      warnings: [],
      targetComponentId: targetCompId,
    };
  }

  if (themePack.target.library !== '@ultrst-armada/floks') {
    errors.push(`Invalid target library '${themePack.target.library}'. Must be '@ultrst-armada/floks'.`);
  }

  // 2. Slots check: theme.slots ⊆ component.slots
  const allowedSlotIds = new Set(targetContract.slots.map((s) => s.id));
  for (const s of themePack.slots) {
    if (!allowedSlotIds.has(s.slotId)) {
      errors.push(`Slot '${s.slotId}' is not defined in contract for '${targetCompId}'.`);
    } else {
      const slotDef = targetContract.slots.find((slot) => slot.id === s.slotId);
      if (slotDef && !slotDef.acceptedElementTypes.includes(s.elementType)) {
        errors.push(
          `Slot '${s.slotId}' rejects element type '${s.elementType}'. Accepted types: [${slotDef.acceptedElementTypes.join(', ')}]`
        );
      }
    }
  }

  // Check required slots are present
  const presentSlotIds = new Set(themePack.slots.map((s) => s.slotId));
  for (const requiredSlot of targetContract.slots.filter((s) => s.required)) {
    if (!presentSlotIds.has(requiredSlot.id)) {
      warnings.push(`Required slot '${requiredSlot.id}' is not explicitly bound in theme.`);
    }
  }

  // 3. States check: theme.states ⊆ component.states
  const allowedStateIds = new Set(targetContract.states.map((st) => st.id));
  for (const st of themePack.states) {
    if (!allowedStateIds.has(st.stateId)) {
      errors.push(`State '${st.stateId}' is not recognized by contract for '${targetCompId}'.`);
    }
  }

  // 4. Parameters check: theme.parameters ⊆ component.parameters
  const allowedParamIds = new Set(targetContract.parameters.map((p) => p.id));
  for (const paramKey of Object.keys(themePack.parameters)) {
    if (!allowedParamIds.has(paramKey)) {
      warnings.push(`Unknown visual parameter '${paramKey}' ignored by '${targetCompId}'.`);
    }
  }

  // 5. Assets check: theme.assetTypes ⊆ component.acceptedAssetTypes
  const allowedAssets = new Set(targetContract.assets);
  for (const asset of themePack.assetTypes) {
    if (!allowedAssets.has(asset)) {
      errors.push(`Asset type '${asset}' is not accepted by '${targetCompId}'. Allowed: [${targetContract.assets.join(', ')}]`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    targetComponentId: targetCompId,
  };
}

export function loadThemePack(raw: unknown): ThemePack {
  const parsed = ThemePackSchema.parse(raw);
  const result = validateThemePackAgainstContract(parsed);
  if (!result.valid) {
    throw new Error(`Invalid Floks ThemePack: ${result.errors.join('; ')}`);
  }
  return parsed;
}
