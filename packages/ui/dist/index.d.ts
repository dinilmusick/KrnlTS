import { State } from 'vanjs-core';

interface KrnlButtonProps {
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
    tooltipLabel?: string;
    icon?: string;
    loading?: State<boolean> | boolean;
    disabled?: State<boolean> | boolean;
    type?: 'button' | 'submit' | 'reset';
    tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
    onclick?: (e: MouseEvent) => void;
}
declare function KrnlButton({ variant, tooltipLabel, icon, loading, disabled, type, tooltipPosition, onclick }: KrnlButtonProps): HTMLElement;

interface KrnlTextInputProps {
    label?: string;
    value?: State<string> | string;
    placeholder?: string;
    onChange?: (val: string) => void;
    required?: boolean;
    type?: string;
}
declare function KrnlTextInput({ label: labelText, value, placeholder, onChange, required, type }: KrnlTextInputProps): HTMLElement;

interface KrnlDropdownProps {
    label?: string;
    value?: State<string> | string;
    options?: State<any[]> | any[];
    onChange?: (val: string) => void;
    required?: boolean;
}
declare function KrnlDropdown({ label: labelText, value, options, onChange, required }: KrnlDropdownProps): HTMLElement;

interface KrnlTextAreaProps {
    label?: string;
    value?: State<string> | string;
    placeholder?: string;
    onChange?: (val: string) => void;
    rows?: number;
}
declare function KrnlTextArea({ label: labelText, value, placeholder, onChange, rows }: KrnlTextAreaProps): HTMLElement;

interface KrnlJsonViewerProps {
    label?: string;
    data?: any;
}
declare function KrnlJsonViewer({ label: labelText, data }: KrnlJsonViewerProps): HTMLElement;

interface KrnlTileProps {
    label?: string;
    value?: any;
    subtitle?: string;
}
declare function KrnlTile({ label: labelText, value, subtitle }: KrnlTileProps): HTMLElement;

interface SharedSlot {
    options: State<any[]>;
    value: State<any>;
}
declare function getSharedSlot(id?: string): SharedSlot;

/**
 * @file KrnlAgentBridge.ts
 * @description In-browser UI Agent Bridge and WebSocket relay for KrnlTS applications.
 */
interface KrnlComponentState {
    fid: string;
    formData: Record<string, any>;
    response: any;
    loading: boolean;
    error: string | null;
    lastUpdated: number;
}
interface KrnlComponentRegistration {
    trigger: (overrideInput?: Record<string, any>, ticketId?: string) => Promise<any>;
}
declare class KrnlAgentBridgeManager {
    private states;
    private registrations;
    private listeners;
    private ws;
    constructor();
    private initWebSocket;
    register(fid: string, reg: KrnlComponentRegistration): void;
    unregister(fid: string): void;
    setState(fid: string, state: KrnlComponentState): void;
    getState(fid?: string): Record<string, KrnlComponentState> | KrnlComponentState | null;
    trigger(fid: string, overrideInput?: Record<string, any>, ticketId?: string): Promise<any>;
    sendJobComplete(ticketId: string, fid: string, result?: any, error?: string): void;
    subscribe(listener: (snapshot: Record<string, KrnlComponentState>) => void): () => void;
    private notifyListeners;
    private sendComponentReady;
    private sendComponentUnready;
    private sendReadySignal;
    private sendFullSnapshot;
}
declare const KrnlAgentBridge: KrnlAgentBridgeManager;

interface KrnlTooltipProps {
    text: string;
    placement?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
    children: HTMLElement | HTMLElement[];
}
/**
 * KrnlTooltip enforces the Skipo UI Invariant:
 * Elements near the top edge (< 80px) MUST pop downwards to prevent clipping.
 */
declare function KrnlTooltip({ text, placement, children }: KrnlTooltipProps): HTMLElement;

interface KrnlDockItem {
    id: string;
    icon: string | HTMLElement;
    label: string;
    badge?: string | number;
    onClick: () => void;
    active?: boolean;
}
interface KrnlDockProps {
    items: KrnlDockItem[];
    position?: 'bottom' | 'top' | 'left' | 'right';
    className?: string;
}
/**
 * KrnlDock: macOS-style 4-edge dock window switcher adhering to Skipo Neo-Brutalist UI standard.
 */
declare function KrnlDock({ items, position, className }: KrnlDockProps): HTMLElement;

/**
 * Direct-DOM Reactivity Bridge for KrnlUI.
 * Connects VanJS reactive state directly to Entity state accessors and event streams.
 */
declare class KrnlReactiveBridge {
    private static states;
    /**
     * Retrieves or creates a reactive VanJS state bound to an Entity state key.
     */
    static useEntityState<T>(key: string, initialValue: T): State<T>;
    /**
     * Synchronizes an Entity event emission with a reactive state.
     */
    static syncEvent<T>(state: State<T>, eventPayload: T): void;
    /**
     * Binds a DOM input element directly to a reactive state (two-way binding with zero VDOM).
     */
    static bindInput(state: State<string>): {
        value: () => string;
        oninput: (e: Event) => void;
    };
}

export { KrnlAgentBridge, KrnlAgentBridgeManager, KrnlButton, type KrnlButtonProps, type KrnlComponentRegistration, type KrnlComponentState, KrnlDock, type KrnlDockItem, type KrnlDockProps, KrnlDropdown, type KrnlDropdownProps, KrnlJsonViewer, type KrnlJsonViewerProps, KrnlReactiveBridge, KrnlTextArea, type KrnlTextAreaProps, KrnlTextInput, type KrnlTextInputProps, KrnlTile, type KrnlTileProps, KrnlTooltip, type KrnlTooltipProps, type SharedSlot, getSharedSlot };
