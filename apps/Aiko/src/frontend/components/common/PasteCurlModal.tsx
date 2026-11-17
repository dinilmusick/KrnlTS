import React, { useState } from 'react';
import { Terminal, Check, X, Code2, AlertCircle } from 'lucide-react';
import { BaseButton, BaseTextarea } from '@ultrst-armada/floks';
import { parseCurlCommand, ParsedCurl } from '../../lib/curlParser.js';

export interface PasteCurlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (parsed: ParsedCurl) => void;
  title?: string;
  description?: string;
}

const SAMPLE_CURL = `curl -X POST "https://api.example.com/v1/extract" \\
  -H "Content-Type: application/json" \\
  -d '{"documentId": "doc-994", "mode": "deep_analysis", "includeEmbeddings": true}'`;

export const PasteCurlModal: React.FC<PasteCurlModalProps> = ({
  isOpen,
  onClose,
  onApply,
  title = 'Import cURL Endpoint',
  description = 'Paste any standard curl command to auto-configure endpoint, method & payload'
}) => {
  const [curlText, setCurlText] = useState('');
  const [parsed, setParsed] = useState<ParsedCurl | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTextChange = (val: string) => {
    setCurlText(val);
    setParseError(null);
    if (!val.trim()) {
      setParsed(null);
      return;
    }
    const result = parseCurlCommand(val);
    if (result) {
      setParsed(result);
    } else {
      setParsed(null);
      setParseError('Unable to parse valid cURL command');
    }
  };

  const handleApply = () => {
    if (!parsed) return;
    onApply(parsed);
    onClose();
  };

  const handleUseSample = () => {
    handleTextChange(SAMPLE_CURL);
  };

  return (
    <div
      onWheel={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none overscroll-contain"
    >
      <div
        className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-xl bg-[var(--skipo-surface)] border-2 border-[var(--skipo-border-color)] shadow-2xl overflow-hidden text-[var(--skipo-text)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-[var(--skipo-border-color)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[var(--skipo-accent)]/15 border border-[var(--skipo-accent)] text-[var(--skipo-accent)] flex items-center justify-center">
              <Terminal size={14} />
            </div>
            <div>
              <h3 className="font-mono font-bold text-xs text-[var(--skipo-accent)]">{title}</h3>
              <p className="text-[10px] text-[var(--skipo-text-muted)] font-mono">{description}</p>
            </div>
          </div>
          <BaseButton size="sm" variant="ghost" onClick={onClose} className="p-1 h-6 w-6">
            <X size={13} />
          </BaseButton>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--skipo-text-muted)]">cURL Command</span>
            <button
              type="button"
              onClick={handleUseSample}
              className="text-[10px] text-[var(--skipo-accent)] hover:underline flex items-center gap-1"
            >
              <Code2 size={11} />
              Sample cURL
            </button>
          </div>

          <BaseTextarea
            placeholder="curl -X POST https://api.endpoint.com/v1/action -H 'Content-Type: application/json' -d '{...}'"
            value={curlText}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={5}
            className="text-xs font-mono bg-black/40 border-[var(--skipo-border-color)] resize-y"
          />

          {parseError && (
            <div className="p-2 rounded bg-rose-950/20 border border-[var(--skipo-danger)] text-[var(--skipo-danger)] text-[10px] flex items-center gap-1.5">
              <AlertCircle size={12} />
              <span>{parseError}</span>
            </div>
          )}

          {parsed && (
            <div className="p-2.5 rounded-lg border border-[var(--skipo-border-color)] bg-[var(--skipo-matte-bg)] space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--skipo-accent)] text-[var(--skipo-accent-fg)] uppercase">
                  {parsed.method}
                </span>
                <span className="text-[11px] text-[var(--skipo-text)] font-semibold truncate">
                  {parsed.path}
                </span>
              </div>

              {parsed.domain && (
                <div className="text-[10px] text-[var(--skipo-text-muted)]">
                  Host: <span className="text-[var(--skipo-text)]">{parsed.domain}</span>
                </div>
              )}

              {parsed.jsonPayload && (
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-[var(--skipo-text-muted)]">
                    Inferred Payload Fields:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(parsed.jsonPayload).map((key) => (
                      <span
                        key={key}
                        className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--skipo-surface)] border border-[var(--skipo-border-color)] text-[var(--skipo-info)]"
                      >
                        {key}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--skipo-border-color)] flex justify-end gap-2">
          <BaseButton size="sm" variant="secondary" onClick={onClose}>
            Cancel
          </BaseButton>
          <BaseButton
            size="sm"
            variant="accent"
            onClick={handleApply}
            disabled={!parsed}
            icon={<Check size={12} />}
          >
            Apply Endpoint
          </BaseButton>
        </div>
      </div>
    </div>
  );
};
