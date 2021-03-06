import './index.css';

export { Roster } from './roster';

export { RosterTable, InfiniteScrollRosterTable } from './table';

export type Operation =
  | 'podium'
  | 'grant-board'
  | 'camera'
  | 'microphone'
  | 'kick'
  | 'chat'
  | 'star';

export type Operations = Partial<Record<Operation, { interactable: boolean }>>;

export type SupportedFunction = 'carousel' | 'search' | 'kick' | 'grant-board' | 'podium' | 'stars';

export type ColumnKey =
  | 'name'
  | 'isOnPodium'
  | 'isBoardGranted'
  | 'isChatMuted'
  | 'cameraState'
  | 'microphoneState'
  | 'stars'
  | 'kick';

export type Column = {
  key: ColumnKey;
  order: number;
  name: string;
  render: (profile: Profile, hovered: boolean) => JSX.Element;
  operation?: Operation;
  width?: number | string;
};

export enum DeviceState {
  // published
  enabled,
  // unpublished
  disabled,
  // not on podium
  unavailable,
  // on podium but device is unauthorized
  unauthorized,
}

export const cameraIconType = {
  [DeviceState.enabled]: 'camera-enabled',
  [DeviceState.disabled]: 'camera-disabled',
  [DeviceState.unavailable]: 'camera-inactive',
  [DeviceState.unauthorized]: 'camera-forbidden',
};

export const microphoneIconType = {
  [DeviceState.enabled]: 'mic-enabled',
  [DeviceState.disabled]: 'mic-disabled',
  [DeviceState.unavailable]: 'mic-inactive',
  [DeviceState.unauthorized]: 'mic-forbidden',
};
export enum BoardGrantState {
  Disabled = 'board-grant-disabled',
  Granted = 'board-granted',
  NotGranted = 'board-not-granted',
}
export const BoardGrantIconType = {
  [BoardGrantState.Disabled]: 'board-grant-disabled',
  [BoardGrantState.Granted]: 'board-granted',
  [BoardGrantState.NotGranted]: 'board-not-granted',
};
export type Profile = {
  uid: string | number;
  name: string;
  isOnPodium: boolean;
  boardGrantState: BoardGrantState;
  isChatMuted: boolean;
  cameraState: DeviceState;
  microphoneState: DeviceState;
  stars: number;
  operations: Operations;
};

export type CarouselProps = {
  times: string;
  isOpenCarousel: boolean;
  mode: string;
  randomValue: string;
  onTimesChange: (times: string, eventType: 'change' | 'blur') => void;
  onOpenCarousel: (isOpen: boolean) => void;
  onModeChange: (mode: string) => void;
  onRandomValueChange: (randomValue: string) => void;
};

export type RosterProps = {
  /**
   * ????????????
   */
  width?: number;
  /**
   * ????????????
   */
  hostname: string;
  /**
   * ?????????????????????
   */
  carouselProps: CarouselProps;
  /**
   * ????????????
   */
  functions?: Array<SupportedFunction>;
  /**
   * ???????????????????????????
   */
  onClose: () => void;
  /**
   * ???????????????
   */
  keyword: string;
  /**
   * ?????????????????????
   */
  onKeywordChange: (evt: any) => void;
  /**
   * ??????
   */
  title?: string;

  /**
   * ????????????????????????dom???class
   */
  bounds?: string;

  children?: React.ReactNode;
};
