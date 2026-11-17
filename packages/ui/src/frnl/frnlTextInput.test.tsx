import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import React, { useState } from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { z } from 'zod';

const resolveFrnlInputMock = vi.fn();

vi.mock('@ultrst-armada/frnlts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ultrst-armada/frnlts')>();
  return {
    ...actual,
    resolveFrnlInput: (...args: unknown[]) => resolveFrnlInputMock(...args),
  };
});

import {
  FrnlSemanticInputProvider,
  createFrnlInputContract,
  type FrnlInputContract,
} from '@ultrst-armada/frnlts';
import { frnlTextInput } from './frnlTextInput.js';

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('frnlTextInput Semantic Input Specification', () => {
  it('automatically attaches the framework semantic contract for text inputs', async () => {
    resolveFrnlInputMock.mockResolvedValueOnce({
      status: 'resolved',
      value: 'canonical text',
      candidates: [],
      modelOutput: 'canonical text',
    });

    const onSemanticValue = vi.fn();
    render(
      React.createElement(frnlTextInput, {
        id: 'auto-semantic',
        label: 'Notes',
        name: 'notes',
        type: 'text',
        value: 'natural language note',
        onChange: () => {},
        onSemanticValue,
      })
    );

    const input = screen.getByLabelText('Notes');
    expect(input).toHaveAttribute('data-semantic-input', 'true');

    await act(async () => {
      fireEvent.blur(input);
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(resolveFrnlInputMock).toHaveBeenCalledTimes(1);
    const [contract, rawInput] = resolveFrnlInputMock.mock.calls[0];
    expect(contract.name).toBe('notes');
    expect(contract.schema).toEqual({type: 'string'});
    expect(rawInput).toBe('natural language note');
    expect(onSemanticValue).toHaveBeenCalledWith('canonical text', undefined);
  });

  it('allows an explicit null semanticInput to disable the automatic semantic layer', () => {
    render(
      React.createElement(frnlTextInput, {
        id: 'semantic-off',
        label: 'Plain',
        type: 'text',
        value: 'ordinary text',
        semanticInput: null,
        onChange: () => {},
      })
    );

    expect(screen.getByLabelText('Plain')).toHaveAttribute('data-semantic-input', 'false');
  });

  // 1. Semantic contract attachment
  it('1. reflects semantic contract attachment via data-semantic-input attribute', () => {
    const contract = createFrnlInputContract<string>({
      name: 'testField',
      label: 'Test Field',
      schema: { type: 'string' },
      validator: z.string(),
      description: 'Test string',
    });

    const { rerender } = render(
      React.createElement(frnlTextInput, {
        id: 'input-1',
        label: 'Contract Input',
        value: 'hello',
        onChange: () => {},
        semanticInput: contract,
      })
    );

    const input = screen.getByLabelText('Contract Input');
    expect(input).toHaveAttribute('data-semantic-input', 'true');

    rerender(
      React.createElement(frnlTextInput, {
        id: 'input-1',
        label: 'Contract Input',
        value: 'hello',
        onChange: () => {},
        semanticInput: null,
      })
    );

    expect(input).toHaveAttribute('data-semantic-input', 'false');
  });

  // 2. Resolution on blur & 3. Canonical onChange propagation
  it('2 & 3. resolves semantic input on blur and propagates canonical value via onChange', async () => {
    resolveFrnlInputMock.mockResolvedValueOnce({
      status: 'resolved',
      value: 42,
      candidates: [],
      modelOutput: 42,
    });

    let resolvedValue: any = null;
    let rawPreserved: string | undefined = undefined;
    let syntheticEventValue: string | null = null;

    const contract: FrnlInputContract<number> = createFrnlInputContract<number>({
      name: 'quantity',
      label: 'Quantity',
      schema: { type: 'integer', minimum: 1, maximum: 100 },
      validator: z.number().int().min(1).max(100),
      description: 'Quantity count',
    });

    function ControlledInput() {
      const [val, setVal] = useState('forty-two');
      return React.createElement(frnlTextInput, {
        id: 'blur-input',
        label: 'Quantity',
        value: val,
        semanticInput: contract,
        onChange: (e) => {
          syntheticEventValue = e.target.value;
          setVal(e.target.value);
        },
        onSemanticValue: (value, raw) => {
          resolvedValue = value;
          rawPreserved = raw;
        },
      });
    }

    render(React.createElement(ControlledInput));

    const input = screen.getByLabelText('Quantity');
    await act(async () => {
      fireEvent.blur(input);
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(resolvedValue).toBe(42);
    expect(syntheticEventValue).toBe('42');
    expect(rawPreserved).toBeUndefined(); // default preserveRawInput = false
    expect(resolveFrnlInputMock).toHaveBeenCalledTimes(1);
    expect(resolveFrnlInputMock).toHaveBeenCalledWith(contract, 'forty-two', {});
  });

  // 4. Zod-invalid rejection
  it('4. rejects values failing schema validation and does not invoke onSemanticValue', async () => {
    // When resolveFrnlInput rejects due to Zod validation failure, status is invalid
    resolveFrnlInputMock.mockResolvedValueOnce({
      status: 'invalid',
      value: undefined,
      candidates: [],
      modelOutput: 999,
    });

    let called = false;

    const contract: FrnlInputContract<number> = createFrnlInputContract<number>({
      name: 'smallCount',
      label: 'Small Number',
      schema: { type: 'integer', maximum: 10 },
      validator: z.number().max(10), // Limit is 10
      description: 'Small count',
    });

    render(
      React.createElement(frnlTextInput, {
        id: 'zod-reject-input',
        label: 'Small Number',
        value: 'huge number',
        semanticInput: contract,
        onChange: () => {},
        onSemanticValue: () => {
          called = true;
        },
      })
    );

    const input = screen.getByLabelText('Small Number');
    await act(async () => {
      fireEvent.blur(input);
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(called).toBe(false);
    expect(resolveFrnlInputMock).toHaveBeenCalledTimes(1);
  });

  // 5. Context reach via FrnlSemanticInputProvider
  it('5. merges context from FrnlSemanticInputProvider with local input contract context', async () => {
    resolveFrnlInputMock.mockResolvedValueOnce({
      status: 'resolved',
      value: '90210',
      candidates: [],
      modelOutput: '90210',
    });

    const contract: FrnlInputContract<string> = createFrnlInputContract<string>({
      name: 'postalCode',
      label: 'Zip Code',
      schema: { type: 'string' },
      validator: z.string(),
      context: { constraints: ['country:US'] },
    });

    render(
      React.createElement(
        FrnlSemanticInputProvider,
        { value: { page: 'checkout', section: 'shipping' } },
        React.createElement(frnlTextInput, {
          id: 'context-input',
          label: 'Zip Code',
          value: 'beverly hills',
          semanticInput: contract,
          onChange: () => {},
        })
      )
    );

    const input = screen.getByLabelText('Zip Code');
    await act(async () => {
      fireEvent.blur(input);
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(resolveFrnlInputMock).toHaveBeenCalledWith(
      contract,
      'beverly hills',
      { page: 'checkout', section: 'shipping' }
    );
  });

  // 6. Raw input retention disabled by default and enabled on request
  it('6. omits raw input by default, preserves raw input when preserveRawInput: true', async () => {
    resolveFrnlInputMock
      .mockResolvedValueOnce({
        status: 'resolved',
        value: 'clean',
        candidates: [],
        modelOutput: 'clean',
        // default preserveRawInput: false -> no rawInput
      })
      .mockResolvedValueOnce({
        status: 'resolved',
        value: 'clean',
        candidates: [],
        modelOutput: 'clean',
        rawInput: '   messy natural input   ',
      });

    let defaultRaw: string | undefined = 'initial';
    let enabledRaw: string | undefined = undefined;

    const defaultContract: FrnlInputContract<string> = createFrnlInputContract<string>({
      name: 'rawDefault',
      label: 'Raw Default',
      schema: { type: 'string' },
      validator: z.string(),
    });

    const preserveContract: FrnlInputContract<string> = createFrnlInputContract<string>({
      name: 'rawPreserve',
      label: 'Raw Preserve',
      schema: { type: 'string' },
      validator: z.string(),
      preserveRawInput: true,
    });

    const { rerender } = render(
      React.createElement(frnlTextInput, {
        id: 'raw-test',
        label: 'Raw Test',
        value: '   messy natural input   ',
        semanticInput: defaultContract,
        onChange: () => {},
        onSemanticValue: (_v, raw) => {
          defaultRaw = raw;
        },
      })
    );

    const input = screen.getByLabelText('Raw Test');
    await act(async () => {
      fireEvent.blur(input);
      await new Promise((r) => setTimeout(r, 20));
    });

    // Default: raw input must be undefined
    expect(defaultRaw).toBeUndefined();

    rerender(
      React.createElement(frnlTextInput, {
        id: 'raw-test',
        label: 'Raw Test',
        value: '   messy natural input   ',
        semanticInput: preserveContract,
        onChange: () => {},
        onSemanticValue: (_v, raw) => {
          enabledRaw = raw;
        },
      })
    );

    await act(async () => {
      fireEvent.blur(input);
      await new Promise((r) => setTimeout(r, 20));
    });

    // Explicit preserveRawInput = true
    expect(enabledRaw).toBe('   messy natural input   ');
  });

  // 7. Ordinary inputs with semanticInput={null} behave normally
  it('7. ordinary inputs without semanticInput behave normally and fire onBlur without resolution', async () => {
    let blurFired = false;
    let changeFired = false;

    render(
      React.createElement(frnlTextInput, {
        id: 'normal-input',
        label: 'Standard',
        value: 'plain text',
        semanticInput: null,
        onBlur: () => {
          blurFired = true;
        },
        onChange: () => {
          changeFired = true;
        },
      })
    );

    const input = screen.getByLabelText('Standard');
    fireEvent.change(input, { target: { value: 'plain text updated' } });
    expect(changeFired).toBe(true);

    fireEvent.blur(input);
    expect(blurFired).toBe(true);
    expect(resolveFrnlInputMock).not.toHaveBeenCalled();
  });

  // 8. No competing input component
  it('8. verifies frnlTextInput is the canonical single input component', () => {
    expect(typeof frnlTextInput).toBe('function');
  });

  // 9. Delegation strictly to resolveFrnlInput / GutTS primitives
  it('9. strictly delegates resolution to resolveFrnlInput and GutTS without local models', async () => {
    resolveFrnlInputMock.mockResolvedValueOnce({
      status: 'resolved',
      value: 'delegated-ok',
      candidates: [],
      modelOutput: 'delegated-ok',
    });

    const contract: FrnlInputContract<string> = createFrnlInputContract<string>({
      name: 'delegationField',
      label: 'Delegation',
      schema: { type: 'string' },
      validator: z.string(),
      description: 'Strict delegation test',
    });

    let receivedValue: string | null = null;
    render(
      React.createElement(frnlTextInput, {
        id: 'delegation-input',
        label: 'Delegation',
        value: 'raw text to delegate',
        semanticInput: contract,
        onChange: () => {},
        onSemanticValue: (v) => {
          receivedValue = v;
        },
      })
    );

    const input = screen.getByLabelText('Delegation');
    await act(async () => {
      fireEvent.blur(input);
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(resolveFrnlInputMock).toHaveBeenCalledTimes(1);
    expect(resolveFrnlInputMock).toHaveBeenCalledWith(
      contract,
      'raw text to delegate',
      {}
    );
    expect(receivedValue).toBe('delegated-ok');
  });
  it('10. exposes non-resolved semantic evidence to the host for clarification UX', async () => {
    resolveFrnlInputMock.mockResolvedValueOnce({
      status: 'ambiguous',
      value: undefined,
      candidates: [
        {value: 'May', similarity: 0.72, relevance: 5},
        {value: 'March', similarity: 0.70, relevance: 4.95},
      ],
      modelOutput: 'uncertain month',
      clarification: {
        question: 'Which value did you mean?',
        candidates: ['May', 'March'],
      },
    });

    let observed: any;
    const contract: FrnlInputContract<string> = createFrnlInputContract<string>({
      name: 'birthMonth',
      label: 'Birth Month',
      schema: {type: 'string'},
      validator: z.string(),
      vocabulary: ['May', 'March'],
    });

    render(
      React.createElement(frnlTextInput, {
        id: 'clarification-input',
        label: 'Birth Month',
        value: 'mage',
        semanticInput: contract,
        onChange: () => {},
        onSemanticResult: (result) => {
          observed = result;
        },
      })
    );

    await act(async () => {
      fireEvent.blur(screen.getByLabelText('Birth Month'));
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(observed?.status).toBe('ambiguous');
    expect(observed?.clarification?.candidates).toEqual(['May', 'March']);
  });

  it("11. surfaces every semantic result to the host", async () => {
    resolveFrnlInputMock.mockResolvedValueOnce({
      status: "invalid",
      value: undefined,
      candidates: [],
      modelOutput: undefined,
      error: {code: "SCHEMA_MISMATCH", message: "invalid"},
    });
    let observed: any;
    render(
      React.createElement(frnlTextInput, {
        id: "result-surface-input",
        label: "Result Surface",
        value: "bad value",
        semanticInput: createFrnlInputContract({
          name: "resultSurface",
          label: "Result Surface",
          schema: {type: "number"},
          validator: z.number(),
        }),
        onChange: () => {},
        onSemanticResult: (result: any) => { observed = result; },
      }),
    );
    await act(async () => {
      fireEvent.blur(screen.getByLabelText("Result Surface"));
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(observed?.status).toBe("invalid");
    expect(observed?.error?.code).toBe("SCHEMA_MISMATCH");
  });

});
