import type { UIElementThemeValue } from '../../types.js';

export const lightElements: Record<string, UIElementThemeValue> = {
  canvas: { cssVars: { '--color-base': '#F5EDE4', '--skipo-bg': '#F5EDE4' }, styles: { backgroundColor: '#F5EDE4', color: '#21140E', fontFamily: 'var(--skipo-font-body)' } },
  wallpaperOverlay: { cssVars: { '--wallpaper-overlay-color': '#F5EDE4', '--wallpaper-overlay-opacity': '0.60' } },
  topToolbar: { cssVars: { '--color-surface-subtle': '#DFCFB9', '--color-border': '#2C1810' }, styles: { height: '44px', borderBottom: '2px solid #2C1810' } },
  bottomStrip: { cssVars: { '--skipo-bottom-strip-bg': '#E8DCC4' }, styles: { height: '30px', borderTop: '2px solid #2C1810', fontFamily: 'var(--skipo-font-mono)' } },
  headerBar: { cssVars: { '--color-surface-subtle': '#DFCFB9', '--color-border': '#2C1810' }, styles: { fontFamily: 'var(--skipo-font-heading)' } },
  workspaceTabBar: { cssVars: { '--color-surface': '#E8DCC4', '--color-accent': '#C87D32' } },
  card: { cssVars: { '--color-surface': '#E8DCC4', '--color-border': '#2C1810' }, styles: { border: '2px solid #2C1810', boxShadow: '4px 4px 0px #2C1810', fontFamily: 'var(--skipo-font-body)' } },
  buttonPrimary: { cssVars: { '--color-accent': '#C87D32', '--color-border': '#2C1810' }, styles: { backgroundColor: '#C87D32', color: '#FFFFFF', border: '2px solid #2C1810' } },
  buttonSecondary: { cssVars: { '--color-accent-secondary': '#C25E45', '--color-surface': '#E8DCC4' }, styles: { backgroundColor: '#E8DCC4', color: '#21140E', border: '2px solid #2C1810' } },
  kanbanColumn: { cssVars: { '--color-surface': '#E8DCC4', '--color-border': '#2C1810' } },
  kanbanColumnOverlay: { cssVars: { '--column-overlay-color': '#F5EDE4', '--column-overlay-opacity': '0.75' } },
  documentCard: { cssVars: { '--color-surface': '#E8DCC4', '--color-border': '#2C1810' }, styles: { border: '2px solid #2C1810', boxShadow: '3px 3px 0px #2C1810' } },
  graphCanvas: { cssVars: { '--color-base': '#F5EDE4' } },
  graphNodeRoot: { cssVars: { '--color-accent': '#C87D32' }, styles: { border: '2px solid #2C1810' } },
  graphNodeLeaf: { cssVars: { '--color-surface': '#E8DCC4', '--color-border': '#2C1810' }, styles: { border: '2px solid #2C1810' } },
  graphEdge: { styles: { stroke: '#C87D32', strokeWidth: '2px' } },
  codeEditor: { cssVars: { '--color-surface': '#E8DCC4' }, styles: { fontFamily: 'var(--skipo-font-code)' } },
  aiChatPanel: { cssVars: { '--color-surface': '#E8DCC4', '--color-border': '#2C1810' }, styles: { border: '2px solid #2C1810', boxShadow: '6px 6px 0px #2C1810' } }
};

export const darkElements: Record<string, UIElementThemeValue> = {
  canvas: { cssVars: { '--color-base': '#1A120E', '--skipo-bg': '#1A120E' }, styles: { backgroundColor: '#1A120E', color: '#F5EDE4', fontFamily: 'var(--skipo-font-body)' } },
  wallpaperOverlay: { cssVars: { '--wallpaper-overlay-color': '#1A120E', '--wallpaper-overlay-opacity': '0.75' } },
  topToolbar: { cssVars: { '--color-surface-subtle': '#362720', '--color-border': '#3D2C22' }, styles: { height: '44px', borderBottom: '2px solid #3D2C22' } },
  bottomStrip: { cssVars: { '--skipo-bottom-strip-bg': '#281D17' }, styles: { height: '30px', borderTop: '2px solid #3D2C22', fontFamily: 'var(--skipo-font-mono)' } },
  headerBar: { cssVars: { '--color-surface-subtle': '#362720', '--color-border': '#3D2C22' }, styles: { fontFamily: 'var(--skipo-font-heading)' } },
  workspaceTabBar: { cssVars: { '--color-surface': '#281D17', '--color-accent': '#E08A3C' } },
  card: { cssVars: { '--color-surface': '#281D17', '--color-border': '#3D2C22' }, styles: { border: '2px solid #3D2C22', boxShadow: '4px 4px 0px #000000', fontFamily: 'var(--skipo-font-body)' } },
  buttonPrimary: { cssVars: { '--color-accent': '#E08A3C', '--color-border': '#3D2C22' }, styles: { backgroundColor: '#E08A3C', color: '#000000', border: '2px solid #3D2C22' } },
  buttonSecondary: { cssVars: { '--color-accent-secondary': '#C87D32', '--color-surface': '#281D17' }, styles: { backgroundColor: '#281D17', color: '#F5EDE4', border: '2px solid #3D2C22' } },
  kanbanColumn: { cssVars: { '--color-surface': '#281D17', '--color-border': '#3D2C22' } },
  kanbanColumnOverlay: { cssVars: { '--column-overlay-color': '#1A120E', '--column-overlay-opacity': '0.80' } },
  documentCard: { cssVars: { '--color-surface': '#281D17', '--color-border': '#3D2C22' }, styles: { border: '2px solid #3D2C22', boxShadow: '3px 3px 0px #000000' } },
  graphCanvas: { cssVars: { '--color-base': '#1A120E' } },
  graphNodeRoot: { cssVars: { '--color-accent': '#E08A3C' }, styles: { border: '2px solid #3D2C22' } },
  graphNodeLeaf: { cssVars: { '--color-surface': '#281D17', '--color-border': '#3D2C22' }, styles: { border: '2px solid #3D2C22' } },
  graphEdge: { styles: { stroke: '#E08A3C', strokeWidth: '2px' } },
  codeEditor: { cssVars: { '--color-surface': '#281D17' }, styles: { fontFamily: 'var(--skipo-font-code)' } },
  aiChatPanel: { cssVars: { '--color-surface': '#281D17', '--color-border': '#3D2C22' }, styles: { border: '2px solid #3D2C22', boxShadow: '6px 6px 0px #000000' } }
};
