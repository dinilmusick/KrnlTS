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

interface KrnlTileProps {
    label?: string;
    value?: any;
    subtitle?: string;
}
declare function KrnlTile({ label: labelText, value, subtitle }: KrnlTileProps): HTMLElement;

interface KrnlJsonViewerProps {
    label?: string;
    data?: any;
}
declare function KrnlJsonViewer({ label: labelText, data }: KrnlJsonViewerProps): HTMLElement;

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

interface SharedSlot {
    options: State<any[]>;
    value: State<any>;
}
declare function getSharedSlot(id?: string): SharedSlot;

interface KrnlMonacoProps {
    value?: string | State<string>;
    language?: string;
    readOnly?: boolean;
    theme?: string;
    height?: string;
    width?: string;
    lineNumbers?: 'on' | 'off';
    minimap?: boolean;
    onChange?: (newValue: string) => void;
    class?: string;
    style?: string;
}
/**
 * KrnlMonacoEditor: Embeds a full-featured Monaco Code Editor instance
 * configured with the locked Neo-Brutalist krnl-dark theme.
 */
declare function KrnlMonacoEditor(props?: KrnlMonacoProps): HTMLElement;

type StorageSelectionMode = "local" | "connect_existing" | "managed";
type ConnectionWizardStep = "DISCONNECTED" | "SELECT_STORAGE_MODE" | "SELECT_PROVIDER" | "AUTHENTICATING" | "AUTHENTICATED" | "SELECT_RESOURCE" | "VERIFYING" | "VERIFIED" | "INITIALIZING" | "READY" | "CONNECTION_ERROR" | "PERMISSION_ERROR";
interface ProviderFieldConfig {
    key: string;
    label: string;
    type: "text" | "password" | "url";
    placeholder: string;
    isSecret: boolean;
    required?: boolean;
}
interface ProviderDescriptor {
    id: string;
    name: string;
    category: "relational_sql" | "document_nosql" | "embedded_baas" | "object_storage";
    iconSvg: string;
    description: string;
    supportsOAuth: boolean;
    supportsAutomaticProvisioning: boolean;
    supportsManualConnection: boolean;
    requiredFields: ProviderFieldConfig[];
}
interface WorkspaceBackendConnectionState {
    mode: StorageSelectionMode;
    providerId?: string;
    endpoint?: string;
    clientKey?: string;
    databaseName?: string;
    status: "CONNECTED" | "DISCONNECTED" | "INITIALIZING" | "ERROR";
    latencyMs?: number;
    databaseConnected: boolean;
    storageConnected: boolean;
    schemaInitialized: boolean;
    errorMessage?: string;
}
/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: ProviderRegistry
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Centralized repository of supported storage and BaaS providers, decoupled from UI.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
declare class ProviderRegistry {
    private static providers;
    static register(descriptor: ProviderDescriptor): void;
    static getAll(): ProviderDescriptor[];
    static get(id: string): ProviderDescriptor | undefined;
}
interface KrnlBackendConnectionWizardProps {
    initialState?: Partial<WorkspaceBackendConnectionState>;
    onConnectionSuccess?: (state: WorkspaceBackendConnectionState) => void;
    onDisconnect?: () => void;
    onTestConnection?: (config: Record<string, string>) => Promise<{
        ok: boolean;
        latencyMs: number;
        errorMessage?: string;
    }>;
}
/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * COMPONENT: KrnlBackendConnectionWizard
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Direct-DOM reactive Neo-Brutalist wizard facilitating zero-jargon workspace storage
 *          selection, live latency probes, automatic schema initialization, and status monitoring.
 *
 * Flow Chart:
 *   [SELECT_STORAGE_MODE] ──► [Local (Instant Ready)]
 *           │
 *           └──► [Connect Existing] ──► [SELECT_PROVIDER] ──► [ENTER CREDENTIALS]
 *                                                                    │
 *                                                                    ▼
 *                                                            [VERIFY & AUTO-INIT]
 *                                                                    │
 *                                                                    ▼
 *                                                             [READY (Status)]
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
declare function KrnlBackendConnectionWizard(props?: KrnlBackendConnectionWizardProps): HTMLDivElement;

interface KrnlWorkspaceTileProps {
    id: string;
    name: string;
    icon?: string;
    primaryProvider: string;
    backupProviders?: string[];
    syncStatus?: "SYNCED" | "OUT_OF_SYNC" | "SYNCING" | "ERROR";
    onSelectWorkspace?: (id: string) => void;
    onOpenSettings?: (id: string) => void;
}
/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * COMPONENT: KrnlWorkspaceTile
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Direct-DOM reactive Neo-Brutalist tile rendering workspace identity, primary/backup
 *          storage summary, and sync status with icon-only action buttons and ambient hover glow.
 *
 * Flow Chart:
 *   [Workspace Tile] ───► [User Hover: Reveal Actions + Ambient Glow]
 *                                   │
 *                       (Click Tile) ├──► [onSelectWorkspace(id)]
 *                     (Click Config) └──► [onOpenSettings(id)]
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
declare function KrnlWorkspaceTile({ id, name, icon, primaryProvider, backupProviders, syncStatus, onSelectWorkspace, onOpenSettings }: KrnlWorkspaceTileProps): HTMLElement;

interface WorkspaceStorageSummary {
    id: string;
    name: string;
    icon?: string;
    primaryStorage: {
        id: string;
        provider: string;
        syncState?: "SYNCED" | "OUT_OF_SYNC" | "SYNCING" | "ERROR";
    };
    backupStorages?: Array<{
        id: string;
        provider: string;
        syncState?: string;
    }>;
}
interface KrnlWorkspaceSelectorProps {
    workspaces: WorkspaceStorageSummary[];
    workspaceOrder?: string[];
    onSelectWorkspace?: (id: string) => void;
    onOpenSettings?: (id: string) => void;
    onCreateWorkspace?: () => void;
    onReorderWorkspaces?: (newOrder: string[]) => void;
}
/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * COMPONENT: KrnlWorkspaceSelector
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Post-login workspace selector screen rendering reorderable workspace tiles,
 *          storage summaries, sync indicators, and action for creating new workspaces.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
declare function KrnlWorkspaceSelector({ workspaces, workspaceOrder, onSelectWorkspace, onOpenSettings, onCreateWorkspace }: KrnlWorkspaceSelectorProps): HTMLElement;

interface WorkspaceStorageSettingsDescriptor {
    id: string;
    name: string;
    primaryStorage: {
        id: string;
        provider: string;
        status?: string;
        syncState?: string;
    };
    backupStorages: Array<{
        id: string;
        provider: string;
        status?: string;
        syncState?: string;
    }>;
    sync?: {
        mode: string;
        conflictStrategy: string;
        enabled: boolean;
    };
}
interface KrnlWorkspaceStorageSettingsProps {
    workspace: WorkspaceStorageSettingsDescriptor;
    onTestConnection?: (endpointId: string) => Promise<{
        ok: boolean;
        latencyMs: number;
    }>;
    onChangePrimary?: (newPrimaryId: string) => void;
    onAddBackup?: (endpoint: any) => void;
    onDetachStorage?: (endpointId: string) => void;
    onUpdateSyncConfig?: (config: any) => void;
}
/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * COMPONENT: KrnlWorkspaceStorageSettings
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Dedicated workspace storage and sync configuration panel located under
 *          General Settings -> Workspace -> Storage.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
declare function KrnlWorkspaceStorageSettings({ workspace, onTestConnection, onChangePrimary, onDetachStorage }: KrnlWorkspaceStorageSettingsProps): HTMLElement;

export { type ConnectionWizardStep, KrnlAgentBridge, KrnlAgentBridgeManager, KrnlBackendConnectionWizard, type KrnlBackendConnectionWizardProps, KrnlButton, type KrnlButtonProps, type KrnlComponentRegistration, type KrnlComponentState, KrnlDock, type KrnlDockItem, type KrnlDockProps, KrnlDropdown, type KrnlDropdownProps, KrnlJsonViewer, type KrnlJsonViewerProps, KrnlMonacoEditor, type KrnlMonacoProps, KrnlReactiveBridge, KrnlTextArea, type KrnlTextAreaProps, KrnlTextInput, type KrnlTextInputProps, KrnlTile, type KrnlTileProps, KrnlTooltip, type KrnlTooltipProps, KrnlWorkspaceSelector, type KrnlWorkspaceSelectorProps, KrnlWorkspaceStorageSettings, type KrnlWorkspaceStorageSettingsProps, KrnlWorkspaceTile, type KrnlWorkspaceTileProps, type ProviderDescriptor, type ProviderFieldConfig, ProviderRegistry, type SharedSlot, type StorageSelectionMode, type WorkspaceBackendConnectionState, type WorkspaceStorageSettingsDescriptor, type WorkspaceStorageSummary, getSharedSlot };
