import van from 'vanjs-core';
import { KrnlButton, KrnlTextInput, KrnlDropdown, KrnlTextArea, KrnlJsonViewer, KrnlTile, getSharedSlot, KrnlAgentBridge } from '../../atoms/index.js';

const { div, h3, h4, form } = van.tags;

export default function Endpoint_createUser() {
  const formData = van.state<Record<string, any>>({});
  const response = van.state<any>(null);
  const loading = van.state(false);
  const error = van.state<string | null>(null);
  const phantomActive = van.state(false);

  const slot_nameSelector = getSharedSlot('nameSelector');

  KrnlAgentBridge.register('createUser', {
    trigger: async (overrideInput?: Record<string, any>, ticketId?: string) => {
      return await executeRequest(overrideInput, ticketId);
    }
  });

  const handleInputChange = (field: string, val: any) => {
    formData.val = { ...formData.val, [field]: val };
    KrnlAgentBridge.setState('createUser', {
      fid: 'createUser',
      formData: formData.val,
      response: response.val,
      loading: false,
      error: null,
      lastUpdated: Date.now()
    });
  };

  const executeRequest = async (overrideData?: Record<string, any>, ticketId?: string) => {
    loading.val = true;
    error.val = null;
    if (ticketId || overrideData) {
      phantomActive.val = true;
    }
    const activeInput = overrideData || formData.val;
    if (overrideData) formData.val = { ...formData.val, ...overrideData };

    try {
      const res = await fetch('/frontend/api/createUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeInput),
      });
      const data = await res.json();
      const payload = data.payload !== undefined ? data.payload : data;
      response.val = payload;

      if (payload && (payload.status === 'error' || payload.message)) {
        if (payload.status === 'error') error.val = payload.message || 'Request failed';
      }

      

      if (ticketId) KrnlAgentBridge.sendJobComplete(ticketId, 'createUser', payload, undefined);
      return payload;
    } catch (err: any) {
      const errMsg = err.message || 'Request failed';
      error.val = errMsg;
      if (ticketId) KrnlAgentBridge.sendJobComplete(ticketId, 'createUser', null, errMsg);
    } finally {
      loading.val = false;
      if (ticketId || overrideData) {
        setTimeout(() => { phantomActive.val = false; }, 2000);
      }
    }
  };

  
  

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    await executeRequest();
  };

  return div(
    {
      className: () => `krnl-endpoint-card ${phantomActive.val ? 'krnl-phantom-active' : ''}`,
      style: () => `
        background: var(--krnl-bg-surface);
        padding: 1.5rem;
        border-radius: 12px;
        border: ${phantomActive.val ? '2px solid var(--krnl-accent)' : '1px solid var(--krnl-border-color)'};
        transition: all 0.3s ease;
        position: relative;
      `
    },
    () => (phantomActive.val ? div({ className: 'krnl-phantom-badge' }, '🤖 Phantom Execution Active') : null),
    h3({ style: 'margin-bottom: 1rem; color: var(--krnl-primary);' }, 'Endpoint: createUser'),
    form(
      { onsubmit: handleSubmit },
      KrnlDropdown({
        label: "Select Username",
        value: van.derive(() => formData.val['username'] !== undefined ? formData.val['username'] : (slot_nameSelector.value.val || '')),
        options: slot_nameSelector.options,
        onChange: (v) => {
          slot_nameSelector.value.val = v;
          handleInputChange('username', v);
        }
      }),
      KrnlTextInput({ label: "Email Address", value: van.derive(() => formData.val['email'] || ''), onChange: (v) => handleInputChange('email', v), placeholder: "" }),
      KrnlTextInput({ label: "Age", value: van.derive(() => formData.val['age'] || ''), onChange: (v) => handleInputChange('age', v) }),
      KrnlTextInput({ label: "Is Administrator?", value: van.derive(() => formData.val['isAdmin'] || ''), onChange: (v) => handleInputChange('isAdmin', v) }),
      KrnlButton({ type: 'submit', loading, disabled: loading, label: 'Execute createUser', icon: '⚡' })
    ),
    () => (error.val ? div({ style: 'color: var(--krnl-danger); margin-top: 1rem;' }, 'Error: ', error.val) : null),
    () =>
      response.val !== null
        ? div(
            { style: 'margin-top: 1.5rem; border-top: 1px solid var(--krnl-border-color); padding-top: 1rem;' },
            h4({ style: 'margin-bottom: 0.5rem; color: var(--krnl-accent);' }, 'Output Response'),
            KrnlTile({ label: "User ID", value: van.derive(() => response.val ? (response.val['id'] !== undefined ? response.val['id'] : response.val) : '') }),
            KrnlTile({ label: "Username", value: van.derive(() => response.val ? (response.val['username'] !== undefined ? response.val['username'] : response.val) : '') })
          )
        : null
  );
}
