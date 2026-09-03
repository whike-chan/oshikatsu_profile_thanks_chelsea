import { expect, test } from '@playwright/test';

const STORAGE_KEY = 'mm-profile-maker:v1';

test.beforeEach(async ({ page }) => {
  // Playwright creates a clean browser context for each test, so storage is empty here.
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  // Wait for React to attach event handlers and complete the first local save.
  await page.waitForFunction(
    (key) => window.localStorage.getItem(key) !== null,
    STORAGE_KEY,
  );
});

test('ページと共有用metaが正しく表示される', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: '推し活プロフィールメーカー' }),
  ).toBeVisible();
  await expect(page).toHaveTitle(
    '推し活プロフィールメーカー ～Thanks, Chelsea!～',
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'フォームへ入力するだけで、推し活プロフィール画像をかんたんに作成・保存できる無料ツールです。',
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    '推し活プロフィールメーカー ～Thanks, Chelsea!～',
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://oshikatsu-profile-thanks-chelsea.pekomaro1001.chatgpt.site/og.png',
  );
  await expect(page.getByRole('tab', { name: '左ページ' })).toHaveCSS(
    'cursor',
    'pointer',
  );
  await expect(
    page.getByText('入力内容はこの端末のブラウザ内だけに自動保存され'),
  ).toBeVisible();
});

test('スマホでも現役メンバー全員を候補表示し、自由入力もできる', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('tab', { name: '右ページ' }).click();

  const memberInput = page.getByRole('combobox', {
    name: '癒し系といえば？',
    exact: true,
  });
  await memberInput.click();
  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();
  await expect(listbox.getByRole('option')).toHaveCount(11);

  await memberInput.fill('野中');
  await expect(listbox.getByRole('option')).toHaveCount(1);
  await listbox.getByRole('option', { name: '野中美希' }).click();
  await expect(memberInput).toHaveValue('野中美希');

  await memberInput.fill('好きなニックネーム');
  await expect(memberInput).toHaveValue('好きなニックネーム');
});

test('入力内容を端末内へ保存し、再読み込み後に復元する', async ({ page }) => {
  await page.getByLabel('名前', { exact: true }).fill('テストユーザー');
  await page.getByLabel('誕生月').fill('99');
  await page.getByLabel('誕生日の日').fill('45');
  await page
    .getByLabel('推しになったきっかけ')
    .fill('ライブで一目惚れしました');

  await page.getByRole('tab', { name: '右ページ' }).click();
  await page.getByLabel('推しへひとこと♡').fill('いつもありがとう！');
  const firstActivitySlider = page
    .getByRole('group', { name: '前方派から後方派' })
    .getByRole('slider');
  await firstActivitySlider.press('End');

  await expect
    .poll(async () => {
      return page.evaluate((key) => {
        const saved = window.localStorage.getItem(key);
        return saved ? JSON.parse(saved) : null;
      }, STORAGE_KEY);
    })
    .toMatchObject({
      values: {
        name: 'テストユーザー',
        birthMonth: '12',
        birthDay: '31',
        reason: 'ライブで一目惚れしました',
        message: 'いつもありがとう！',
      },
      activityTypes: [10, 5, 5, 5, 5, 5, 5, 5, 5],
    });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('tab', { name: '左ページ' }).click();
  await expect(page.getByLabel('名前', { exact: true })).toHaveValue(
    'テストユーザー',
  );
  await expect(page.getByLabel('誕生月')).toHaveValue('12');
  await expect(page.getByLabel('誕生日の日')).toHaveValue('31');

  await page.getByRole('tab', { name: '右ページ' }).click();
  await expect(page.getByLabel('推しへひとこと♡')).toHaveValue(
    'いつもありがとう！',
  );
  await expect(
    page.getByRole('group', { name: '前方派から後方派' }).getByRole('slider'),
  ).toHaveAttribute('aria-valuenow', '10');
});

test('プレビューを表示してPNG画像を保存できる', async ({ page }) => {
  await page.getByLabel('名前', { exact: true }).fill('画像保存テスト');
  await page.getByRole('tab', { name: 'できあがり確認' }).click();

  const canvas = page.getByLabel(
    '入力内容を反映した推し活プロフィールのプレビュー',
  );
  await expect(canvas).toBeVisible();
  await expect
    .poll(() =>
      canvas.evaluate((element) => (element as HTMLCanvasElement).width),
    )
    .toBeGreaterThan(0);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '左ページ' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('mm-profile-left.png');
  await expect(page.getByText('画像を保存しました。')).toBeVisible();
});

test('確認後に入力内容をすべて消去できる', async ({ page }) => {
  await page.getByLabel('名前', { exact: true }).fill('消去対象');
  await page.getByRole('tab', { name: 'できあがり確認' }).click();
  await page.getByRole('button', { name: '入力内容をすべて消す' }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button', { name: 'すべて消す' }).click();
  await expect(page.getByText('入力内容をすべて消去しました。')).toBeVisible();

  await page.getByRole('tab', { name: '入力する' }).click();
  await expect(page.getByLabel('名前', { exact: true })).toHaveValue('');
});

test('サイト共有文にURLと2つのハッシュタグを含める', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(window.navigator, 'share', {
      configurable: true,
      value: undefined,
    });
    (window as Window & { openedUrl?: string }).openedUrl = undefined;
    window.open = ((url?: string | URL) => {
      (window as Window & { openedUrl?: string }).openedUrl = String(url);
      return { opener: null } as Window;
    }) as typeof window.open;
  });

  await page.getByRole('button', { name: 'このサイトをシェアする' }).click();
  await expect(page.getByText('Xの投稿画面を開きました。')).toBeVisible();

  const openedUrl = await page.evaluate(
    () => (window as Window & { openedUrl?: string }).openedUrl,
  );
  expect(openedUrl).toBeTruthy();
  const shareText = new URL(openedUrl!).searchParams.get('text');
  expect(shareText).toContain('http://localhost:3000/');
  expect(shareText).toContain('#MMプロフィール');
  expect(shareText).toContain('#さんくすちぇるしー');
});

test('PCでは画像を保存してXの投稿画面を開く', async ({ page }) => {
  await page.getByRole('tab', { name: 'できあがり確認' }).click();
  await page.evaluate(() => {
    Object.defineProperty(window.navigator, 'share', {
      configurable: true,
      value: undefined,
    });
    (window as Window & { openedUrl?: string }).openedUrl = undefined;
    window.open = ((url?: string | URL) => {
      (window as Window & { openedUrl?: string }).openedUrl = String(url);
      return { opener: null } as Window;
    }) as typeof window.open;
  });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '表示中の画像をXで共有' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('mm-profile-spread.png');
  await expect(
    page.getByText('画像を保存し、Xの投稿画面を開きました。'),
  ).toBeVisible();

  const openedUrl = await page.evaluate(
    () => (window as Window & { openedUrl?: string }).openedUrl,
  );
  const shareText = new URL(openedUrl!).searchParams.get('text');
  expect(shareText).toContain('#MMプロフィール');
  expect(shareText).toContain('#さんくすちぇるしー');
});
