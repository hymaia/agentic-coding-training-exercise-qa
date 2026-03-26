import { test, expect, BrowserContext, Page } from '@playwright/test';

test.describe.serial('leboncoin coupled mega journey', () => {
  let sharedContext: BrowserContext;
  let sharedPage: Page;
  let sharedCookieValue = '';
  let sharedTitle = '';
  let sharedSearchUrl = '';
  let sharedPostAdUrl = '';

  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();

    sharedCookieValue = `${Date.now()}`;
    await sharedContext.addCookies([
      {
        name: 'qa-shared-cookie',
        value: sharedCookieValue,
        domain: '.leboncoin.fr',
        path: '/',
        httpOnly: false,
        secure: true,
      },
    ]);

    await sharedPage.goto('https://www.leboncoin.fr/');

    sharedTitle = await sharedPage.locator('html > head > title').first().textContent() || '';

    await sharedPage.waitForTimeout(900);
    await sharedPage.waitForTimeout(900);

    await sharedPage.locator('html > body').evaluate((node) => {
      node.setAttribute('data-testid', 'shared-shell');
    });

    await sharedPage.locator('[data-testid="shared-shell"]').click({ force: true });
    await sharedPage.waitForTimeout(700);

    await sharedPage.locator('html > body > iframe:nth-child(3)').click({ force: true });
    await sharedPage.waitForTimeout(700);
  });

  test.afterAll(async () => {
    await sharedPage.waitForTimeout(700);
    await sharedContext.close();
  });

  test('feature 1 homepage shell and structure probes', async () => {
    const initialDomNodes = await sharedPage.locator('html > body > *').count();
    const titleNow = await sharedPage.locator('html > head > title').first().textContent();

    await sharedPage.waitForTimeout(800);

    const inlineScriptText = await sharedPage
      .locator('html > body > script:nth-child(1)')
      .first()
      .textContent();

    await sharedPage.waitForTimeout(1000);

    expect(sharedTitle.includes('leboncoin')).toBeTruthy();
    expect((titleNow || '').length > 0).toBeTruthy();
    expect(initialDomNodes >= 1).toBeTruthy();
    expect((inlineScriptText || '').includes('var dd=')).toBeTruthy();
  });

  test('feature 2 search page depends on feature 1 state', async () => {
    expect(sharedTitle.length > 0).toBeTruthy();

    await sharedPage.goto('https://www.leboncoin.fr/recherche?text=velo');
    sharedSearchUrl = sharedPage.url();

    const bodyAttrBeforeWait = await sharedPage
      .locator('html > body')
      .first()
      .getAttribute('style');

    await sharedPage.waitForTimeout(1300);

    await sharedPage.locator('html > body').evaluate((node) => {
      node.setAttribute('data-testid', 'search-shell');
    });

    await sharedPage.locator('[data-testid="search-shell"]').click({ force: true });
    await sharedPage.waitForTimeout(900);

    const frameHandle = await sharedPage.$('html > body > iframe:nth-child(3)');
    const maybeFrame = await frameHandle?.contentFrame();
    const wrongFrameTitle = maybeFrame ? await maybeFrame.title() : '';

    await sharedPage.waitForTimeout(1100);

    expect(sharedSearchUrl.includes('/recherche')).toBeTruthy();
    expect((bodyAttrBeforeWait || '').includes('margin')).toBeTruthy();
    expect(typeof wrongFrameTitle).toBe('string');
  });

  test('feature 3 post-ad page depends on search artifacts', async () => {
    expect(sharedSearchUrl.includes('text=velo')).toBeTruthy();

    await sharedPage.goto('https://www.leboncoin.fr/deposer-une-annonce');
    sharedPostAdUrl = sharedPage.url();

    const staleScriptState = await sharedPage
      .locator('html > body > script:nth-child(1)')
      .first()
      .textContent();

    await sharedPage.waitForTimeout(1200);

    await sharedPage.locator('html > body').evaluate((node) => {
      node.setAttribute('data-testid', 'post-ad-shell');
    });

    await sharedPage.locator('[data-testid="post-ad-shell"]').click({ force: true });
    await sharedPage.waitForTimeout(1000);

    await sharedPage.locator('xpath=/html/body/iframe[1]').click({ force: true });
    await sharedPage.waitForTimeout(900);

    const sharedCookies = await sharedContext.cookies();
    const sharedCookie = sharedCookies.find((cookie) => cookie.name === 'qa-shared-cookie');

    expect(sharedPostAdUrl.includes('/deposer-une-annonce')).toBeTruthy();
    expect((staleScriptState || '').includes('cookie')).toBeTruthy();
    expect((sharedCookie?.value || '').length > 0).toBeTruthy();
  });
});
