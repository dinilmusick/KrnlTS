/**
 * @file DashboardServiceGrid.tsx
 * @description Surveillance grid for registered services on Dashboard.
 * Fully wired to Skipo theme tokens.
 * Adheres to Skipo code limits (<200 lines).
 */

import React from 'react';
import { Radio, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useHub } from '../../context/HubContext';
import { Badge } from '../common/Badge';
import { BaseButton } from '@skipo/ui';
import { BrutalistButton } from '../common/BrutalistUi';

export function DashboardServiceGrid(): React.ReactElement {
  const { registry, setActiveTab } = useHub();
  const services = registry.getAll();

  return (
    <div className="space-y-3 font-mono select-none">
      <div
        className="flex items-center justify-between pb-2 border-b"
        style={{ borderColor: 'var(--skipo-border-color)' }}
      >
        <h2
          className="text-xs font-black tracking-wider flex items-center gap-2 uppercase"
          style={{ color: 'var(--skipo-text)' }}
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" style={{ color: 'var(--skipo-accent)' }} />
          ACTIVE SURVEILLANCE MATRIX
        </h2>
        <BaseButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('SERVICES')}
          className="text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors border-0"
          style={{ color: 'var(--skipo-accent)' }}
        >
          View All <ArrowUpRight className="w-3 h-3" />
        </BaseButton>
      </div>

      {services.length === 0 ? (
        <div
          className="p-8 border text-center font-mono space-y-3"
          style={{
            backgroundColor: 'var(--skipo-matte-bg)',
            borderColor: 'var(--skipo-border-color)',
            borderRadius: 'var(--skipo-radius)',
          }}
        >
          <div className="font-black text-xs uppercase tracking-wider" style={{ color: 'var(--skipo-accent)' }}>
            WORKSPACE READY • ZERO ACTIVE SERVICES
          </div>
          <p className="text-xs max-w-md mx-auto leading-relaxed" style={{ color: 'var(--skipo-text-muted)' }}>
            All placeholder entries and demonstration data have been purged. You have a clean start. Create a custom service adapter or choose a service template to begin tracking your infrastructure.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <BrutalistButton
              variant="accent"
              size="sm"
              onClick={() => setActiveTab('SERVICE_BUILDER')}
              tooltip="Open Service Builder"
            >
              Open Service Builder
            </BrutalistButton>
            <BrutalistButton
              variant="surface"
              size="sm"
              onClick={() => setActiveTab('SERVICES')}
              tooltip="Browse Services View"
            >
              Browse Services View
            </BrutalistButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {services.map((service) => {
            return (
              <div
                key={service.identifier}
                className="p-4 border transition-colors space-y-3"
                style={{
                  backgroundColor: 'var(--skipo-surface)',
                  borderColor: 'var(--skipo-border-color)',
                  borderRadius: 'var(--skipo-radius-sm)',
                  boxShadow: 'var(--skipo-shadow)',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black uppercase" style={{ color: 'var(--skipo-text)' }}>
                      {service.name}
                    </h3>
                    <p className="text-[11px] line-clamp-1" style={{ color: 'var(--skipo-text-muted)' }}>
                      {service.description}
                    </p>
                  </div>
                  <Badge status={service.status} />
                </div>

                <div
                  className="text-[11px] space-y-1.5 pt-2 border-t"
                  style={{ borderColor: 'var(--skipo-border-color)' }}
                >
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--skipo-text-muted)' }}>Provider:</span>
                    <span className="font-semibold" style={{ color: 'var(--skipo-text)' }}>
                      {service.providerType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--skipo-text-muted)' }}>Endpoints:</span>
                    <span style={{ color: 'var(--skipo-text)' }}>
                      {service.definition.endpoints.length} Registered
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--skipo-text-muted)' }}>Actions:</span>
                    <span style={{ color: 'var(--skipo-text)' }}>
                      {service.definition.actions.length} Supported
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[10px]" style={{ color: 'var(--skipo-text-muted)' }}>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" style={{ color: 'var(--skipo-success)' }} />
                    Auth: {service.definition.authType}
                  </span>
                  <span>v{service.version}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
