import React, { useState } from 'react';
import { ShieldCheck, Database, Terminal, LogOut, Sun, Moon } from 'lucide-react';
import { BottomStrip, useSkipoTheme } from '@skipo/ui';
import { BrutalistHeading } from '../common/BrutalistUi';
import { IconOnlyButton } from '../common/IconOnlyButton';
import AdminDatabaseClusterTab from './AdminDatabaseClusterTab';
import AdminAuditTab from './AdminAuditTab';
import { UserAccount } from '@/libraries/types/auth';

interface AdminWorkspaceViewProps {
  currentUser: UserAccount;
  onLogout: () => void;
}

export default function AdminWorkspaceView({ currentUser, onLogout }: AdminWorkspaceViewProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'databases' | 'logs'>('databases');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const { theme, toggleTheme } = useSkipoTheme();

  const handleRefreshCluster = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div id="admin-workspace-root" className="min-h-screen skipo-theme-bg font-mono flex flex-col justify-between select-none">
      
      {/* Top Console Bar */}
      <header
        className="max-w-6xl w-full mx-auto p-4 md:pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b-2"
        style={{ borderColor: 'var(--skipo-border-color)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2 border-2 shrink-0 flex items-center justify-center shadow-sm"
            style={{
              backgroundColor: 'var(--skipo-accent)',
              color: 'var(--skipo-accent-fg)',
              borderColor: 'var(--skipo-border-color)',
              borderRadius: 'var(--skipo-radius-sm)',
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <BrutalistHeading level={2} className="text-lg md:text-xl font-black uppercase tracking-tight">
              SRKL ADMIN CONTROL PLANE
            </BrutalistHeading>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black uppercase" style={{ color: 'var(--skipo-text)' }}>
              {currentUser.name}
            </p>
          </div>
          <IconOnlyButton
            tooltip={`Switch to ${theme === 'dark' ? 'Light Coffee' : 'Neo Dark'} Theme`}
            icon={theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            variant="surface"
            position="bottom"
            onClick={toggleTheme}
            className="h-9 w-9"
          />
          <IconOnlyButton
            tooltip="Disconnect Session"
            icon={<LogOut size={16} />}
            variant="danger"
            position="bottom"
            onClick={onLogout}
            className="h-9 w-9"
          />
        </div>
      </header>

      {/* Main Console Workspace */}
      <main className="max-w-6xl w-full mx-auto flex-1 p-4 md:py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Sidebar Controls */}
        <div
          className="lg:col-span-1 flex lg:flex-col gap-2 p-1.5 border-2 items-center justify-center"
          style={{
            backgroundColor: 'var(--skipo-surface)',
            borderColor: 'var(--skipo-border-color)',
            borderRadius: 'var(--skipo-radius)',
          }}
        >
          <IconOnlyButton
            tooltip="Database Clusters"
            icon={<Database size={18} />}
            active={activeTab === 'databases'}
            variant="surface"
            position="right"
            onClick={() => setActiveTab('databases')}
            className="h-10 w-10"
          />
          <IconOnlyButton
            tooltip="Security Audit Trails"
            icon={<Terminal size={18} />}
            active={activeTab === 'logs'}
            variant="surface"
            position="right"
            onClick={() => setActiveTab('logs')}
            className="h-10 w-10"
          />
        </div>

        {/* Content Panel Area */}
        <section className="lg:col-span-11 w-full">
          <div
            className="p-4 md:p-6 border-2"
            style={{
              backgroundColor: 'var(--skipo-surface)',
              borderColor: 'var(--skipo-border-color)',
              boxShadow: 'var(--skipo-shadow)',
              borderRadius: 'var(--skipo-radius)',
            }}
          >
            {activeTab === 'databases' ? (
              <AdminDatabaseClusterTab key={refreshKey} currentUser={currentUser} onRefresh={handleRefreshCluster} />
            ) : (
              <AdminAuditTab />
            )}
          </div>
        </section>

      </main>

      {/* Skipo BottomStrip */}
      <BottomStrip
        leftSlot={
          <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-wider ml-1">
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 border"
              style={{
                borderColor: 'var(--skipo-border-color)',
                backgroundColor: 'var(--skipo-matte-bg)',
                color: 'var(--skipo-accent)',
                borderRadius: 'var(--skipo-radius-sm)',
              }}
            >
              <ShieldCheck className="w-3 h-3" />
              ROOT ADMIN CONSOLE
            </span>
          </div>
        }
        rightSlot={
          <div
            className="flex items-center gap-2 text-[10px] font-mono mr-1"
            style={{ color: 'var(--skipo-text-muted)' }}
          >
            <span>SRKL ADMIN v2.5</span>
          </div>
        }
      />

    </div>
  );
}
