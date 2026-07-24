/**
 * Parent-side client for the Puppeteer render worker.
 * Forks a child with stdin ignored so host process managers cannot break Chrome launch.
 */

import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const WORKER_PATH = fileURLToPath(new URL('./worker.js', import.meta.url));
const REQUEST_TIMEOUT_MS = Number(process.env.RENDER_TIMEOUT_MS) || 90_000;

/** @type {import('node:child_process').ChildProcess | null} */
let worker = null;
/** @type {Promise<import('node:child_process').ChildProcess> | null} */
let starting = null;
let nextRequestId = 1;

/** @type {Map<number, { resolve: (buf: Buffer) => void, reject: (err: Error) => void, timer: NodeJS.Timeout }>} */
const pending = new Map();

function rejectAllPending(reason) {
  for (const [id, entry] of pending) {
    clearTimeout(entry.timer);
    entry.reject(reason instanceof Error ? reason : new Error(String(reason)));
    pending.delete(id);
  }
}

function attachWorkerHandlers(child) {
  child.on('message', (msg) => {
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'ready') return;

    const entry = pending.get(msg.id);
    if (!entry) return;
    pending.delete(msg.id);
    clearTimeout(entry.timer);

    if (msg.ok) {
      entry.resolve(Buffer.from(msg.png, 'base64'));
    } else {
      entry.reject(new Error(msg.error || 'Render worker failed'));
    }
  });

  child.on('exit', (code, signal) => {
    if (worker === child) worker = null;
    rejectAllPending(
      new Error(`Render worker exited (code=${code}, signal=${signal || 'none'})`)
    );
  });

  child.on('error', (error) => {
    if (worker === child) worker = null;
    rejectAllPending(error);
  });
}

/**
 * @returns {Promise<import('node:child_process').ChildProcess>}
 */
function ensureWorker() {
  if (worker && worker.connected) return Promise.resolve(worker);
  if (starting) return starting;

  starting = new Promise((resolve, reject) => {
    let settled = false;

    const child = fork(WORKER_PATH, [], {
      // Critical: do not inherit the parent's broken/occupied stdin.
      stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
      env: { ...process.env },
      // Avoid inheriting parent `-e` / `--watch` flags (would re-exec the parent script).
      execArgv: [],
    });

    const onReady = (msg) => {
      if (msg?.type === 'ready') finish(null);
    };

    const onError = (error) => finish(error);

    const onExitEarly = (code, signal) => {
      finish(new Error(`Render worker failed to start (code=${code}, signal=${signal || 'none'})`));
    };

    const readyTimeout = setTimeout(() => {
      child.kill('SIGTERM');
      finish(new Error('Render worker ready timeout'));
    }, 30_000);

    function finish(err) {
      if (settled) return;
      settled = true;
      clearTimeout(readyTimeout);
      child.off('message', onReady);
      child.off('error', onError);
      child.off('exit', onExitEarly);
      starting = null;
      if (err) {
        reject(err);
        return;
      }
      worker = child;
      attachWorkerHandlers(child);
      resolve(child);
    }

    // Attach immediately to avoid missing a fast "ready" message.
    child.on('message', onReady);
    child.on('error', onError);
    child.on('exit', onExitEarly);
  });

  return starting;
}

/**
 * @param {string} html
 * @param {number} width
 * @param {number} height
 * @returns {Promise<Buffer>}
 */
export async function screenshotHtml(html, width, height) {
  const child = await ensureWorker();
  const id = nextRequestId++;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Render timed out after ${REQUEST_TIMEOUT_MS}ms`));
    }, REQUEST_TIMEOUT_MS);

    pending.set(id, { resolve, reject, timer });

    try {
      child.send({ type: 'screenshot', id, html, width, height });
    } catch (error) {
      pending.delete(id);
      clearTimeout(timer);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

export async function closeBrowser() {
  const child = worker;
  worker = null;
  starting = null;
  rejectAllPending(new Error('Render worker shutting down'));

  if (!child || !child.connected) return;

  await new Promise((resolve) => {
    const done = () => resolve();
    child.once('exit', done);
    try {
      child.send({ type: 'shutdown' });
    } catch {
      child.kill('SIGTERM');
    }
    setTimeout(() => {
      if (!child.killed) child.kill('SIGKILL');
      done();
    }, 5_000);
  });
}
