/**
 * Simple promise semaphore to cap concurrent Puppeteer pages.
 */

export function createSemaphore(max) {
  let active = 0;
  const queue = [];

  function release() {
    active -= 1;
    const next = queue.shift();
    if (next) next();
  }

  /**
   * @template T
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   */
  async function run(fn) {
    if (active >= max) {
      await new Promise((resolve) => queue.push(resolve));
    }
    active += 1;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  return { run };
}
