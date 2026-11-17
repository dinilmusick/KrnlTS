import { ColorPalette } from "./types";
import { BASE_PALETTES } from "./palettesBase";
import { EXTENDED_PALETTES } from "./palettesExtended";

export const BUILTIN_PALETTES: Record<string, ColorPalette> = {
  ...BASE_PALETTES,
  ...EXTENDED_PALETTES,
};
