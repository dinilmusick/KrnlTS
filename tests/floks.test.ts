/**
 * @file floks.test.ts
 * @description Verification suite for @floks/ui and @floks/canvas-ui packages.
 */

import { describe, it, expect } from 'vitest';
import * as FloksUI from '../packages/ui/dist/index.js';
import * as FloksCanvasUI from '../packages/canvas-ui/dist/index.js';

describe('Floks Public Frontend & UI Package Library (@floks/*)', () => {
  it('exports @floks/ui base primitives, containers, composite, layout, FrnlTS components, and theme engine', () => {
    expect(FloksUI.BaseButton).toBeDefined();
    expect(FloksUI.BaseInput).toBeDefined();
    expect(FloksUI.BaseSelect).toBeDefined();
    expect(FloksUI.ModalContainer).toBeDefined();
    expect(FloksUI.DrawerContainer).toBeDefined();
    expect(FloksUI.FloatingDetailsPanel).toBeDefined();
    expect(FloksUI.ConfirmDialog).toBeDefined();
    expect(FloksUI.EmptyState).toBeDefined();
    expect(FloksUI.AppShell).toBeDefined();
    expect(FloksUI.TopToolbar).toBeDefined();
    expect(FloksUI.BottomStrip).toBeDefined();
    expect(FloksUI.WorkspaceTilesMenu).toBeDefined();
    // Canonical FrnlTS component suite
    expect(FloksUI.floksFrnlStore).toBeDefined();
    expect(FloksUI.FrnlStoreProvider).toBeDefined();
    expect(FloksUI.useFloksFrnlStore).toBeDefined();
    expect(FloksUI.frnlButton).toBeDefined();
    expect(FloksUI.frnlTextInput).toBeDefined();
    expect(FloksUI.frnlSelect).toBeDefined();
    expect(FloksUI.frnlToggle).toBeDefined();
    expect(FloksUI.frnlSlider).toBeDefined();
    expect(FloksUI.frnlBadge).toBeDefined();
    expect(FloksUI.frnlPage).toBeDefined();
    expect(FloksUI.TilesMenu).toBeDefined();
    expect(FloksUI.WorkspaceTilesMenu).toBeDefined();
    expect(FloksUI.ThemeProvider).toBeDefined();
    expect(FloksUI.usePalette).toBeDefined();
  });

  it('exports @floks/canvas-ui visual canvas, dock, tile-menu, editor, 2D node graph, and predictive components', () => {
    expect(FloksCanvasUI.InfiniteCanvas).toBeDefined();
    expect(FloksCanvasUI.DockBar).toBeDefined();
    expect(FloksCanvasUI.TileGrid).toBeDefined();
    expect(FloksCanvasUI.MonacoEditor).toBeDefined();
    // Generalized 2D Graph & Predictive UI
    expect(FloksCanvasUI.Node2DBase).toBeDefined();
    expect(FloksCanvasUI.NodeRenderer2D).toBeDefined();
    expect(FloksCanvasUI.Socket2D).toBeDefined();
    expect(FloksCanvasUI.Wire2D).toBeDefined();
    expect(FloksCanvasUI.PredictiveGhostNodeCard).toBeDefined();
    expect(FloksCanvasUI.PredictiveHudToolbar).toBeDefined();
    expect(FloksCanvasUI.PredictiveLayer2D).toBeDefined();
    expect(FloksCanvasUI.usePredictiveGraph2D).toBeDefined();
  });
});
