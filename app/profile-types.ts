export type TextFieldKey =
  | 'name'
  | 'account'
  | 'birthExtra'
  | 'birthMonth'
  | 'birthDay'
  | 'area'
  | 'oshi'
  | 'oshiGroup'
  | 'history'
  | 'reason'
  | 'memoryVenue'
  | 'favoriteEvent'
  | 'favoriteCostume'
  | 'favoriteMv'
  | 'favoriteSong'
  | 'memberHealing'
  | 'memberReliable'
  | 'memberMoodMaker'
  | 'memberCaptivating'
  | 'memberGap'
  | 'memberFashionable'
  | 'memberNatural'
  | 'memberFriend'
  | 'message'
  | 'freeComment';

export type ProfileValues = Record<TextFieldKey, string>;

export type TextStyle = {
  color: string;
  fontSize: number;
};

export type ProfileState = {
  values: ProfileValues;
  activityTypes: number[];
  globalStyle: TextStyle;
  fieldStyles: Partial<Record<TextFieldKey, Partial<TextStyle>>>;
};

export type PreviewView = 'spread' | 'left' | 'right';

export const PROFILE_STORAGE_KEY = 'mm-profile-maker:v1';

export const EMPTY_VALUES: ProfileValues = {
  name: '',
  account: '',
  birthExtra: '',
  birthMonth: '',
  birthDay: '',
  area: '',
  oshi: '',
  oshiGroup: '',
  history: '',
  reason: '',
  memoryVenue: '',
  favoriteEvent: '',
  favoriteCostume: '',
  favoriteMv: '',
  favoriteSong: '',
  memberHealing: '',
  memberReliable: '',
  memberMoodMaker: '',
  memberCaptivating: '',
  memberGap: '',
  memberFashionable: '',
  memberNatural: '',
  memberFriend: '',
  message: '',
  freeComment: '',
};

export const INITIAL_STATE: ProfileState = {
  values: EMPTY_VALUES,
  activityTypes: Array(9).fill(5),
  globalStyle: {
    color: '#48143f',
    fontSize: 22,
  },
  fieldStyles: {},
};

export const TEXT_FIELD_LABELS: Record<TextFieldKey, string> = {
  name: '名前',
  account: 'アカウント名',
  birthExtra: '誕生日（年・補足）',
  birthMonth: '誕生日（月）',
  birthDay: '誕生日（日）',
  area: '住んでいるエリア',
  oshi: '推し',
  oshiGroup: '推しグループ',
  history: '推し遍歴',
  reason: '推しになったきっかけ',
  memoryVenue: '思い出の現場',
  favoriteEvent: '一番好きなコンサート・イベント',
  favoriteCostume: '一番好きな衣装',
  favoriteMv: '一番好きなMV',
  favoriteSong: '一番好きな曲',
  memberHealing: '癒し系といえば？',
  memberReliable: 'しっかり者といえば？',
  memberMoodMaker: 'ムードメーカーといえば？',
  memberCaptivating: '沼らせ上手といえば？',
  memberGap: 'ギャップ王といえば？',
  memberFashionable: 'おしゃれといえば？',
  memberNatural: '天然といえば？',
  memberFriend: '親友になりたいメンバーといえば？',
  message: '推しへひとこと',
  freeComment: 'フリーコメント',
};

export const CURRENT_MEMBERS = [
  '野中美希',
  '小田さくら',
  '岡村ほまれ',
  '山﨑愛生',
  '櫻井梨央',
  '井上春華',
  '弓桁朱琴',
  '杉原明紗',
  '安田美結',
  '鈴木もあ',
  '石川華望',
] as const;

export const ACTIVITY_TYPES = [
  { left: '前方派', right: '後方派', color: '#f55c9d' },
  { left: 'ライブ派', right: 'イベント派', color: '#a98add' },
  { left: '現場派', right: '在宅派', color: '#8cbce8' },
  { left: 'ソロ推し', right: '箱推し', color: '#f2a064' },
  { left: 'ペンライト全力', right: 'じっくり見る派', color: '#a9c86e' },
  { left: 'コールする派', right: '見守る派', color: '#eb5a97' },
  { left: '積極的に交流派', right: 'ひっそり応援派', color: '#d870ae' },
  { left: '遠征派', right: '地元中心派', color: '#f09a63' },
  { left: '認知されたい派', right: 'ひっそり応援派', color: '#eb5a97' },
] as const;

export const LEFT_FIELDS: TextFieldKey[] = [
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

export const MEMBER_FIELDS: TextFieldKey[] = [
  'memberHealing',
  'memberReliable',
  'memberMoodMaker',
  'memberCaptivating',
  'memberGap',
  'memberFashionable',
  'memberNatural',
  'memberFriend',
];
