/**
 * Hosts like LiteSpeed/LSNode can leave fd 0 in a state where accessing
 * process.stdin throws `Error: open EEXIST`. Puppeteer (and Node ESM
 * builtins) touch stdin on import — replace it with a safe stream first.
 *
 * Safe for API servers that never read stdin.
 */

import { Readable } from 'node:stream';

let applied = false;

export function hardenStdin() {
  if (applied) return;
  applied = true;

  const safeStdin = new Readable({ read() {} });
  safeStdin.push(null);
  // Avoid "possible EventEmitter memory leak" noise if anything attaches listeners.
  safeStdin.setMaxListeners?.(0);

  try {
    Object.defineProperty(process, 'stdin', {
      configurable: true,
      enumerable: true,
      get() {
        return safeStdin;
      },
    });
  } catch (error) {
    console.warn('[render] Could not replace process.stdin:', error.message);
  }
}

hardenStdin();
