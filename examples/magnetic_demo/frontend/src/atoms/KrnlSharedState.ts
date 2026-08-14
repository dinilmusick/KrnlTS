import van from 'vanjs-core';

export interface SharedSlot {
  options: van.State<any[]>;
  value: van.State<any>;
}

const slotRegistry = new Map<string, SharedSlot>();

export function getSharedSlot(id?: string): SharedSlot {
  if (!id) {
    return {
      options: van.state([]),
      value: van.state(null)
    };
  }
  if (!slotRegistry.has(id)) {
    slotRegistry.set(id, {
      options: van.state([]),
      value: van.state(null)
    });
  }
  return slotRegistry.get(id)!;
}
