import puppeteer, { Browser } from 'puppeteer';

let browserInstance: Browser | null = null;
let launchPromise: Promise<Browser> | null = null;

/**
 * Returns a shared Puppeteer browser instance.
 * Launches once and reuses across requests, massively reducing cold-start latency.
 */
export async function getBrowser(): Promise<Browser> {
  // If we already have a healthy browser, return it
  if (browserInstance) {
    try {
      // Quick health check — if the browser is disconnected this will throw
      await browserInstance.version();
      return browserInstance;
    } catch {
      // Browser died, clear it and relaunch
      browserInstance = null;
      launchPromise = null;
    }
  }

  // Deduplicate concurrent launch calls
  if (!launchPromise) {
    launchPromise = puppeteer
      .launch({ headless: true })
      .then(browser => {
        browserInstance = browser;
        browser.on('disconnected', () => {
          browserInstance = null;
          launchPromise = null;
        });
        return browser;
      })
      .catch(err => {
        launchPromise = null;
        throw err;
      });
  }

  return launchPromise;
}
