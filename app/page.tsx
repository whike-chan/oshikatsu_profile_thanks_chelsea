'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete } from '@base-ui/react/autocomplete';
import {
  Download,
  Heart,
  ImageIcon,
  LoaderCircle,
  Palette,
  RotateCcw,
  Share2,
  Sparkles,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import {
  preloadProfileBackground,
  ProfileCanvas,
  type ProfileCanvasHandle,
} from './profile-canvas';
import {
  ACTIVITY_TYPES,
  CURRENT_MEMBERS,
  EMPTY_VALUES,
  INITIAL_STATE,
  MEMBER_FIELDS,
  PROFILE_STORAGE_KEY,
  TEXT_FIELD_LABELS,
  type PreviewView,
  type ProfileState,
  type TextFieldKey,
} from './profile-types';

type MobileMode = 'input' | 'preview';
type EditorPage = 'left' | 'right';
type ShareStage = 'idle' | 'preparing' | 'ready' | 'sharing' | 'error';

type PreparedShareImage = {
  view: PreviewView;
  blob: Blob;
};

const isMobileShareDevice = () => {
  const userAgentData = (
    navigator as Navigator & { userAgentData?: { mobile?: boolean } }
  ).userAgentData;
  if (typeof userAgentData?.mobile === 'boolean') {
    return userAgentData.mobile;
  }

  return (
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

const fileNames: Record<PreviewView, string> = {
  spread: 'mm-profile-spread.png',
  left: 'mm-profile-left.png',
  right: 'mm-profile-right.png',
};

const leftMainFields: Array<{
  key: TextFieldKey;
  label: string;
  placeholder: string;
  maxLength: number;
}> = [
  { key: 'name', label: '名前', placeholder: '例：ちぇる推し', maxLength: 24 },
  {
    key: 'account',
    label: 'アカウント名（X・Instagramなど）',
    placeholder: '例：@mm_profile',
    maxLength: 36,
  },
  {
    key: 'area',
    label: '住んでいるエリア',
    placeholder: '例：関東',
    maxLength: 24,
  },
  {
    key: 'oshi',
    label: '推し',
    placeholder: '例：野中美希さん',
    maxLength: 28,
  },
  {
    key: 'oshiGroup',
    label: '推しグループ',
    placeholder: "例：モーニング娘。'26",
    maxLength: 28,
  },
  {
    key: 'history',
    label: '推し遍歴',
    placeholder: 'これまでの推しを自由に',
    maxLength: 42,
  },
];

const leftFavoriteFields: Array<{
  key: TextFieldKey;
  label: string;
  placeholder: string;
  maxLength: number;
}> = [
  {
    key: 'memoryVenue',
    label: '思い出の現場',
    placeholder: '会場や公演名など',
    maxLength: 36,
  },
  {
    key: 'favoriteEvent',
    label: '一番好きなコンサート・イベント',
    placeholder: '公演名・イベント名',
    maxLength: 42,
  },
  {
    key: 'favoriteCostume',
    label: '一番好きな衣装',
    placeholder: '衣装名や曲名など',
    maxLength: 36,
  },
  {
    key: 'favoriteMv',
    label: '一番好きなMV',
    placeholder: 'MVのタイトル',
    maxLength: 36,
  },
  {
    key: 'favoriteSong',
    label: '一番好きな曲',
    placeholder: '曲名',
    maxLength: 36,
  },
];

const memberFields = MEMBER_FIELDS.map((key) => ({
  key,
  label: TEXT_FIELD_LABELS[key],
}));

const clampNumberText = (value: string, maximum: number) => {
  const digits = value.replace(/\D/g, '').slice(0, 2);
  if (!digits) return '';
  return String(Math.min(Number(digits), maximum));
};

const isProfileState = (value: unknown): value is ProfileState => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ProfileState>;
  return Boolean(
    candidate.values &&
    Array.isArray(candidate.activityTypes) &&
    candidate.globalStyle &&
    candidate.fieldStyles,
  );
};

function AppInput({
  fieldKey,
  label,
  placeholder,
  maxLength,
  value,
  onValueChange,
  onFocus,
}: {
  fieldKey: TextFieldKey;
  label: string;
  placeholder: string;
  maxLength: number;
  value: string;
  onValueChange: (key: TextFieldKey, value: string) => void;
  onFocus: (key: TextFieldKey) => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={fieldKey}>{label}</FieldLabel>
      <Input
        id={fieldKey}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        className="app-input"
        onFocus={() => onFocus(fieldKey)}
        onChange={(event) => onValueChange(fieldKey, event.target.value)}
      />
    </Field>
  );
}

function MemberInput({
  fieldKey,
  label,
  value,
  onValueChange,
  onFocus,
}: {
  fieldKey: TextFieldKey;
  label: string;
  value: string;
  onValueChange: (key: TextFieldKey, value: string) => void;
  onFocus: (key: TextFieldKey) => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={fieldKey}>{label}</FieldLabel>
      <Autocomplete.Root
        items={CURRENT_MEMBERS}
        value={value}
        onValueChange={(nextValue) => onValueChange(fieldKey, nextValue)}
        openOnInputClick
        autoHighlight
      >
        <Autocomplete.Input
          id={fieldKey}
          maxLength={24}
          placeholder="選択または自由入力"
          className="app-input"
          onFocus={() => onFocus(fieldKey)}
        />
        <Autocomplete.Portal>
          <Autocomplete.Positioner
            className="member-suggestions-positioner"
            sideOffset={5}
            align="start"
          >
            <Autocomplete.Popup className="member-suggestions">
              <Autocomplete.List>
                {(member: string) => (
                  <Autocomplete.Item
                    key={member}
                    value={member}
                    className="member-suggestion"
                  >
                    {member}
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
    </Field>
  );
}

function CountHint({
  value,
  recommended,
  lines,
}: {
  value: string;
  recommended: number;
  lines?: number;
}) {
  const over = value.length > recommended;
  return (
    <span className={over ? 'count-hint count-hint-over' : 'count-hint'}>
      {value.length}文字／おすすめ{recommended}文字程度
      {lines ? `・${lines}行まで` : ''}
    </span>
  );
}

export default function Home() {
  const [profile, setProfile] = useState<ProfileState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [mobileMode, setMobileMode] = useState<MobileMode>('input');
  const [editorPage, setEditorPage] = useState<EditorPage>('left');
  const [previewView, setPreviewView] = useState<PreviewView>('spread');
  const [selectedField, setSelectedField] = useState<TextFieldKey>('name');
  const [status, setStatus] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const [siteShareStatus, setSiteShareStatus] = useState('');
  const [useXWebFallback, setUseXWebFallback] = useState(false);
  const [shareFallbackAvailable, setShareFallbackAvailable] = useState(false);
  const [shareStage, setShareStage] = useState<ShareStage>('idle');
  const [preparedShareImage, setPreparedShareImage] =
    useState<PreparedShareImage | null>(null);
  const [sharePreparationAttempt, setSharePreparationAttempt] = useState(0);
  const canvasRef = useRef<ProfileCanvasHandle>(null);
  const modeScrollPositions = useRef<Record<MobileMode, number>>({
    input: 0,
    preview: 0,
  });

  useEffect(() => {
    void preloadProfileBackground().catch(() => undefined);

    const initialize = () => {
      setUseXWebFallback(!isMobileShareDevice());

      try {
        const saved = window.localStorage.getItem(PROFILE_STORAGE_KEY);
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (isProfileState(parsed)) {
            setProfile({
              ...parsed,
              globalStyle: {
                ...parsed.globalStyle,
                // 初期版の既定値だけ、新しい推奨サイズへ引き上げます。
                fontSize:
                  parsed.globalStyle.fontSize === 20
                    ? 22
                    : parsed.globalStyle.fontSize,
              },
            });
          }
        }
      } catch {
        // A blocked browser store should not stop the editor.
      } finally {
        setHydrated(true);
      }

      if (window.matchMedia('(max-width: 1023px)').matches) {
        setPreviewView('left');
      }
    };
    const timeout = window.setTimeout(initialize, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useLayoutEffect(() => {
    window.scrollTo(0, modeScrollPositions.current[mobileMode]);
  }, [mobileMode]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Local saving is optional; the maker still works without it.
    }
  }, [hydrated, profile]);

  useEffect(() => {
    let cancelled = false;

    if (mobileMode !== 'preview') return;

    const frame = window.requestAnimationFrame(() => {
      if (cancelled) return;
      setPreparedShareImage(null);
      setShareStage('preparing');
      setShareStatus('共有用画像を準備しています…');

      const canvas = canvasRef.current;
      if (!canvas) {
        if (!cancelled) {
          setShareStage('error');
          setShareStatus(
            '共有用画像を準備できませんでした。再準備してください。',
          );
        }
        return;
      }

      void canvas.makeBlob(previewView).then(
        (blob) => {
          if (cancelled) return;
          setPreparedShareImage({ view: previewView, blob });
          setShareStage('ready');
          setShareStatus('共有用画像の準備ができました。');
        },
        () => {
          if (cancelled) return;
          setShareStage('error');
          setShareStatus(
            '共有用画像を準備できませんでした。再準備してください。',
          );
        },
      );
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [mobileMode, previewView, profile, sharePreparationAttempt]);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const fieldKeys = new Set(Object.keys(TEXT_FIELD_LABELS));

    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: 'update_oshikatsu_profile',
            title: '推し活プロフィールを入力',
            description:
              '推し活プロフィールの文字項目と9個の推し活タイプをまとめて入力し、画面と画像プレビューを更新します。指定しない項目は変更しません。',
            inputSchema: {
              type: 'object',
              properties: {
                values: {
                  type: 'object',
                  description: '変更する文字項目。値は文字列です。',
                  additionalProperties: { type: 'string' },
                },
                activityTypes: {
                  type: 'array',
                  description: '左端0、中央5、右端10で指定する9個の値。',
                  minItems: 9,
                  maxItems: 9,
                  items: { type: 'integer', minimum: 0, maximum: 10 },
                },
              },
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute(input) {
              if (!input || typeof input !== 'object') {
                throw new Error('入力はオブジェクトで指定してください。');
              }
              const payload = input as {
                values?: Record<string, unknown>;
                activityTypes?: unknown;
              };
              const updates: Partial<Record<TextFieldKey, string>> = {};

              if (payload.values !== undefined) {
                if (!payload.values || typeof payload.values !== 'object') {
                  throw new Error(
                    'valuesは文字項目のオブジェクトで指定してください。',
                  );
                }
                for (const [key, value] of Object.entries(payload.values)) {
                  if (!fieldKeys.has(key) || typeof value !== 'string') {
                    throw new Error(`使用できない文字項目です: ${key}`);
                  }
                  updates[key as TextFieldKey] = value;
                }
              }

              let activityTypes: number[] | undefined;
              if (payload.activityTypes !== undefined) {
                if (
                  !Array.isArray(payload.activityTypes) ||
                  payload.activityTypes.length !== 9 ||
                  payload.activityTypes.some(
                    (value) =>
                      !Number.isInteger(value) || value < 0 || value > 10,
                  )
                ) {
                  throw new Error(
                    'activityTypesは0〜10の整数を9個指定してください。',
                  );
                }
                activityTypes = payload.activityTypes as number[];
              }

              if (!Object.keys(updates).length && !activityTypes) {
                throw new Error(
                  'valuesまたはactivityTypesを指定してください。',
                );
              }

              setProfile((current) => ({
                ...current,
                values: { ...current.values, ...updates },
                activityTypes: activityTypes ?? current.activityTypes,
              }));

              return {
                status: 'updated',
                updatedTextFields: Object.keys(updates),
                updatedActivityTypes: Boolean(activityTypes),
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => undefined);
    } catch {
      // WebMCP is progressive enhancement and may not be available.
    }

    return () => lifecycle.abort();
  }, []);

  const updateValue = (key: TextFieldKey, value: string) => {
    setProfile((current) => ({
      ...current,
      values: { ...current.values, [key]: value },
    }));
  };

  const changeMobileMode = (nextMode: MobileMode) => {
    if (nextMode === mobileMode) return;
    modeScrollPositions.current[mobileMode] = window.scrollY;
    if (nextMode === 'preview') {
      setPreparedShareImage(null);
      setShareFallbackAvailable(false);
      setShareStage('preparing');
      setShareStatus('共有用画像を準備しています…');
    } else {
      setShareStage('idle');
    }
    setMobileMode(nextMode);
  };

  const changePreviewView = (nextView: PreviewView) => {
    if (nextView === previewView) return;
    setPreparedShareImage(null);
    setShareFallbackAvailable(false);
    setShareStage('preparing');
    setShareStatus('共有用画像を準備しています…');
    setPreviewView(nextView);
  };

  const updateActivityType = (
    index: number,
    next: number | readonly number[],
  ) => {
    const value = Array.isArray(next) ? next[0] : next;
    setProfile((current) => {
      const activityTypes = [...current.activityTypes];
      activityTypes[index] = value;
      return { ...current, activityTypes };
    });
  };

  const selectedStyle = useMemo(
    () => ({
      ...profile.globalStyle,
      ...profile.fieldStyles[selectedField],
    }),
    [profile, selectedField],
  );

  const updateGlobalStyle = (
    key: 'color' | 'fontSize',
    value: string | number,
  ) => {
    setProfile((current) => ({
      ...current,
      globalStyle: { ...current.globalStyle, [key]: value },
    }));
  };

  const updateFieldStyle = (
    key: 'color' | 'fontSize',
    value: string | number,
  ) => {
    setProfile((current) => ({
      ...current,
      fieldStyles: {
        ...current.fieldStyles,
        [selectedField]: {
          ...current.fieldStyles[selectedField],
          [key]: value,
        },
      },
    }));
  };

  const resetFieldStyle = () => {
    setProfile((current) => {
      const fieldStyles = { ...current.fieldStyles };
      delete fieldStyles[selectedField];
      return { ...current, fieldStyles };
    });
  };

  const resetAll = () => {
    setProfile({
      ...INITIAL_STATE,
      values: { ...EMPTY_VALUES },
      activityTypes: Array(9).fill(5),
      fieldStyles: {},
    });
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    setStatus('入力内容をすべて消去しました。');
  };

  const saveBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const download = async (view: PreviewView) => {
    try {
      const blob = await canvasRef.current?.makeBlob(view);
      if (!blob) return;
      saveBlob(blob, fileNames[view]);
      setStatus('画像を保存しました。');
    } catch {
      setStatus('画像を保存できませんでした。もう一度お試しください。');
    }
  };

  const makeShareText = () => {
    const shareUrl = new URL(window.location.href);
    shareUrl.search = '';
    shareUrl.hash = '';
    return `${shareUrl.toString()}\n#MMプロフィール #さんくすちぇるしー`;
  };

  const shareViaXWeb = (shareText: string, blob: Blob) => {
    const xWindow = window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      '_blank',
    );
    if (xWindow) xWindow.opener = null;

    saveBlob(blob, fileNames[previewView]);
    setShareStatus(
      xWindow
        ? '画像を保存し、Xの投稿画面を開きました。画像を添付してください。'
        : '画像を保存しました。Xを開けない場合は、ブラウザのポップアップ設定をご確認ください。',
    );
  };

  const shareCurrentImageViaXWeb = () => {
    if (!preparedShareImage || preparedShareImage.view !== previewView) {
      setPreparedShareImage(null);
      setShareFallbackAvailable(false);
      setShareStage('preparing');
      setSharePreparationAttempt((attempt) => attempt + 1);
      setShareStatus('共有用画像を再準備しています…');
      return;
    }

    setShareFallbackAvailable(false);
    setShareStage('sharing');
    setShareStatus('画像を保存して、Xの投稿画面を開いています…');
    shareViaXWeb(makeShareText(), preparedShareImage.blob);
    setShareStage('ready');
  };

  const shareToX = async () => {
    if (
      !preparedShareImage ||
      preparedShareImage.view !== previewView ||
      shareStage === 'error'
    ) {
      setPreparedShareImage(null);
      setShareFallbackAvailable(false);
      setShareStage('preparing');
      setSharePreparationAttempt((attempt) => attempt + 1);
      setShareStatus('共有用画像を再準備しています…');
      return;
    }

    const shareText = makeShareText();
    const file = new File([preparedShareImage.blob], fileNames[previewView], {
      type: 'image/png',
    });
    const shareData = { files: [file], text: shareText };
    const shareNavigator = navigator as unknown as {
      share?: (data: ShareData) => Promise<void>;
      canShare?: (data: ShareData) => boolean;
    };
    const nativeShare = useXWebFallback
      ? undefined
      : shareNavigator.share?.bind(navigator);
    const canShareFiles = Boolean(
      nativeShare && shareNavigator.canShare?.({ files: [file] }),
    );

    setShareFallbackAvailable(false);
    setShareStage('sharing');

    if (!canShareFiles || !nativeShare) {
      setShareStatus('画像を保存して、Xの投稿画面を開いています…');
      shareViaXWeb(shareText, preparedShareImage.blob);
      setShareStage('ready');
      return;
    }

    try {
      setShareStatus('端末の共有画面を開いています…');
      await nativeShare(shareData);
      setShareFallbackAvailable(false);
      setShareStatus('共有が完了しました。');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setShareFallbackAvailable(true);
        setShareStatus(
          '共有がキャンセルされたか、共有画面を開けませんでした。別の方法でも共有できます。',
        );
        return;
      }
      setUseXWebFallback(true);
      setShareFallbackAvailable(false);
      setShareStatus(
        'この端末向けの共有方法に切り替えました。もう一度押すと、画像を保存してXを開きます。',
      );
    } finally {
      setShareStage('ready');
    }
  };

  const shareSite = async () => {
    const shareUrl = new URL(window.location.href);
    shareUrl.search = '';
    shareUrl.hash = '';
    const shareText = `${shareUrl.toString()}\n#MMプロフィール #さんくすちぇるしー`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: '推し活プロフィールメーカー ～Thanks, Chelsea!～',
          text: shareText,
        });
        setSiteShareStatus('共有画面を開きました。');
        return;
      }

      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
        '_blank',
        'noopener,noreferrer',
      );
      setSiteShareStatus('Xの投稿画面を開きました。');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setSiteShareStatus('共有画面を開けませんでした。');
    }
  };

  const renderTextSettings = () => (
    <Card className="settings-card">
      <CardHeader>
        <CardTitle className="section-title">
          <Palette aria-hidden="true" />
          文字の見た目
        </CardTitle>
      </CardHeader>
      <CardContent className="settings-grid">
        <div className="setting-group">
          <p className="setting-heading">すべての文字</p>
          <label className="color-row">
            <span>文字色</span>
            <input
              type="color"
              value={profile.globalStyle.color}
              aria-label="すべての文字色"
              onChange={(event) =>
                updateGlobalStyle('color', event.target.value)
              }
            />
            <code>{profile.globalStyle.color.toUpperCase()}</code>
          </label>
          <label className="size-row">
            <span>文字サイズ</span>
            <strong>{profile.globalStyle.fontSize}px</strong>
          </label>
          <Slider
            min={14}
            max={34}
            step={1}
            value={[profile.globalStyle.fontSize]}
            aria-label="すべての文字サイズ"
            onValueChange={(value) =>
              updateGlobalStyle(
                'fontSize',
                Array.isArray(value) ? value[0] : value,
              )
            }
          />
        </div>

        <div className="setting-group">
          <p className="setting-heading">項目ごとに変える</p>
          <Select
            value={selectedField}
            onValueChange={(value) => setSelectedField(value as TextFieldKey)}
          >
            <SelectTrigger
              className="app-select"
              aria-label="文字設定を変える項目"
            >
              <span data-slot="select-value" className="flex flex-1 text-left">
                {TEXT_FIELD_LABELS[selectedField]}
              </span>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TEXT_FIELD_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="color-row">
            <span>この項目の色</span>
            <input
              type="color"
              value={selectedStyle.color}
              aria-label={`${TEXT_FIELD_LABELS[selectedField]}の文字色`}
              onChange={(event) =>
                updateFieldStyle('color', event.target.value)
              }
            />
            <code>{selectedStyle.color.toUpperCase()}</code>
          </label>
          <label className="size-row">
            <span>この項目のサイズ</span>
            <strong>{selectedStyle.fontSize}px</strong>
          </label>
          <Slider
            min={12}
            max={44}
            step={1}
            value={[selectedStyle.fontSize]}
            aria-label={`${TEXT_FIELD_LABELS[selectedField]}の文字サイズ`}
            onValueChange={(value) =>
              updateFieldStyle(
                'fontSize',
                Array.isArray(value) ? value[0] : value,
              )
            }
          />
          <Button variant="outline" size="lg" onClick={resetFieldStyle}>
            この項目を全体設定に戻す
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const leftForm = (
    <div className="form-stack">
      <section className="form-section" aria-labelledby="basic-profile-heading">
        <h2 id="basic-profile-heading" className="section-title">
          <Heart aria-hidden="true" />
          プロフィール
        </h2>
        <div className="field-stack">
          {leftMainFields.slice(0, 2).map((field) => (
            <AppInput
              key={field.key}
              fieldKey={field.key}
              label={field.label}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              value={profile.values[field.key]}
              onValueChange={updateValue}
              onFocus={setSelectedField}
            />
          ))}

          <Field>
            <FieldLabel htmlFor="birthExtra">誕生日</FieldLabel>
            <div className="birthday-grid">
              <div>
                <span className="mini-label">年・補足</span>
                <Input
                  id="birthExtra"
                  value={profile.values.birthExtra}
                  maxLength={12}
                  placeholder="1998年・ヒミツなど"
                  className="app-input"
                  onFocus={() => setSelectedField('birthExtra')}
                  onChange={(event) =>
                    updateValue('birthExtra', event.target.value)
                  }
                />
              </div>
              <div>
                <span className="mini-label">月</span>
                <Input
                  value={profile.values.birthMonth}
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="4"
                  className="app-input numeric-input"
                  aria-label="誕生月"
                  onFocus={() => setSelectedField('birthMonth')}
                  onChange={(event) =>
                    updateValue(
                      'birthMonth',
                      clampNumberText(event.target.value, 12),
                    )
                  }
                />
              </div>
              <div>
                <span className="mini-label">日</span>
                <Input
                  value={profile.values.birthDay}
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="12"
                  className="app-input numeric-input"
                  aria-label="誕生日の日"
                  onFocus={() => setSelectedField('birthDay')}
                  onChange={(event) =>
                    updateValue(
                      'birthDay',
                      clampNumberText(event.target.value, 31),
                    )
                  }
                />
              </div>
            </div>
          </Field>

          {leftMainFields.slice(2).map((field) => (
            <AppInput
              key={field.key}
              fieldKey={field.key}
              label={field.label}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              value={profile.values[field.key]}
              onValueChange={updateValue}
              onFocus={setSelectedField}
            />
          ))}

          <Field>
            <div className="label-with-count">
              <FieldLabel htmlFor="reason">推しになったきっかけ</FieldLabel>
              <CountHint
                value={profile.values.reason}
                recommended={75}
                lines={3}
              />
            </div>
            <Textarea
              id="reason"
              rows={3}
              value={profile.values.reason}
              placeholder="きっかけや、そのときの思い出など"
              className="app-textarea"
              onFocus={() => setSelectedField('reason')}
              onChange={(event) => updateValue('reason', event.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="form-section" aria-labelledby="favorites-heading">
        <h2 id="favorites-heading" className="section-title">
          <Sparkles aria-hidden="true" />
          好きなもの・思い出
        </h2>
        <div className="field-stack">
          {leftFavoriteFields.map((field) => (
            <AppInput
              key={field.key}
              fieldKey={field.key}
              label={field.label}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              value={profile.values[field.key]}
              onValueChange={updateValue}
              onFocus={setSelectedField}
            />
          ))}
        </div>
      </section>
      {renderTextSettings()}
    </div>
  );

  const rightForm = (
    <div className="form-stack">
      <section className="form-section" aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="section-title">
          <Sparkles aria-hidden="true" />
          わたしの推し活タイプ！
        </h2>
        <p className="section-help">
          星を左右に動かして、今の自分に近い位置を選びます。
        </p>
        <div className="activity-stack">
          {ACTIVITY_TYPES.map((item, index) => {
            const value = profile.activityTypes[index];
            const hint =
              value === 5 ? 'まんなか' : value < 5 ? '左寄り' : '右寄り';
            return (
              <Field
                key={`${item.left}-${item.right}`}
                className="activity-field"
              >
                <div className="activity-labels">
                  <span>{item.left}</span>
                  <span className="activity-hint">{hint}</span>
                  <span>{item.right}</span>
                </div>
                <Slider
                  min={0}
                  max={10}
                  step={1}
                  value={[value]}
                  className="oshi-slider"
                  style={{ '--star-color': item.color } as React.CSSProperties}
                  aria-label={`${item.left}から${item.right}`}
                  onValueChange={(next) => updateActivityType(index, next)}
                />
                <div className="slider-ticks" aria-hidden="true">
                  {Array.from({ length: 11 }, (_, tick) => (
                    <span key={tick} />
                  ))}
                </div>
              </Field>
            );
          })}
        </div>
      </section>

      <section className="form-section" aria-labelledby="member-heading">
        <h2 id="member-heading" className="section-title">
          <Heart aria-hidden="true" />
          モーニング娘。メンバーでたとえると…？
        </h2>
        <p className="section-help">
          現役メンバーを選ぶか、ニックネーム・卒業メンバーなどを自由に入力できます。
        </p>
        <div className="member-grid">
          {memberFields.map(({ key, label }) => (
            <MemberInput
              key={key}
              fieldKey={key}
              label={label}
              value={profile.values[key]}
              onValueChange={updateValue}
              onFocus={setSelectedField}
            />
          ))}
        </div>
        <p className="member-updated">
          現役メンバー：公式サイトを2026年9月4日に確認
        </p>
      </section>

      <section className="form-section" aria-labelledby="message-heading">
        <h2 id="message-heading" className="section-title">
          <Sparkles aria-hidden="true" />
          メッセージ
        </h2>
        <div className="message-grid">
          <Field>
            <div className="label-with-count">
              <FieldLabel htmlFor="message">推しへひとこと</FieldLabel>
              <CountHint
                value={profile.values.message}
                recommended={42}
                lines={3}
              />
            </div>
            <Textarea
              id="message"
              rows={3}
              value={profile.values.message}
              placeholder="推しへの気持ちを自由に"
              className="app-textarea"
              onFocus={() => setSelectedField('message')}
              onChange={(event) => updateValue('message', event.target.value)}
            />
          </Field>
          <Field>
            <div className="label-with-count">
              <FieldLabel htmlFor="freeComment">フリーコメント</FieldLabel>
              <CountHint
                value={profile.values.freeComment}
                recommended={48}
                lines={3}
              />
            </div>
            <Textarea
              id="freeComment"
              rows={3}
              value={profile.values.freeComment}
              placeholder="自己紹介や伝えたいことなど"
              className="app-textarea"
              onFocus={() => setSelectedField('freeComment')}
              onChange={(event) =>
                updateValue('freeComment', event.target.value)
              }
            />
          </Field>
        </div>
      </section>
      {renderTextSettings()}
    </div>
  );

  return (
    <main className="app-root">
      <header className="app-header">
        <div className="title-lockup">
          <span className="title-mark" aria-hidden="true">
            ♡
          </span>
          <div>
            <h1>推し活プロフィールメーカー</h1>
            <p>～Thanks, Chelsea!～</p>
          </div>
        </div>
      </header>

      <p className="privacy-note">
        入力内容はこの端末のブラウザ内だけに自動保存され、サーバーには送信されません。
      </p>

      <Tabs
        value={mobileMode}
        onValueChange={(value) => changeMobileMode(value as MobileMode)}
        className="workspace-tabs"
      >
        <TabsList
          className="mobile-mode-tabs"
          aria-label="入力とプレビューの切り替え"
        >
          <TabsTrigger value="input">入力する</TabsTrigger>
          <TabsTrigger value="preview">できあがり確認</TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="editor-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">入力フォーム</p>
              <h2>好きなところから入力できます</h2>
              <p className="panel-help">すべての項目は空欄でもOKです。</p>
            </div>
          </div>
          <Tabs
            value={editorPage}
            onValueChange={(value) => setEditorPage(value as EditorPage)}
          >
            <TabsList className="page-tabs" aria-label="入力するページ">
              <TabsTrigger value="left">左ページ</TabsTrigger>
              <TabsTrigger value="right">右ページ</TabsTrigger>
            </TabsList>
            <TabsContent value="left">{leftForm}</TabsContent>
            <TabsContent value="right">{rightForm}</TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="preview" className="preview-panel">
          <div className="preview-sticky">
            <div className="panel-heading preview-heading">
              <div>
                <p className="eyebrow">できあがり確認</p>
                <h2>プロフィール画像</h2>
              </div>
              <ImageIcon aria-hidden="true" />
            </div>
            <Tabs
              value={previewView}
              onValueChange={(value) => changePreviewView(value as PreviewView)}
            >
              <TabsList
                className="page-tabs preview-tabs"
                aria-label="確認する画像"
              >
                <TabsTrigger value="left">左</TabsTrigger>
                <TabsTrigger value="right">右</TabsTrigger>
                <TabsTrigger value="spread">見開き</TabsTrigger>
              </TabsList>
              <TabsContent value={previewView}>
                <ProfileCanvas
                  ref={canvasRef}
                  profile={profile}
                  view={previewView}
                />
              </TabsContent>
            </Tabs>

            <div className="export-card">
              <p className="export-title">PNG画像を保存</p>
              <div className="download-grid">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => download('left')}
                >
                  <Download aria-hidden="true" />
                  左ページ
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => download('right')}
                >
                  <Download aria-hidden="true" />
                  右ページ
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => download('spread')}
                >
                  <Download aria-hidden="true" />
                  見開き
                </Button>
              </div>
              <Button
                className="share-button"
                size="lg"
                aria-describedby="share-status"
                disabled={
                  shareStage === 'preparing' ||
                  shareStage === 'sharing' ||
                  (shareStage !== 'error' && !preparedShareImage)
                }
                onClick={shareToX}
              >
                {shareStage === 'preparing' ||
                (shareStage === 'idle' && !preparedShareImage) ? (
                  <>
                    <LoaderCircle
                      className="share-spinner"
                      aria-hidden="true"
                    />
                    共有用画像を準備中…
                  </>
                ) : shareStage === 'sharing' ? (
                  <>
                    <LoaderCircle
                      className="share-spinner"
                      aria-hidden="true"
                    />
                    共有画面を開いています…
                  </>
                ) : (
                  <>
                    <Share2 aria-hidden="true" />
                    {shareStage === 'error'
                      ? '共有用画像を再準備'
                      : useXWebFallback
                        ? '画像を保存してXを開く'
                        : '表示中の画像をXで共有'}
                  </>
                )}
              </Button>
              {shareFallbackAvailable && !useXWebFallback ? (
                <Button
                  variant="outline"
                  size="lg"
                  className="share-fallback-button"
                  disabled={shareStage !== 'ready'}
                  onClick={shareCurrentImageViaXWeb}
                >
                  <Download aria-hidden="true" />
                  画像を保存してXを開く
                </Button>
              ) : null}
              <output
                id="share-status"
                className="status-message"
                aria-live="polite"
              >
                {shareStatus}
              </output>
            </div>

            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="ghost" size="lg" className="reset-button" />
                }
              >
                <RotateCcw aria-hidden="true" />
                入力内容をすべて消す
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    入力内容をすべて消しますか？
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    文字、スライダー、文字設定が初期状態に戻ります。この操作は元に戻せません。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={resetAll}>
                    すべて消す
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <output className="status-message" aria-live="polite">
              {status}
            </output>
          </div>
        </TabsContent>
      </Tabs>

      <footer className="app-footer">
        <Button
          variant="outline"
          size="lg"
          className="site-share-button"
          onClick={shareSite}
        >
          <Share2 aria-hidden="true" />
          このサイトをシェアする
        </Button>
        <output className="footer-status" aria-live="polite">
          {siteShareStatus}
        </output>
        <p>
          作った人：
          <a
            href="https://x.com/ikegami1000001h"
            target="_blank"
            rel="noopener noreferrer"
          >
            いけがみ（X）
          </a>
        </p>
      </footer>
    </main>
  );
}
