import { krnlSystemEntityBase } from './index.js';

async function runSmokeTest() {
  console.log('--- KrnlJS Smoke Test ---');
  
  try {
    const system = new krnlSystemEntityBase('SmokeTestEntity', null, 12345, '127.0.0.1');
    
    console.log('Entity Name:', system.entityName);
    console.log('Discovery Available:', system.isDiscoveryAvailable());
    
    const manifest = system.getManifest();
    console.log('Manifest inputs:', manifest.inputs.api);
    
    if (system.entityName !== 'SmokeTestEntity') {
      throw new Error('Entity name mismatch');
    }
    
    console.log('Smoke test passed: Import and basic instantiation work.');
    
    system.dispose();
    process.exit(0);
  } catch (err) {
    console.error('Smoke test failed:', err);
    process.exit(1);
  }
}

runSmokeTest();
