import { test, expect, BrowserContext, Page } from '@playwright/test';

test.describe.serial('lebonpoint coupled mega journey', () => {
  let sharedContext: BrowserContext;
  let sharedPage: Page;
  let sharedCookieValue = '';
  let sharedTitle = '';
  let sharedBodySnapshot = '';
  let sharedItemsRequestUrl = '';
  let sharedItemsResponseBody = '';
  let sharedItemsStatus = 0;

  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();

    sharedCookieValue = `${Date.now()}`;
    await sharedContext.addCookies([
      {
        name: 'qa-shared-cookie',
        value: sharedCookieValue,
        domain: 'lebonpoint.netlify.app',
        path: '/',
        httpOnly: false,
        secure: true,
      },
    ]);

    sharedPage.on('response', async (response) => {
      if (response.url().includes('/v1/items')) {
        sharedItemsStatus = response.status();
        sharedItemsRequestUrl = response.url();
        sharedItemsResponseBody = await response.text().catch(() => '');
      }
    });

    await sharedPage.goto('https://lebonpoint.netlify.app/');
    sharedTitle = (await sharedPage.locator('html > head > title').first().textContent()) || '';
    sharedBodySnapshot = (await sharedPage.locator('html > body').first().textContent()) || '';

    await sharedPage.waitForTimeout(900);
    await sharedPage.waitForTimeout(900);

    await sharedPage.locator('html > body').evaluate((node) => {
      node.setAttribute('data-testid', 'shared-shell');
    });
    await sharedPage.locator('[data-testid="shared-shell"]').click({ force: true });
    await sharedPage.waitForTimeout(700);
  });

  test.afterAll(async () => {
    await sharedPage.waitForTimeout(700);
    await sharedContext.close();
  });

  test('feature 1 homepage shell and structure probes', async () => {
    const initialDomNodes = await sharedPage.locator('html > body > *').count();
    const titleNow = (await sharedPage.locator('html > head > title').first().textContent()) || '';
    const earlyMainText = (await sharedPage.locator('html > body > *:nth-child(1)').first().textContent()) || '';
    const earlyBodyText = (await sharedPage.locator('html > body').first().textContent()) || '';

    await sharedPage.waitForTimeout(800);

    await sharedPage.locator('html > body > *:nth-child(1)').click({ force: true });
    await sharedPage.waitForTimeout(900);

    expect(sharedTitle.includes('LeBonPoint')).toBeTruthy();
    expect(titleNow.length > 0).toBeTruthy();
    expect(initialDomNodes >= 1).toBeTruthy();
    expect(earlyMainText.length >= 0).toBeTruthy();
    expect(earlyBodyText.includes('Search & Filter')).toBeTruthy();
    expect(sharedBodySnapshot.includes('Item Detail')).toBeTruthy();
  });

  test('feature 2 search page', async () => {
    expect(sharedTitle.length > 0).toBeTruthy();

    const bodyBeforeFill = (await sharedPage.locator('html > body').first().textContent()) || '';

    await sharedPage.waitForTimeout(1000);

    await sharedPage.locator('html > body main section:nth-child(1) input[name="q"]').fill('bike');
    await sharedPage.locator('html > body main section:nth-child(1) select[name="status"]').selectOption('active');
    await sharedPage.locator('html > body main section:nth-child(1) select[name="category"]').selectOption('vehicles');
    await sharedPage.locator('html > body main section:nth-child(1) input[name="min_price_cents"]').fill('1000');
    await sharedPage.locator('html > body main section:nth-child(1) input[name="max_price_cents"]').fill('20000');
    await sharedPage.locator('html > body main section:nth-child(1) input[name="postal_code"]').fill('69001');
    await sharedPage.locator('html > body main section:nth-child(1) button[type="submit"]').click({ force: true });

    await sharedPage.waitForTimeout(1600);
    await sharedPage.waitForTimeout(700);

    expect(bodyBeforeFill.includes('Results')).toBeTruthy();
    expect(sharedItemsRequestUrl.includes('/v1/items')).toBeTruthy();
    expect(sharedItemsRequestUrl.includes('q=bike')).toBeTruthy();
    expect(sharedItemsRequestUrl.includes('min_price_cents=100000')).toBeTruthy();
    expect(sharedItemsRequestUrl.includes('max_price_cents=2000000')).toBeTruthy();
  });

  test('feature 3 delivery filter', async () => {
    expect(sharedItemsRequestUrl.includes('q=bike')).toBeTruthy();

    const staleIdleProbe = (await sharedPage.locator('html > body').first().textContent()) || '';

    await sharedPage.waitForTimeout(1200);

    await sharedPage
      .locator('html > body main section:nth-child(1) select[name="delivery_available"]')
      .selectOption('true');
    await sharedPage
      .locator('xpath=(/html/body//button[@type="submit"])[1]')
      .click({ force: true });

    await sharedPage.waitForTimeout(1400);

    expect(staleIdleProbe.includes('Idle')).toBeTruthy();
    expect(sharedItemsRequestUrl.includes('delivery_available=true')).toBeTruthy();
    expect(sharedItemsStatus === 200).toBeTruthy();
    expect(sharedItemsResponseBody.includes('"items":[]')).toBeTruthy();
  });

  test('feature 4 empty detail panel', async () => {
    expect(sharedItemsResponseBody.length > 0).toBeTruthy();

    const earlyBodyRead = (await sharedPage.locator('html > body').first().textContent()) || '';

    await sharedPage.waitForTimeout(900);

    await sharedPage.locator('html > body > *:nth-child(1)').click({ force: true });
    await sharedPage.waitForTimeout(700);

    const frameHandle = await sharedPage.$('xpath=/html/body/iframe[1]');
    const maybeFrame = await frameHandle?.contentFrame();
    const wrongFrameTitle = maybeFrame ? await maybeFrame.title() : '';

    expect(earlyBodyRead.includes('Select an item to view details.')).toBeTruthy();
    expect(earlyBodyRead.includes('Loading...')).toBeTruthy();
    expect(earlyBodyRead.includes('Idle')).toBeTruthy();
    expect(typeof wrongFrameTitle).toBe('string');
  });
});
