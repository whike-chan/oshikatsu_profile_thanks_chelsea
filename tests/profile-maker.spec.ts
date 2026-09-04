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

test('文字設定は左右ページ共通で、必要なときだけ開ける', async ({ page }) => {
  const settings = page.locator('details.settings-card');

  await expect(settings).toHaveCount(1);
  await expect(settings).not.toHaveAttribute('open', '');
  await expect(settings.getByText('左右ページ共通の設定です')).toBeVisible();
  await expect(settings.getByLabel('すべての文字色')).toBeHidden();

  await settings.locator('summary').click();
  await expect(settings).toHaveAttribute('open', '');
  await expect(settings.getByLabel('すべての文字色')).toBeVisible();

  await page.getByRole('tab', { name: '右ページ' }).click();
  await expect(settings).toHaveCount(1);
  await expect(settings.getByLabel('すべての文字色')).toBeVisible();
});

test('入力欄をTabで順番に移動でき、スマホ向けキー表示を指定する', async ({
  page,
}) => {
  const leftInputOrder = [
    'name',
    'account',
    'birthExtra',
    'birthMonth',
    'birthDay',
    'area',
    'oshi',
    'oshiGroup',
    'history',
    'reason',
    'memoryVenue',
    'favoriteEvent',
    'favoriteCostume',
    'favoriteMv',
    'favoriteSong',
  ];

  await page.locator('#name').focus();
  for (const id of leftInputOrder) {
    await expect(page.locator(`#${id}`)).toBeFocused();
    if (id !== leftInputOrder.at(-1)) await page.keyboard.press('Tab');
  }

  await expect(page.locator('#name')).toHaveAttribute('enterkeyhint', 'next');
  await expect(page.locator('#birthMonth')).toHaveAttribute(
    'enterkeyhint',
    'next',
  );
  await expect(page.locator('#reason')).toHaveAttribute(
    'enterkeyhint',
    'enter',
  );
  await expect(page.locator('#favoriteSong')).toHaveAttribute(
    'enterkeyhint',
    'done',
  );

  await page.getByRole('tab', { name: '右ページ' }).click();
  const firstMember = page.getByRole('combobox', {
    name: '癒し系といえば？',
    exact: true,
  });
  const secondMember = page.getByRole('combobox', {
    name: 'しっかり者といえば？',
    exact: true,
  });
  await firstMember.focus();
  await page.keyboard.press('Tab');
  await expect(secondMember).toBeFocused();
  await expect(firstMember).toHaveAttribute('enterkeyhint', 'next');
  await expect(page.locator('#message')).toHaveAttribute(
    'enterkeyhint',
    'enter',
  );
});

test('フッターの内容が下部固定操作に隠れない', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  await expect(page.getByRole('heading', { name: '更新履歴' })).toBeVisible();
  await expect(page.getByText('2026.09.04 4時頃')).toBeVisible();
  await expect(page.getByRole('heading', { name: '元ネタ' })).toBeVisible();
  await expect(
    page.getByRole('link', {
      name: '【モーニング娘。推し活講座】メンバー紹介編 前編 (11・12・15・16期メンバー)',
    }),
  ).toHaveAttribute('href', 'https://youtu.be/emsxRz_Qo4Y');
  await expect(
    page.getByRole('link', {
      name: '【モーニング娘。推し活講座】メンバー紹介編 後編 (17・18期メンバー)',
    }),
  ).toHaveAttribute('href', 'https://youtu.be/Mh_ym_9zpLQ');

  const fixedTabs = await page
    .getByRole('tablist', { name: '入力とプレビューの切り替え' })
    .boundingBox();
  const creator = await page.getByText('作った人：').boundingBox();

  expect(fixedTabs).not.toBeNull();
  expect(creator).not.toBeNull();
  expect(creator!.y + creator!.height).toBeLessThan(fixedTabs!.y);
});

test('入力と確認で、それぞれのスクロール位置を保持する', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const inputScrollPosition = await page.evaluate(() => window.scrollY);
  expect(inputScrollPosition).toBeGreaterThan(500);

  await page.getByRole('tab', { name: 'できあがり確認' }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  await page.evaluate(() => window.scrollTo(0, 300));
  const previewScrollPosition = await page.evaluate(() => window.scrollY);
  expect(previewScrollPosition).toBeGreaterThan(0);

  await page.getByRole('tab', { name: '入力する' }).click();
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBe(inputScrollPosition);

  await page.getByRole('tab', { name: 'できあがり確認' }).click();
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBe(previewScrollPosition);
});

test('背景画像を入力中から読み込み、準備中は案内を表示する', async ({
  browser,
}) => {
  const context = await browser.newContext();
  const previewPage = await context.newPage();
  let releaseImageRequest = () => {};
  const imageRequestGate = new Promise<void>((resolve) => {
    releaseImageRequest = resolve;
  });

  await previewPage.route('**/oshikatsu-profile.jpg', async (route) => {
    await imageRequestGate;
    await route.continue();
  });

  try {
    await previewPage.goto('http://localhost:3000/', {
      waitUntil: 'domcontentloaded',
    });
    await previewPage.waitForFunction(
      (key) => window.localStorage.getItem(key) !== null,
      STORAGE_KEY,
    );
    await previewPage.getByRole('tab', { name: 'できあがり確認' }).click();
    await expect(
      previewPage.getByText('プロフィール画像を読み込み中…'),
    ).toBeVisible();

    releaseImageRequest();
    await expect(
      previewPage.getByText('プロフィール画像を読み込み中…'),
    ).toBeHidden();
  } finally {
    releaseImageRequest();
    await context.close();
  }
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
  await page.getByLabel('推しへひとこと').fill('いつもありがとう！');
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
  await expect(page.getByLabel('推しへひとこと')).toHaveValue(
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

test('推し活タイプの破線が左側の項目名を隠さない', async ({ page }) => {
  await page.getByRole('tab', { name: 'できあがり確認' }).click();
  await page.getByRole('tab', { name: '右' }).click();

  const canvas = page.getByLabel(
    '入力内容を反映した推し活プロフィールのプレビュー',
  );
  await expect
    .poll(() =>
      canvas.evaluate((element) => (element as HTMLCanvasElement).width),
    )
    .toBe(768);

  const comparison = await canvas.evaluate(async (element) => {
    const actualCanvas = element as HTMLCanvasElement;
    const actualContext = actualCanvas.getContext('2d');
    if (!actualContext) throw new Error('プレビューを読み取れません。');

    const background = new Image();
    background.src = new URL(
      'oshikatsu-profile.jpg',
      document.baseURI,
    ).toString();
    await background.decode();

    const referenceCanvas = document.createElement('canvas');
    referenceCanvas.width = background.naturalWidth;
    referenceCanvas.height = background.naturalHeight;
    const referenceContext = referenceCanvas.getContext('2d');
    if (!referenceContext) throw new Error('元画像を読み取れません。');
    referenceContext.drawImage(background, 0, 0);

    const preservedLabels = [
      { x: 940, y: 359, width: 36 },
      { x: 940, y: 440, width: 40 },
      { x: 940, y: 520, width: 38 },
    ];
    let changedLabelPixels = 0;
    for (const area of preservedLabels) {
      const actual = actualContext.getImageData(
        area.x - 768,
        area.y - 10,
        area.width,
        20,
      ).data;
      const reference = referenceContext.getImageData(
        area.x,
        area.y - 10,
        area.width,
        20,
      ).data;
      for (let index = 0; index < actual.length; index += 1) {
        if (actual[index] !== reference[index]) changedLabelPixels += 1;
      }
    }

    const rows = [197, 238, 278, 319, 359, 399, 440, 480, 520];
    const backgroundColor = [255, 250, 253, 255];
    const lineStartsAtStar = rows.every((y) => {
      const beforeLine = [...actualContext.getImageData(234, y, 1, 1).data];
      const lineStart = [...actualContext.getImageData(244, y, 1, 1).data];
      return (
        beforeLine.every(
          (channel, index) => channel === backgroundColor[index],
        ) &&
        lineStart.some((channel, index) => channel !== backgroundColor[index])
      );
    });

    return { changedLabelPixels, lineStartsAtStar };
  });

  expect(comparison.changedLabelPixels).toBe(0);
  expect(comparison.lineStartsAtStar).toBe(true);
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
  await page.getByRole('button', { name: '画像を保存してXを開く' }).click();
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

test('左・右・見開きを共有でき、キャンセル後も再試行できる', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window.navigator, 'userAgentData', {
      configurable: true,
      value: { mobile: true },
    });
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    (key) => window.localStorage.getItem(key) !== null,
    STORAGE_KEY,
  );
  await page.getByRole('tab', { name: 'できあがり確認' }).click();
  await page.evaluate(() => {
    type ShareCall = { fileName: string; userActivation: boolean };
    const state = window as Window & { shareCalls?: ShareCall[] };
    state.shareCalls = [];
    window.open = (() => ({ opener: null }) as Window) as typeof window.open;

    Object.defineProperty(window.navigator, 'canShare', {
      configurable: true,
      // iOSブラウザではファイル単体の確認は通っても、本文込みの確認が
      // falseになる場合があるため、判定はファイルだけで行います。
      value: (data: ShareData) => Boolean(data.files?.length) && !data.text,
    });
    Object.defineProperty(window.navigator, 'share', {
      configurable: true,
      value: async function (this: Navigator, data: ShareData) {
        if (this !== window.navigator) {
          throw new TypeError('Navigatorをthisとして呼び出す必要があります。');
        }
        const call = {
          fileName: data.files?.[0]?.name ?? '',
          userActivation: window.navigator.userActivation?.isActive ?? false,
        };
        state.shareCalls?.push(call);
        if (state.shareCalls?.length === 1) {
          throw new DOMException('共有をキャンセル', 'AbortError');
        }
      },
    });
  });

  const shareButton = page.getByRole('button', {
    name: '表示中の画像をXで共有',
  });

  await page.getByRole('tab', { name: '左', exact: true }).click();
  await expect(page.getByText('共有用画像の準備ができました。')).toBeVisible();
  await expect(shareButton).toBeEnabled();
  await shareButton.click();
  await expect(
    page.getByText('共有がキャンセルされたか、共有画面を開けませんでした。'),
  ).toBeVisible();

  const fallbackButton = page.getByRole('button', {
    name: '画像を保存してXを開く',
  });
  await expect(fallbackButton).toBeVisible();
  const fallbackDownloadPromise = page.waitForEvent('download');
  await fallbackButton.click();
  const fallbackDownload = await fallbackDownloadPromise;
  expect(fallbackDownload.suggestedFilename()).toBe('mm-profile-left.png');
  await expect(
    page.getByText('画像を保存し、Xの投稿画面を開きました。'),
  ).toBeVisible();

  await shareButton.click();
  await expect(page.getByText('共有が完了しました。')).toBeVisible();

  await page.getByRole('tab', { name: '右', exact: true }).click();
  await expect(
    page.getByRole('button', { name: '共有用画像を準備中…' }),
  ).toBeDisabled();
  await expect(page.getByText('共有用画像の準備ができました。')).toBeVisible();
  await shareButton.click();
  await expect(page.getByText('共有が完了しました。')).toBeVisible();

  await page.getByRole('tab', { name: '見開き' }).click();
  await expect(page.getByText('共有用画像の準備ができました。')).toBeVisible();
  await shareButton.click();
  await expect(page.getByText('共有が完了しました。')).toBeVisible();

  const calls = await page.evaluate(
    () =>
      (
        window as Window & {
          shareCalls?: Array<{ fileName: string; userActivation: boolean }>;
        }
      ).shareCalls,
  );
  expect(calls).toEqual([
    { fileName: 'mm-profile-left.png', userActivation: true },
    { fileName: 'mm-profile-left.png', userActivation: true },
    { fileName: 'mm-profile-right.png', userActivation: true },
    { fileName: 'mm-profile-spread.png', userActivation: true },
  ]);
});
