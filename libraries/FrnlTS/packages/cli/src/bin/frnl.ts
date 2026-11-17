#!/usr/bin/env node
import { runFrnlCli } from '../index.js';

const code = await runFrnlCli();
process.exitCode = code;
