import React, { useRef, useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { BaseButton } from '@ultrst-armada/floks';
import { SolarSystemGraphData, SolarSystemEntity } from './types.js';
import { renderSolarSystem } from './solarSystemRenderer.js';
import { useBottomStrip } from '@ultrst-armada/floks';
import { EntityDetailsPanel } from './EntityDetailsPanel.js';
import type { ToolDefinition } from '../../../libraries/toolContracts.js';
import type { ModelCatalogEntry } from '../../../libraries/aiContracts.js';
import type { IntelligenceSpecPreset, PreferencesSpecPreset } from '../../../libraries/intelligenceContracts.js';
import { useSolarInteractions } from './useSolarInteractions.js';

export interface SolarSystemVisualizerProps {
  data: SolarSystemGraphData | null;
  onSelectEntity?: (entity: SolarSystemEntity) => void;
  onUpdateEntity?: (updated: Partial<SolarSystemEntity>) => void;
  availableTools?: ToolDefinition[];
  catalog?: ModelCatalogEntry[];
  presets?: IntelligenceSpecPreset[];
  preferencesPresets?: PreferencesSpecPreset[];
  className?: string;
  height?: number;
}

export const SolarSystemVisualizer: React.FC<SolarSystemVisualizerProps> = ({
  data,
  onSelectEntity,
  onUpdateEntity,
  availableTools = [],
  catalog = [],
  presets = [],
  preferencesPresets = [],
  className = '',
  height = 340
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const simTimeRef = useRef<number>(0);
  const hitMapRef = useRef<Array<{
    entity: SolarSystemEntity;
    x: number;
    y: number;
    radius: number;
    parentScreenX?: number;
    parentScreenY?: number;
  }>>([]);

  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const hoveredEntityRef = useRef<SolarSystemEntity | null>(null);
  const selectedEntityRef = useRef<SolarSystemEntity | null>(null);
  const dataRef = useRef<SolarSystemGraphData | null>(data);

  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [inspectingEntity, setInspectingEntity] = useState<SolarSystemEntity | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const { setInspectionText } = useBottomStrip();

  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    const loop = (currentTime: number) => {
      if (!isPausedRef.current) {
        simTimeRef.current += (currentTime - lastTimeRef.current) * 0.002;
      }
      lastTimeRef.current = currentTime;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const res = renderSolarSystem({
            ctx,
            data: dataRef.current,
            width: canvas.width,
            height: canvas.height,
            time: simTimeRef.current,
            pan: panRef.current,
            zoom: zoomRef.current,
            hoveredEntityId: hoveredEntityRef.current?.id || null,
            selectedEntityId: selectedEntityRef.current?.id || null
          });
          hitMapRef.current = res.hitMap;
        }
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, []);

  useEffect(() => {
    const updateSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        const w = container.clientWidth || container.getBoundingClientRect().width || 600;
        const h = height || container.clientHeight || 260;
        if (w > 0 && h > 0) { canvas.width = Math.floor(w); canvas.height = Math.floor(h); }
      }
    };
    updateSize();
    const container = containerRef.current;
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      observer = new ResizeObserver(() => updateSize());
      observer.observe(container);
    }
    window.addEventListener('resize', updateSize);
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [height]);

  const {
    isDragging,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handleMouseLeave,
    handleClick,
    handleDoubleClick,
    handleWheel
  } = useSolarInteractions({
    canvasRef,
    hitMapRef,
    hoveredEntityRef,
    selectedEntityRef,
    panRef,
    zoomRef,
    simTimeRef,
    setInspectionText,
    onSelectEntity,
    onOpenDetails: (entity) => {
      setInspectingEntity(entity);
      setIsDetailsPanelOpen(true);
    }
  });

  const togglePause = () => {
    const next = !isPaused;
    setIsPaused(next);
    isPausedRef.current = next;
    lastTimeRef.current = performance.now();
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-xl border overflow-hidden select-none bg-[var(--skipo-surface,#0f172a)] border-[var(--skipo-border-color,#334155)] shadow-inner ${className}`}
      style={{ height }}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onAuxClick={(e) => { if (e.button === 1) e.preventDefault(); }}
        className={`w-full h-full block ${isDragging ? 'cursor-grabbing' : 'cursor-default'}`}
      />

      <div className="absolute bottom-2.5 right-2.5 z-10">
        <BaseButton
          size="sm"
          variant={isPaused ? 'accent' : 'secondary'}
          className="h-7 px-2.5 text-xs font-mono bg-[var(--skipo-surface)]/90 backdrop-blur-md border border-[var(--skipo-border-color)] shadow-md flex items-center gap-1.5"
          onClick={togglePause}
          icon={isPaused ? <Play size={12} className="text-emerald-400" /> : <Pause size={12} className="text-amber-400" />}
        >
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </BaseButton>
      </div>

      <EntityDetailsPanel
        entity={inspectingEntity}
        isOpen={isDetailsPanelOpen}
        onClose={() => setIsDetailsPanelOpen(false)}
        onSave={(updated) => onUpdateEntity?.(updated)}
        availableTools={availableTools}
        catalog={catalog}
        presets={presets}
        preferencesPresets={preferencesPresets}
      />
    </div>
  );
};

export default SolarSystemVisualizer;
