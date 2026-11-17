/**
 * Resolves a CSS variable string like "var(--name, fallback)" to a valid hex/rgb color
 * that can be safely used in HTML5 Canvas contexts (fillStyle, strokeStyle, addColorStop, etc.).
 */
export function resolveCanvasColor(color: string, element?: HTMLElement | null): string {
  if (!color) return '#ffffff';
  
  if (color.startsWith('var(')) {
    // Attempt dynamic resolution in browser computed style
    if (typeof window !== 'undefined') {
      try {
        const match = color.match(/var\((--[^,)]+)(?:,\s*([^)]+))?\)/);
        if (match) {
          const varName = match[1].trim();
          const fallback = match[2] ? match[2].trim() : '#ffffff';
          const targetEl = element || document.documentElement;
          const computedValue = window.getComputedStyle(targetEl).getPropertyValue(varName).trim();
          
          if (computedValue) {
            if (computedValue.startsWith('var(')) {
              return resolveCanvasColor(computedValue, targetEl);
            }
            return computedValue;
          }
          
          if (fallback.startsWith('var(')) {
            return resolveCanvasColor(fallback, targetEl);
          }
          return fallback;
        }
      } catch (e) {
        // Fall back to regex parsing on error
      }
    }
    
    // Static regex extraction if not in browser or window/getComputedStyle fails
    const match = color.match(/var\(--[^,]+,\s*([^)]+)\)/);
    if (match) {
      const fallback = match[1].trim();
      if (fallback.startsWith('var(')) {
        return resolveCanvasColor(fallback);
      }
      return fallback;
    }
    return '#ffffff';
  }
  
  return color;
}
