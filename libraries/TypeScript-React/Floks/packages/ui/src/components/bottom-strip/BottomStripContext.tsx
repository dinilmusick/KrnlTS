'use client';
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

export type SystemMessageType = 'success' | 'error' | 'warning' | 'info';

export interface SystemMessage {
  id: string;
  type: SystemMessageType;
  message: string;
  timestamp: number;
}

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'dirty';

export interface BottomStripContextValue {
  inspectionText: string | null;
  inspectionDescription: string | null;
  isDKeyPressed: boolean;
  setInspectionText: (
    text: string | { label?: string | null; description?: string | null } | null,
    description?: string | null
  ) => void;
  autoSave: {
    enabled: boolean;
    status: AutoSaveStatus;
    toggle: () => void;
    setStatus: (status: AutoSaveStatus) => void;
    setEnabled: (enabled: boolean) => void;
  };
  apiActivity: {
    activeCount: number;
    lastEndpoint?: string;
    lastMethod?: string;
    recordRequestStart: (endpoint: string, method?: string) => string;
    recordRequestEnd: (requestId: string) => void;
  };
  systemMessages: SystemMessage[];
  showSystemMessage: (message: string, type?: SystemMessageType, durationMs?: number) => void;
  clearSystemMessage: (id: string) => void;
}

const BottomStripContext = createContext<BottomStripContextValue | null>(null);

export interface BottomStripProviderProps {
  children: React.ReactNode;
  initialAutoSave?: boolean;
}

function useAutoSaveController(initialEnabled: boolean) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const toggle = useCallback(() => setEnabled(prev => !prev), []);
  return { enabled, status, toggle, setStatus, setEnabled };
}

function useApiActivityController() {
  const [activeCount, setActiveCount] = useState(0);
  const [lastEndpoint, setLastEndpoint] = useState<string | undefined>(undefined);
  const [lastMethod, setLastMethod] = useState<string | undefined>(undefined);

  const recordRequestStart = useCallback((endpoint: string, method = 'GET') => {
    const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setActiveCount(prev => prev + 1);
    setLastEndpoint(endpoint);
    setLastMethod(method);
    return id;
  }, []);

  const recordRequestEnd = useCallback((_requestId: string) => {
    setActiveCount(prev => Math.max(0, prev - 1));
  }, []);

  return { activeCount, lastEndpoint, lastMethod, recordRequestStart, recordRequestEnd };
}

function useSystemMessageController() {
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);

  const clearSystemMessage = useCallback((id: string) => {
    setSystemMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  const showSystemMessage = useCallback((message: string, type: SystemMessageType = 'info', durationMs = 5000) => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMsg: SystemMessage = { id, type, message, timestamp: Date.now() };
    setSystemMessages(prev => [...prev.slice(-4), newMsg]);
    if (durationMs > 0) {
      setTimeout(() => clearSystemMessage(id), durationMs);
    }
  }, [clearSystemMessage]);

  return { systemMessages, showSystemMessage, clearSystemMessage };
}

export function BottomStripProvider({
  children,
  initialAutoSave = true
}: BottomStripProviderProps) {
  const [inspectionText, setInspectionTextState] = useState<string | null>(null);
  const [inspectionDescription, setInspectionDescription] = useState<string | null>(null);
  const [isDKeyPressed, setIsDKeyPressed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isEditable = (el: EventTarget | null) => {
      const tag = (el as HTMLElement)?.tagName?.toLowerCase();
      return tag === 'input' || tag === 'textarea' || (el as HTMLElement)?.isContentEditable;
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'd' || e.key === 'D') && !isEditable(e.target)) {
        setIsDKeyPressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        setIsDKeyPressed(false);
      }
    };
    const handleBlur = () => setIsDKeyPressed(false);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const setInspectionText = useCallback(
    (
      text: string | { label?: string | null; description?: string | null } | null,
      description?: string | null
    ) => {
      if (text && typeof text === 'object') {
        setInspectionTextState(text.label || null);
        setInspectionDescription(text.description || null);
      } else {
        setInspectionTextState(typeof text === 'string' ? text : null);
        setInspectionDescription(description || null);
      }
    },
    []
  );

  const autoSave = useAutoSaveController(initialAutoSave);
  const apiActivity = useApiActivityController();
  const { systemMessages, showSystemMessage, clearSystemMessage } = useSystemMessageController();

  const value = useMemo<BottomStripContextValue>(() => ({
    inspectionText,
    inspectionDescription,
    isDKeyPressed,
    setInspectionText,
    autoSave,
    apiActivity,
    systemMessages,
    showSystemMessage,
    clearSystemMessage,
  }), [inspectionText, inspectionDescription, isDKeyPressed, setInspectionText, autoSave, apiActivity, systemMessages, showSystemMessage, clearSystemMessage]);

  return (
    <BottomStripContext.Provider value={value}>
      {children}
    </BottomStripContext.Provider>
  );
}

export function useBottomStrip(): BottomStripContextValue {
  const ctx = useContext(BottomStripContext);
  if (!ctx) {
    // Return a safe fallback mock if outside provider
    return {
      inspectionText: null,
      inspectionDescription: null,
      isDKeyPressed: false,
      setInspectionText: () => {},
      autoSave: {
        enabled: true,
        status: 'idle',
        toggle: () => {},
        setStatus: () => {},
        setEnabled: () => {}
      },
      apiActivity: {
        activeCount: 0,
        recordRequestStart: () => 'noop',
        recordRequestEnd: () => {}
      },
      systemMessages: [],
      showSystemMessage: () => {},
      clearSystemMessage: () => {}
    };
  }
  return ctx;
}
