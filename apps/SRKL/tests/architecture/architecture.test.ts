/**
 * @file architecture.test.ts
 * @description Architecture invariant checks for SRKL.
 *
 * This file intentionally uses Node assertions rather than a test-runner import
 * so production typechecking does not require a browser test framework.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SrklBackend } from '../../src/backend/SrklBackend';
import { runtime as b2Runtime, deployment as b2Deployment } from '../../src/backend/services/backblaze/backblaze';
import { runtime as geminiRuntime, deployment as geminiDeployment } from '../../src/backend/services/gemini/gemini';
import { runtime as oracleRuntime, deployment as oracleDeployment } from '../../src/backend/services/oracle/oracle';

assert.ok(SrklBackend, 'SrklBackend must be defined');
assert.ok(SrklBackend.services, 'SrklBackend.services must be defined');
assert.ok(SrklBackend.orchestrations, 'SrklBackend.orchestrations must be defined');
assert.ok(SrklBackend.services.backblaze, 'Backblaze service must be exported');
assert.ok(SrklBackend.services.gemini, 'Gemini service must be exported');
assert.ok(SrklBackend.services.oracle, 'Oracle service must be exported');

if (b2Deployment === 'remote') assert.equal(b2Runtime, 'server');
if (geminiDeployment === 'remote') assert.equal(geminiRuntime, 'server');

assert.equal(oracleRuntime, 'server');
assert.equal(oracleDeployment, 'local');

console.log('APP_ARCHITECTURE_SPEC verification: PASS');


const authClientSource = fs.readFileSync(path.resolve('src/frontend/auth/luthAuthClient.ts'), 'utf8');
assert.match(authClientSource, /@ultrst-armada\/kloks\/auth/);
assert.doesNotMatch(authClientSource, /VITE_LUTH_URL/);

const welcomeSource = fs.readFileSync(path.resolve('src/frontend/components/common/WelcomePage.tsx'), 'utf8');
assert.match(welcomeSource, /@ultrst-armada\/floks\/ui/);
assert.match(welcomeSource, /<AuthPage/);

const appFactorySource = fs.readFileSync(path.resolve('src/server/AppFactory.ts'), 'utf8');
assert.match(appFactorySource, /verifyLuthSession/);
assert.doesNotMatch(appFactorySource, /toNodeHandler\(await getBetterAuth\(\)\)/);

const legacyAuthRoute = fs.readFileSync(path.resolve('src/server/routes/auth.ts'), 'utf8');
assert.match(legacyAuthRoute, /DEFAULT_LUTH_URL/);
assert.doesNotMatch(legacyAuthRoute, /verifyPassword|hashPassword|createSession|rotateRefreshToken|password_hash/);

const authHelpersSource = fs.readFileSync(path.resolve('src/server/authHelpers.ts'), 'utf8');
assert.doesNotMatch(authHelpersSource, /bcrypt|verifyPassword|hashPassword|password_hash|findEcosystemUserByEmail/);

const authServiceSource = fs.readFileSync(path.resolve('src/backend/services/auth/auth.ts'), 'utf8');
assert.match(authServiceSource, /createLuthAuthClient/);
assert.doesNotMatch(authServiceSource, /localStorage|sessionStorage|srkl_current_user/);

const welcomeAuthSource = fs.readFileSync(path.resolve('src/frontend/components/common/WelcomePage.tsx'), 'utf8');
assert.match(welcomeAuthSource, /luthAuthClient\.signInWithEmail/);
assert.match(welcomeAuthSource, /luthAuthClient\.signUpWithEmail/);
assert.match(welcomeAuthSource, /luthAuthClient\.signInWithGoogle/);
assert.doesNotMatch(welcomeAuthSource, /WelcomeAuthCard/);

const packageManifest = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
assert.equal(packageManifest.dependencies?.bcryptjs, undefined);
assert.equal(packageManifest.devDependencies?.['@types/bcryptjs'], undefined);

const appFactoryAuthSource = fs.readFileSync(path.resolve('src/server/AppFactory.ts'), 'utf8');
assert.match(appFactoryAuthSource, /verifyLuthSession/);
assert.match(appFactoryAuthSource, /INSERT INTO "srkl_application_profiles"/);
assert.doesNotMatch(appFactoryAuthSource, /password_hash|verifyPassword|hashPassword/);

const profileRouteAuthSource = fs.readFileSync(path.resolve('src/server/routes/userProfile.ts'), 'utf8');
const profileHelperAuthSource = fs.readFileSync(path.resolve('src/server/authHelpers.ts'), 'utf8');
assert.match(appFactoryAuthSource, /verified Luth bearer session is required/);
assert.doesNotMatch(appFactoryAuthSource, /if \(!authorization\) return next\(\)/);
assert.match(profileRouteAuthSource, /srkl_application_profiles/);
assert.match(profileHelperAuthSource, /srkl_application_profiles/);


const adminRouteSource = fs.readFileSync(path.resolve('src/server/routes/admin.ts'), 'utf8');
assert.match(appFactorySource, /setVerifiedPrincipal/);
assert.match(adminRouteSource, /getVerifiedPrincipal/);
assert.doesNotMatch(adminRouteSource, /req\.query\.role|req\.headers\['role'\]/);

const ecosystemAuthSource = fs.readFileSync(path.resolve('src/server/routes/ecosystemAuthHelper.ts'), 'utf8');
assert.match(ecosystemAuthSource, /getVerifiedPrincipal/);
assert.doesNotMatch(ecosystemAuthSource, /validateAccessToken|usr-admin|x-session-token|srkl_access_token/);
assert.doesNotMatch(ecosystemAuthSource, /const effectiveUserId = principal \? principal\.userId : callerUserId/);

const workspaceRouteSource = fs.readFileSync(path.resolve('src/server/routes/workspaces.ts'), 'utf8');
assert.doesNotMatch(workspaceRouteSource, /req\.body\?\.userId/);
const ecosystemRouteSource = fs.readFileSync(path.resolve('src/server/routes/ecosystem.ts'), 'utf8');
assert.match(ecosystemRouteSource, /const userId = principal\.userId/);


const databaseSource = fs.readFileSync(path.resolve('src/server/db.ts'), 'utf8');
assert.match(databaseSource, /tryResolveSystemDatabaseUrl\s*\(/);
assert.doesNotMatch(databaseSource, /process\.env\.SYSTEM_DATABASE_URL_1/);
assert.doesNotMatch(databaseSource, /password_hash\s+TEXT\s+NOT NULL/i);
assert.doesNotMatch(databaseSource, /SELECT[^;]*password_hash/i);

const systemCredentialsSource = fs.readFileSync(path.resolve('src/server/system-credentials.ts'), 'utf8');
assert.doesNotMatch(systemCredentialsSource, /SELECT[^;]*(admin_password|admin_email)/i);

const googleDriveSource = fs.readFileSync(path.resolve('src/server/routes/googleDrive.ts'), 'utf8');
assert.doesNotMatch(googleDriveSource, /SYSTEM_DATABASE_URL_1|req\.query\.userId/);
assert.match(googleDriveSource, /getVerifiedPrincipal/);
assert.doesNotMatch(googleDriveSource, /req\.headers\['x-user-id'\]/);

assert.equal(fs.existsSync(path.resolve('src/server/governance/sessionManager.ts')), false);


const userSyncSource = fs.readFileSync(path.resolve('src/frontend/context/userSyncHelper.ts'), 'utf8');
assert.match(userSyncSource, /luthFetch\(/);
assert.doesNotMatch(userSyncSource, /x-user-id|userId\s*[,}]/);
const hubContextSource = fs.readFileSync(path.resolve('src/frontend/context/HubContext.tsx'), 'utf8');
assert.doesNotMatch(hubContextSource, /srkl_current_user_v1|localStorage\.setItem\([^\n]*user/i);


const sessionBridgeSource = fs.readFileSync(path.resolve('src/server/AppFactory.ts'), 'utf8');
assert.match(sessionBridgeSource, /isSignedGoogleDriveCallback/);
assert.match(sessionBridgeSource, /setVerifiedPrincipal/);
assert.doesNotMatch(sessionBridgeSource, /req\.body\.userId|req\.query\.userId/);
const userProfileRouteSource = fs.readFileSync(path.resolve('src/server/routes/userProfile.ts'), 'utf8');
assert.match(userProfileRouteSource, /role: user\.role === 'admin' \? 'admin' : 'user'/);
const googleDriveRouteSource = fs.readFileSync(path.resolve('src/server/routes/googleDrive.ts'), 'utf8');
assert.match(googleDriveRouteSource, /req\.query\.response === 'json'/);
assert.match(googleDriveRouteSource, /StorageServiceFacade\.execute\('verifyGoogleDriveAuthorizationState'/);
assert.match(googleDriveRouteSource, /\bnonceCookie\b/);
assert.match(googleDriveRouteSource, /srkl_google_oauth_nonce/);

assert.ok(
  sessionBridgeSource.indexOf('Access-Control-Allow-Origin') < sessionBridgeSource.indexOf('Canonical Luth session bridge'),
  'CORS must decorate Luth 401/503 responses before session middleware can terminate requests.',
);


const legacyAuthCoreSource = fs.readFileSync(path.resolve('src/backend/services/core/authCore.ts'), 'utf8');
assert.match(legacyAuthCoreSource, /createLuthAuthClient/);
assert.doesNotMatch(legacyAuthCoreSource, /bcrypt|hashPassword|verifyPassword|password_hash|sess::|crypto\.createHash/);
const authProxySource = fs.readFileSync(path.resolve('src/server/routes/auth.ts'), 'utf8');
assert.match(authProxySource, /DEFAULT_LUTH_URL/);
assert.doesNotMatch(authProxySource, /bcrypt|verifyPassword|hashPassword|createSession|sess::/);
const welcomePageSource = fs.readFileSync(path.resolve('src/frontend/components/common/WelcomePage.tsx'), 'utf8');
assert.match(welcomePageSource, /AuthPage/);
assert.equal(fs.existsSync(path.resolve('src/frontend/components/common/WelcomeAuthCard.tsx')), false);
const srklPackage = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
assert.equal(srklPackage.dependencies?.bcryptjs, undefined);
assert.equal(srklPackage.devDependencies?.['@types/bcryptjs'], undefined);

const ecosystemRoutesSource = fs.readFileSync(path.resolve('src/server/routes/ecosystem.ts'), 'utf8');
assert.match(ecosystemRoutesSource, /A verified Luth session is required/);
assert.doesNotMatch(ecosystemRoutesSource, /principal\s*\?\s*principal\.userId\s*:\s*caller/);
assert.doesNotMatch(ecosystemRoutesSource, /getVerifiedPrincipal\(req\)\?\.id\s*\|\|\s*req\.query\.userId/);
