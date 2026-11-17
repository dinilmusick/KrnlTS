/**
 * @file KeyModelVerificationSuite.tsx
 * @description Suite for bulk testing and verifying all active keys against their providers
 */

import React, { useState } from 'react';
import { ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { BaseButton } from '../../base/BaseButton.js';

export interface KeyModelVerificationSuiteProps {
  onVerifyAll: () => Promise<void>;
  totalKeys: number;
  validKeys: number;
}

export const KeyModelVerificationSuite: React.FC<KeyModelVerificationSuiteProps> = ({
  onVerifyAll,
  totalKeys,
  validKeys,
}) => {
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      await onVerifyAll();
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-mono text-xs">
      <div className="flex items-center gap-3">
        <ShieldCheck size={18} className="text-indigo-500" />
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100">Verification Engine</div>
          <div className="text-[11px] text-slate-500">
            {validKeys} of {totalKeys} keys verified active
          </div>
        </div>
      </div>

      <BaseButton
        size="sm"
        variant="secondary"
        onClick={handleRun}
        disabled={isRunning || totalKeys === 0}
        className="flex items-center gap-1.5"
      >
        <RefreshCw size={12} className={isRunning ? 'animate-spin' : ''} />
        {isRunning ? 'Testing...' : 'Verify All'}
      </BaseButton>
    </div>
  );
};
