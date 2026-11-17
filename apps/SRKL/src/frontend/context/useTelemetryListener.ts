/**
 * @file useTelemetryListener.ts
 * @description Authenticated fetch-stream telemetry with backoff and tab visibility suspension.
 * File size < 200 lines strictly.
 */

import { useEffect, useRef } from 'react';
import { luthFetch } from '../auth/luthAuthClient';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { StorageRuntime, HubSettings } from '@/libraries/runtime/StorageRuntime';
import { ActivityRecord, ServiceDefinition } from '@/libraries/types/srkl';

interface TelemetryListenerProps {
  setAccounts: React.Dispatch<React.SetStateAction<ServiceAccount[]>>;
  setActivityLogs: React.Dispatch<React.SetStateAction<ActivityRecord[]>>;
  setSettings: React.Dispatch<React.SetStateAction<HubSettings>>;
  setRegistryVersion: React.Dispatch<React.SetStateAction<number>>;
}

const BACKOFF_DELAYS_MS = [5000, 15000, 30000, 60000, 120000];
const MAX_RETRIES = 5;

export function useTelemetryListener(props: TelemetryListenerProps): void {
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);
  const circuitBrokenRef = useRef<boolean>(false);
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    let streamController: AbortController | null = null;
    let isSubscribed = true;
    circuitBrokenRef.current = false;
    retryCountRef.current = 0;

    const handlePayload = (data: any) => {
      const { setAccounts, setActivityLogs, setSettings, setRegistryVersion } = propsRef.current;
      if (data.type === 'SERVICE_ACCOUNT_SAVED' && data.payload) {
        const acc = new ServiceAccount(data.payload);
        setAccounts((prev) => {
          const idx = prev.findIndex((a) => a.id === acc.id);
          return idx >= 0 ? prev.map((a) => (a.id === acc.id ? acc : a)) : [...prev, acc];
        });
      } else if (data.type === 'SERVICE_ACCOUNT_DELETED' && data.accountId) {
        setAccounts((prev) => prev.filter((a) => a.id !== data.accountId));
      } else if (data.type === 'SERVICE_DEFINITION_REGISTERED' && data.payload) {
        const def = data.payload as ServiceDefinition;
        const existing = StorageRuntime.loadCustomDefinitions().filter((d) => d.identifier !== def.identifier);
        StorageRuntime.saveCustomDefinitions([...existing, def]);
        setRegistryVersion((v) => v + 1);
      } else if (data.type === 'SERVICE_DEFINITION_REMOVED' && data.serviceId) {
        const existing = StorageRuntime.loadCustomDefinitions().filter((d) => d.identifier !== data.serviceId);
        StorageRuntime.saveCustomDefinitions(existing);
        setRegistryVersion((v) => v + 1);
      } else if (data.type === 'ACTIVITY_LOGGED' && data.payload) {
        const log = data.payload as ActivityRecord;
        setActivityLogs((prev) => {
          const next = [log, ...prev].slice(0, 100);
          StorageRuntime.saveActivityLogs(next);
          return next;
        });
      } else if (data.type === 'ACTIVITY_CLEARED') {
        setActivityLogs([]);
        StorageRuntime.saveActivityLogs([]);
      } else if (data.type === 'SETTINGS_UPDATED' && data.payload) {
        setSettings((prev) => ({ ...prev, ...data.payload }));
      }
    };

    const cleanupStream = () => {
      streamController?.abort();
      streamController = null;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (!isSubscribed || circuitBrokenRef.current || document.hidden || retryCountRef.current >= MAX_RETRIES) return;
      const baseDelay = BACKOFF_DELAYS_MS[Math.min(retryCountRef.current, BACKOFF_DELAYS_MS.length - 1)];
      const jitter = baseDelay * (0.85 + Math.random() * 0.3);
      retryCountRef.current++;
      retryTimerRef.current = setTimeout(async () => {
        if (!isSubscribed || circuitBrokenRef.current) return;
        try {
          const probe = await luthFetch('/api/telemetry/status');
          if (probe.status === 401 || probe.status === 403) {
            circuitBrokenRef.current = true;
            return;
          }
        } catch {}
        void connect();
      }, jitter);
    };

    const connect = async () => {
      cleanupStream();
      if (!isSubscribed || circuitBrokenRef.current) return;
      const controller = new AbortController();
      streamController = controller;
      try {
        const response = await luthFetch('/api/telemetry/events', {
          headers: { Accept: 'text/event-stream' },
          signal: controller.signal,
        });
        if (response.status === 401 || response.status === 403) {
          circuitBrokenRef.current = true;
          return;
        }
        if (!response.ok || !response.body) {
          scheduleReconnect();
          return;
        }
        retryCountRef.current = 0;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (isSubscribed && !controller.signal.aborted) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
          let boundary = buffer.indexOf('\n\n');
          while (boundary >= 0) {
            const frame = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            const data = frame.split('\n').filter((line) => line.startsWith('data:'))
              .map((line) => line.slice(5).trimStart()).join('\n');
            if (data) {
              try { handlePayload(JSON.parse(data)); } catch {}
            }
            boundary = buffer.indexOf('\n\n');
          }
        }
        if (isSubscribed && !controller.signal.aborted) scheduleReconnect();
      } catch {
        if (isSubscribed && !controller.signal.aborted) scheduleReconnect();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !circuitBrokenRef.current && isSubscribed) {
        retryCountRef.current = 0;
        void connect();
      } else if (document.hidden) cleanupStream();
    };
    const onOnline = () => {
      if (!circuitBrokenRef.current && isSubscribed) {
        retryCountRef.current = 0;
        void connect();
      }
    };
    const onOffline = () => cleanupStream();

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    void connect();

    return () => {
      isSubscribed = false;
      cleanupStream();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);
}
