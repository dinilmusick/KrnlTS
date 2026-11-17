import fs from 'node:fs';

const workflow = fs.readFileSync(new URL('../.github/workflows/npm-release.yml', import.meta.url), 'utf8');
const failures = [];
if (!/^  id-token: write$/m.test(workflow)) failures.push('GitHub Actions id-token: write permission is required.');
if (!/registry-url: https:\/\/registry\.npmjs\.org\//.test(workflow)) failures.push('setup-node must configure the npm registry.');
if (!/npm install --global npm@latest/.test(workflow)) failures.push('The release job must use a current npm CLI with Trusted Publishing support.');
if (!/npm publish --provenance --access public/.test(workflow)) failures.push('Publishing must use npm provenance.');
if (/NPM_TOKEN|NODE_AUTH_TOKEN|_authToken/.test(workflow)) failures.push('Long-lived npm token authentication is forbidden in the release workflow.');
if (failures.length) throw new Error(failures.join('\n'));
console.log('NPM TRUSTED PUBLISHING VERIFIED: OIDC only; no long-lived token fallback.');
