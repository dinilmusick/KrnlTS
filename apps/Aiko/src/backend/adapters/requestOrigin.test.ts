import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRequestOrigin } from './requestOrigin.js';
test('uses forwarded origin from loopback proxy', () => assert.equal(resolveRequestOrigin({remoteAddress:'127.0.0.1',forwardedHost:'aiko.example.com',forwardedProto:'https'},'http://localhost:3000'),'https://aiko.example.com'));
test('ignores forwarded headers from untrusted peers', () => assert.equal(resolveRequestOrigin({remoteAddress:'203.0.113.8',forwardedHost:'attacker.example',forwardedProto:'http'},'https://aiko.example.com'),'https://aiko.example.com'));
test('rejects malformed forwarded headers', () => assert.equal(resolveRequestOrigin({remoteAddress:'::1',forwardedHost:'good.example,attacker.example',forwardedProto:'https'},'https://aiko.example.com'),'https://aiko.example.com'));
test('falls back safely', () => assert.equal(resolveRequestOrigin({remoteAddress:'203.0.113.8'},'not a URL'),'http://localhost:3000'));
