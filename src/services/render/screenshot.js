/**
 * Screenshot entry point used by the API process.
 * Delegates to a child worker so Puppeteer never loads in the API process.
 */

export { screenshotHtml, closeBrowser } from './workerClient.js';
