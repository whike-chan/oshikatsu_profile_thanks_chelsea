'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import {
  ACTIVITY_TYPES,
  type PreviewView,
  type ProfileState,
  type TextFieldKey,
  type TextStyle,
} from './profile-types';

const WIDTH = 1536;
const HEIGHT = 1024;
const PAGE_WIDTH = WIDTH / 2;
const FONT_FAMILY =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Yu Gothic UI", "Hiragino Sans", sans-serif';

let backgroundImageRequest: Promise<HTMLImageElement> | null = null;

export const preloadProfileBackground = () => {
  if (backgroundImageRequest) return backgroundImageRequest;

  const request = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const finish = () => resolve(image);
      if (typeof image.decode === 'function') {
        void image.decode().then(finish, finish);
      } else {
        finish();
      }
    };
    image.onerror = () => reject(new Error('背景画像を読み込めませんでした。'));
    image.src = new URL('oshikatsu-profile.jpg', document.baseURI).toString();
  });

  backgroundImageRequest = request;
  void request.catch(() => {
    if (backgroundImageRequest === request) backgroundImageRequest = null;
  });
  return request;
};

export type ProfileCanvasHandle = {
  makeBlob: (view: PreviewView) => Promise<Blob>;
};

type Props = {
  profile: ProfileState;
  view: PreviewView;
};

type Placement = {
  key: TextFieldKey;
  x: number;
  y: number;
  width: number;
  align?: CanvasTextAlign;
  fontScale?: number;
};

const SINGLE_LINE_PLACEMENTS: Placement[] = [
  { key: 'name', x: 260, y: 201, width: 438 },
  { key: 'account', x: 330, y: 252, width: 368 },
  { key: 'birthExtra', x: 255, y: 297, width: 282 },
  { key: 'birthMonth', x: 565, y: 297, width: 34 },
  { key: 'birthDay', x: 624, y: 297, width: 32 },
  { key: 'area', x: 270, y: 354, width: 428 },
  { key: 'oshi', x: 225, y: 405, width: 473 },
  { key: 'oshiGroup', x: 270, y: 456, width: 428 },
  { key: 'history', x: 240, y: 507, width: 458 },
  { key: 'memoryVenue', x: 265, y: 754, width: 440 },
  { key: 'favoriteEvent', x: 355, y: 805, width: 350, fontScale: 0.9 },
  { key: 'favoriteCostume', x: 300, y: 856, width: 405 },
  { key: 'favoriteMv', x: 270, y: 906, width: 435 },
  { key: 'favoriteSong', x: 270, y: 957, width: 380 },
  { key: 'memberHealing', x: 818, y: 641, width: 309 },
  { key: 'memberMoodMaker', x: 818, y: 691, width: 309 },
  { key: 'memberGap', x: 818, y: 741, width: 309 },
  { key: 'memberNatural', x: 818, y: 790, width: 309 },
  { key: 'memberReliable', x: 1168, y: 641, width: 324 },
  { key: 'memberCaptivating', x: 1168, y: 691, width: 324 },
  { key: 'memberFashionable', x: 1168, y: 741, width: 324 },
  { key: 'memberFriend', x: 1168, y: 798, width: 324 },
];

const getStyle = (profile: ProfileState, key: TextFieldKey): TextStyle => ({
  ...profile.globalStyle,
  ...profile.fieldStyles[key],
});

const applyTextStyle = (
  context: CanvasRenderingContext2D,
  profile: ProfileState,
  key: TextFieldKey,
  fontScale = 1,
) => {
  const style = getStyle(profile, key);
  context.fillStyle = style.color;
  context.font = `600 ${Math.round(style.fontSize * fontScale)}px ${FONT_FAMILY}`;
  context.textBaseline = 'alphabetic';
  context.shadowColor = 'rgba(255,255,255,.95)';
  context.shadowBlur = 2;
};

const wrapCharacters = (
  context: CanvasRenderingContext2D,
  text: string,
  widths: number[],
) => {
  const normalized = text.replace(/\r\n/g, '\n');
  const lines: string[] = [];
  let current = '';

  for (const character of normalized) {
    if (character === '\n') {
      lines.push(current);
      current = '';
      continue;
    }

    const candidate = current + character;
    const width = widths[Math.min(lines.length, widths.length - 1)];
    if (current && context.measureText(candidate).width > width) {
      lines.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }

  if (current || normalized.endsWith('\n')) {
    lines.push(current);
  }
  return lines;
};

const drawStar = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  color: string,
) => {
  const points = 5;
  const outerRadius = 13;
  const innerRadius = 6;
  context.save();
  context.beginPath();
  for (let point = 0; point < points * 2; point += 1) {
    const radius = point % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + (point * Math.PI) / points;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    if (point === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
  context.fillStyle = color;
  context.strokeStyle = '#ffffff';
  context.lineWidth = 2;
  context.shadowColor = 'rgba(91,26,85,.28)';
  context.shadowBlur = 4;
  context.fill();
  context.stroke();
  context.restore();
};

const drawFallback = (context: CanvasRenderingContext2D) => {
  const gradient = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, '#ffe0ef');
  gradient.addColorStop(0.5, '#f8c7e1');
  gradient.addColorStop(1, '#eadcff');
  context.fillStyle = gradient;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = '#fffafd';
  context.fillRect(28, 148, 700, 835);
  context.fillRect(798, 148, 710, 835);
  context.strokeStyle = '#d44c91';
  context.lineWidth = 3;
  context.strokeRect(28, 148, 700, 835);
  context.strokeRect(798, 148, 710, 835);
  context.fillStyle = '#7c255f';
  context.textAlign = 'center';
  context.font = `700 56px ${FONT_FAMILY}`;
  context.fillText('Profile', 384, 105);
  context.fillText('About me', 1152, 105);
};

const drawProfile = (
  context: CanvasRenderingContext2D,
  profile: ProfileState,
  background: HTMLImageElement | null,
) => {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  if (background) context.drawImage(background, 0, 0, WIDTH, HEIGHT);
  else drawFallback(context);

  context.save();
  for (const placement of SINGLE_LINE_PLACEMENTS) {
    const value = profile.values[placement.key];
    if (!value) continue;
    applyTextStyle(context, profile, placement.key, placement.fontScale);
    context.textAlign = placement.align ?? 'right';
    context.fillText(value, placement.x + placement.width, placement.y);
  }

  const reason = profile.values.reason;
  if (reason) {
    applyTextStyle(context, profile, 'reason', 0.95);
    context.textAlign = 'right';
    const firstWidth = 420;
    const fullWidth = 610;
    const lines = wrapCharacters(context, reason, [firstWidth, fullWidth]);
    lines.forEach((line, index) => {
      context.fillText(line, 698, 558 + index * 51);
    });
  }

  const drawParagraph = (
    key: 'message' | 'freeComment',
    x: number,
    y: number,
    width: number,
  ) => {
    const value = profile.values[key];
    if (!value) return;
    applyTextStyle(context, profile, key, 0.92);
    context.textAlign = 'left';
    const lines = wrapCharacters(context, value, [width]);
    lines.forEach((line, index) => {
      context.fillText(line, x, y + index * 48);
    });
  };

  drawParagraph('message', 818, 876, 280);
  drawParagraph('freeComment', 1154, 876, 336);

  const sliderY = [197, 238, 278, 319, 359, 399, 440, 480, 520];
  const sliderClearStart = [950, 950, 950, 950, 976, 952, 980, 950, 978];
  // Keep the editable slider clear of the longer labels printed on the background.
  const sliderStart = 1012;
  const sliderEnd = 1317;
  sliderY.forEach((y, index) => {
    context.save();
    context.fillStyle = '#fffafd';
    context.fillRect(
      sliderClearStart[index],
      y - 7,
      sliderStart - sliderClearStart[index],
      14,
    );
    context.fillRect(sliderStart - 4, y - 11, sliderEnd - sliderStart + 8, 22);
    context.beginPath();
    context.setLineDash([1, 5]);
    context.lineCap = 'round';
    context.lineWidth = 2;
    context.strokeStyle = '#713169';
    context.moveTo(sliderStart, y);
    context.lineTo(sliderEnd, y);
    context.stroke();
    context.restore();

    const value = profile.activityTypes[index] ?? 5;
    const x = sliderStart + ((sliderEnd - sliderStart) * value) / 10;
    drawStar(context, x, y, ACTIVITY_TYPES[index].color);
  });
  context.restore();
};

const renderOutputCanvas = (
  profile: ProfileState,
  background: HTMLImageElement | null,
  view: PreviewView,
) => {
  const master = document.createElement('canvas');
  master.width = WIDTH;
  master.height = HEIGHT;
  const masterContext = master.getContext('2d');
  if (!masterContext) throw new Error('Canvasを利用できません。');
  drawProfile(masterContext, profile, background);

  if (view === 'spread') return master;

  const page = document.createElement('canvas');
  page.width = PAGE_WIDTH;
  page.height = HEIGHT;
  const pageContext = page.getContext('2d');
  if (!pageContext) throw new Error('Canvasを利用できません。');
  const sourceX = view === 'left' ? 0 : PAGE_WIDTH;
  pageContext.drawImage(
    master,
    sourceX,
    0,
    PAGE_WIDTH,
    HEIGHT,
    0,
    0,
    PAGE_WIDTH,
    HEIGHT,
  );
  return page;
};

export const ProfileCanvas = forwardRef<ProfileCanvasHandle, Props>(
  function ProfileCanvas({ profile, view }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [background, setBackground] = useState<HTMLImageElement | null>(null);
    const [backgroundMissing, setBackgroundMissing] = useState(false);

    useEffect(() => {
      let active = true;
      void preloadProfileBackground().then(
        (image) => {
          if (!active) return;
          setBackground(image);
          setBackgroundMissing(false);
        },
        () => {
          if (active) setBackgroundMissing(true);
        },
      );
      return () => {
        active = false;
      };
    }, []);

    useEffect(() => {
      const visible = canvasRef.current;
      if (!visible) return;
      const rendered = renderOutputCanvas(profile, background, view);
      visible.width = rendered.width;
      visible.height = rendered.height;
      const context = visible.getContext('2d');
      context?.drawImage(rendered, 0, 0);
    }, [background, profile, view]);

    useImperativeHandle(
      ref,
      () => ({
        makeBlob: async (outputView) => {
          let outputBackground = background;
          if (!outputBackground && !backgroundMissing) {
            try {
              outputBackground = await preloadProfileBackground();
            } catch {
              // The fallback canvas remains available when the source image fails.
            }
          }
          const output = renderOutputCanvas(
            profile,
            outputBackground,
            outputView,
          );
          const blob = await new Promise<Blob | null>((resolve) =>
            output.toBlob(resolve, 'image/png'),
          );
          if (!blob) throw new Error('画像を作成できませんでした。');
          return blob;
        },
      }),
      [background, backgroundMissing, profile],
    );

    const backgroundLoading = !background && !backgroundMissing;

    return (
      <div className="canvas-shell" aria-busy={backgroundLoading}>
        <canvas
          ref={canvasRef}
          className={
            backgroundLoading
              ? 'profile-canvas profile-canvas-loading'
              : 'profile-canvas'
          }
          aria-label="入力内容を反映した推し活プロフィールのプレビュー"
        >
          入力内容を反映した推し活プロフィールのプレビュー
        </canvas>
        {backgroundLoading && (
          <output className="canvas-loading">
            <span className="canvas-loading-spinner" aria-hidden="true" />
            プロフィール画像を読み込み中…
          </output>
        )}
        {backgroundMissing && (
          <output className="canvas-notice">
            背景画像を読み込めませんでした。再読み込みしてください。
          </output>
        )}
      </div>
    );
  },
);
