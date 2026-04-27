// @ts-check
/**
 * wagServ visual regression suite.
 * Runs against the deployed site (BASE_URL, default https://wagserv.net)
 * via Applitools Ultrafast Grid.
 */
const { test } = require('@playwright/test');
const {
  Eyes,
  VisualGridRunner,
  BatchInfo,
  Configuration,
  BrowserType,
  Target,
} = require('@applitools/eyes-playwright');

// ---- Shared runner / batch (one per CI run) ----------------------------
const runner = new VisualGridRunner({ testConcurrency: 5 });
const batch = new BatchInfo({
  name: 'wagServ',
  id: process.env.APPLITOOLS_BATCH_ID || undefined,
});

/** Build a fresh Eyes config for each test. */
function buildConfig() {
  const config = new Configuration();
  config.setBatch(batch);
  // Two browsers/viewports — expand here later if your plan allows.
  config.addBrowser(1440, 900, BrowserType.CHROME);
  config.addBrowser(390, 844, BrowserType.CHROME);   // mobile portrait
  if (process.env.APPLITOOLS_BRANCH_NAME) {
    config.setBranchName(process.env.APPLITOOLS_BRANCH_NAME);
  }
  return config;
}

/** Wait for fonts and freeze the only animation on the site. */
async function preparePage(page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
    document.body.setAttribute('data-test-mode', 'static');
  });
  // Make sure VT323 + Share Tech Mono are fully loaded before snapshot.
  await page.waitForFunction(() => document['fonts'] && document['fonts'].ready)
    .then(() => page.evaluate(() => document['fonts'].ready));
}

// ---- Test setup --------------------------------------------------------
test.describe('wagServ', () => {
  /** @type {Eyes} */
  let eyes;

  test.beforeEach(async () => {
    eyes = new Eyes(runner);
    eyes.setConfiguration(buildConfig());
  });

  test.afterEach(async () => {
    // close(false) -> don't throw on diffs; we surface them in afterAll.
    await eyes.close(false);
  });

  test.afterAll(async () => {
    const summary = await runner.getAllTestResults(false);
    console.log(summary.toString());
  });

  // ---- Home -----------------------------------------------------------
  test('home', async ({ page }) => {
    await page.goto('/');
    await preparePage(page);
    await eyes.open(page, 'wagServ', 'home', { width: 1440, height: 900 });
    await eyes.check('home', Target.window().fully());
  });

  // ---- Catalog --------------------------------------------------------
  test('catalog - default', async ({ page }) => {
    await page.goto('/catalog.html');
    await preparePage(page);
    await eyes.open(page, 'wagServ', 'catalog - default', { width: 1440, height: 900 });
    await eyes.check('catalog default', Target.window().fully());
  });

  test('catalog - sorted by price desc', async ({ page }) => {
    await page.goto('/catalog.html');
    await preparePage(page);
    // click Price column twice (first asc, then desc)
    await page.click('th[data-key="price"]');
    await page.click('th[data-key="price"]');
    await eyes.open(page, 'wagServ', 'catalog - sorted by price desc', { width: 1440, height: 900 });
    await eyes.check('catalog price desc', Target.window().fully());
  });

  test('catalog - filtered to phreaking + out of stock', async ({ page }) => {
    await page.goto('/catalog.html');
    await preparePage(page);
    await page.selectOption('#category', 'Phreaking');
    await page.selectOption('#stock', 'out');
    await eyes.open(page, 'wagServ', 'catalog - phreaking out of stock', { width: 1440, height: 900 });
    await eyes.check('catalog filtered', Target.window().fully());
  });

  // ---- Product detail -------------------------------------------------
  test('product - description tab', async ({ page }) => {
    await page.goto('/product.html');
    await preparePage(page);
    await eyes.open(page, 'wagServ', 'product - description', { width: 1440, height: 900 });
    await eyes.check('product description', Target.window().fully());
  });

  test('product - specs tab', async ({ page }) => {
    await page.goto('/product.html');
    await preparePage(page);
    await page.click('[role="tab"][data-tab="specs"]');
    await eyes.open(page, 'wagServ', 'product - specs', { width: 1440, height: 900 });
    await eyes.check('product specs', Target.window().fully());
  });

  test('product - reviews tab + faq expanded', async ({ page }) => {
    await page.goto('/product.html');
    await preparePage(page);
    await page.click('[role="tab"][data-tab="reviews"]');
    // expand all FAQ items
    const heads = await page.$$('.accordion__head');
    for (const h of heads) await h.click();
    await eyes.open(page, 'wagServ', 'product - reviews + faq open', { width: 1440, height: 900 });
    await eyes.check('product reviews faq', Target.window().fully());
  });

  test('product - cart modal open', async ({ page }) => {
    await page.goto('/product.html');
    await preparePage(page);
    // bump quantity to 2 then add to cart
    await page.click('.qty-btn[data-step="1"]');
    await page.click('button[type="submit"]');
    // Wait for modal animation to finish (it's disabled in static mode but be safe)
    await page.waitForSelector('.modal.is-open');
    await eyes.open(page, 'wagServ', 'product - cart modal', { width: 1440, height: 900 });
    await eyes.check('product cart modal', Target.window().fully());
  });

  // ---- Contact form (uses ?demo= modes built into the page) -----------
  test('contact - default', async ({ page }) => {
    await page.goto('/contact.html');
    await preparePage(page);
    await eyes.open(page, 'wagServ', 'contact - default', { width: 1440, height: 900 });
    await eyes.check('contact default', Target.window().fully());
  });

  test('contact - errors', async ({ page }) => {
    await page.goto('/contact.html?demo=errors');
    await preparePage(page);
    await eyes.open(page, 'wagServ', 'contact - errors', { width: 1440, height: 900 });
    await eyes.check('contact errors', Target.window().fully());
  });

  test('contact - filled', async ({ page }) => {
    await page.goto('/contact.html?demo=filled');
    await preparePage(page);
    await eyes.open(page, 'wagServ', 'contact - filled', { width: 1440, height: 900 });
    await eyes.check('contact filled', Target.window().fully());
  });

  test('contact - success', async ({ page }) => {
    await page.goto('/contact.html?demo=success');
    await preparePage(page);
    await eyes.open(page, 'wagServ', 'contact - success', { width: 1440, height: 900 });
    await eyes.check('contact success', Target.window().fully());
  });

  // ---- Account / auth -------------------------------------------------
  test('account - login default', async ({ page }) => {
    await page.goto('/account.html');
    await preparePage(page);
    await eyes.open(page, 'wagServ', 'account - login default', { width: 1440, height: 900 });
    await eyes.check('account login', Target.window().fully());
  });

  test('account - login errors', async ({ page }) => {
    await page.goto('/account.html?demo=login-errors');
    await preparePage(page);
    await eyes.open(page, 'wagServ', 'account - login errors', { width: 1440, height: 900 });
    await eyes.check('account login errors', Target.window().fully());
  });

  test('account - signup default', async ({ page }) => {
    await page.goto('/account.html?tab=signup');
    await preparePage(page);
    await eyes.open(page, 'wagServ', 'account - signup default', { width: 1440, height: 900 });
    await eyes.check('account signup', Target.window().fully());
  });

  test('account - signup with strong password', async ({ page }) => {
    await page.goto('/account.html?demo=signup-strong');
    await preparePage(page);
    await eyes.open(page, 'wagServ', 'account - signup strong', { width: 1440, height: 900 });
    await eyes.check('account signup strong', Target.window().fully());
  });

  test('account - success', async ({ page }) => {
    await page.goto('/account.html?demo=success');
    await preparePage(page);
    await eyes.open(page, 'wagServ', 'account - success', { width: 1440, height: 900 });
    await eyes.check('account success', Target.window().fully());
  });

  // ---- 404 ------------------------------------------------------------
  test('404 page', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist', { waitUntil: 'domcontentloaded' });
    // We expect 404; don't fail if Playwright sees the 404 status.
    if (response && response.status() !== 404 && response.status() !== 200) {
      throw new Error(`unexpected status ${response.status()}`);
    }
    await preparePage(page);
    await eyes.open(page, 'wagServ', '404 page', { width: 1440, height: 900 });
    await eyes.check('404', Target.window().fully());
  });
});
