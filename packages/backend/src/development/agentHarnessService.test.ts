import { describe, expect, it } from 'vitest';
import { AgentHarnessRuntime } from './agentHarnessService.js';

describe('AgentHarnessService', () => {
  it('advertises provider-specific harnesses without coupling the contract to one provider', () => {
    const providers = new AgentHarnessRuntime().providers();
    expect(providers.map(provider => provider.id)).toEqual(['deepseek', 'openai', 'google']);
    expect(providers.find(provider => provider.id === 'deepseek')?.implemented).toBe(true);
    expect(providers.find(provider => provider.id === 'openai')?.implemented).toBe(false);
    expect(providers.find(provider => provider.id === 'google')?.implemented).toBe(false);
  });

  it('exposes the DeepSeek Harness package and supported execution modes', () => {
    const provider = new AgentHarnessRuntime()
      .providers()
      .find(item => item.id === 'deepseek');

    expect(provider?.package).toBe('@deepseek-ai/dsh');
    expect(provider?.capabilities).toContain('headless');
    expect(provider?.capabilities).toContain('sdk');
  });

  it('normalizes a DeepSeek headless run through the Krnl service runtime contract', async () => {
    const calls: unknown[] = [];
    const fakeRuntime = {
      runCommand: async (...args: unknown[]) => {
        calls.push(args);
        return { exitCode: 0, output: 'completed' };
      },
    };
    const runtime = new AgentHarnessRuntime(fakeRuntime as never);
    const result = await runtime.run({
      provider: 'deepseek',
      prompt: 'run the smoke test',
      cwd: '/workspace',
    });

    expect(result.ok).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.output).toBe('completed');
    expect(result.provider).toBe('deepseek');
    expect(calls).toEqual([
      ['pnpm', ['exec', 'dsh', '--profile', 'headless', 'run the smoke test'], '/workspace', undefined],
    ]);
  });

  it('rejects registered providers before their concrete adapters are installed', async () => {
    const runtime = new AgentHarnessRuntime({
      runCommand: async () => ({ exitCode: 0, output: '' }),
    } as never);

    await expect(runtime.run({ provider: 'openai', prompt: 'test' }))
      .rejects.toThrow('registered but not yet executable');
  });
});
