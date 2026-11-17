import React from 'react';
import type { UIAuthoringValidation } from '@floks/contracts';

export function UiAuthoringValidationPanel(props: {
  validation?: UIAuthoringValidation;
  status?: string;
  onValidate?: () => void;
  onGenerate?: () => void;
}) {
  return (
    <aside className="border-t border-black/10 p-3 text-xs" aria-label="Authoring validation">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="uppercase tracking-wide">Validation</strong>
        <div className="flex gap-2">
          {props.onValidate && <button type="button" className="rounded border px-2 py-1" onClick={props.onValidate}>Validate</button>}
          {props.onGenerate && <button type="button" className="rounded border px-2 py-1" onClick={props.onGenerate} disabled={props.validation?.valid !== true}>Generate</button>}
        </div>
      </div>
      {props.status && <p className="mt-2 text-[10px] opacity-70">{props.status}</p>}
      {props.validation && (
        <div className="mt-2" role="status" aria-live="polite">
          <p className={props.validation.valid ? 'text-emerald-700' : 'text-red-700'}>
            {props.validation.valid ? 'Validation passed' : `Validation failed · ${props.validation.errors.length} error(s)`}
          </p>
          {props.validation.errors.length > 0 && <ul className="mt-1 list-disc pl-5 text-red-700">{props.validation.errors.map((error, index) => <li key={index}>{error}</li>)}</ul>}
          {props.validation.warnings.length > 0 && <ul className="mt-1 list-disc pl-5 text-amber-700">{props.validation.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>}
        </div>
      )}
    </aside>
  );
}
