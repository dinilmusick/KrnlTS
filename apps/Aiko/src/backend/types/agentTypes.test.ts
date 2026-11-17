import test from 'node:test';
import assert from 'node:assert';
import {createDefaultAgentDefinition} from './agentTypes.js';

test('Aiko agent definition supports a tool and resolved intelligence specification',()=>{
  const agent=createDefaultAgentDefinition('Example','ENDPOINT');
  agent.tool={name:'ExampleTool'};
  agent.intelligenceSpec={reasoning:9,toolUsage:9.5};
  assert.ok(agent.tool);
  assert.strictEqual(agent.intelligenceSpec?.reasoning, 9);
});
