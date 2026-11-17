import {describe,expect,it} from 'vitest';
import {guttsFodNodeDefinitions} from './fod-node-provider.js';
import {executeGuttsApi} from './fod-runtime.js';

describe('GutTS FOD node provider',()=>{
  it('exposes every published API definition as a grouped node',()=>{
    expect(guttsFodNodeDefinitions.length).toBeGreaterThan(20);
    expect(new Set(guttsFodNodeDefinitions.map(node=>node.group))).toEqual(new Set(['arrays','json','numbers','objects','strings','urls','models']));
  });
  it('executes deterministic utility APIs through the same registry IDs',async()=>{
    await expect(executeGuttsApi('gutts.numbers.sum',{values:[1,2,3]})).resolves.toBe(6);
    await expect(executeGuttsApi('gutts.strings.camelCase',{value:'hello world'})).resolves.toBe('helloWorld');
  });
});
