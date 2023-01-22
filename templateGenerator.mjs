#!/usr/bin/env node --experimental-modules --no-warnings
import path from "node:path";
import minimist from "minimist";
import { Plop, run } from "plop";

const args = process.argv.slice(2);
const argv = minimist(args);

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

Plop.prepare({
  cwd: process.cwd(),
  configPath: path.join(__dirname, 'plopfile.js'),
  preload: argv.preload || [],
  completion: argv.completion,
  dest: process.cwd()
}, env => Plop.execute(env, (env) => {
  const options = {
      ...env,
      dest: process.cwd() // this will make the destination path to be based on the cwd when calling the wrapper
  }
  return run(options, undefined, true)
}));