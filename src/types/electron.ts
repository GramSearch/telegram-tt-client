export enum ElectronEvent {
  FULLSCREEN_CHANGE = 'fullscreen-change',
  UPDATE_ERROR = 'update-error',
  UPDATE_AVAILABLE = 'update-available',
  DEEPLINK = 'deeplink',
  SEARCH_CORE_MESSAGE = 'search-core-message',
}

export enum ElectronAction {
  GET_IS_FULLSCREEN = 'get-is-fullscreen',
  INSTALL_UPDATE = 'install-update',
  HANDLE_DOUBLE_CLICK = 'handle-double-click',
  OPEN_NEW_WINDOW = 'open-new-window',
  SET_WINDOW_TITLE = 'set-window-title',
  SET_TRAFFIC_LIGHT_POSITION = 'set-traffic-light-position',
  SET_IS_AUTO_UPDATE_ENABLED = 'set-is-auto-update-enabled',
  GET_IS_AUTO_UPDATE_ENABLED = 'get-is-auto-update-enabled',
  SET_IS_TRAY_ICON_ENABLED = 'set-is-tray-icon-enabled',
  GET_IS_TRAY_ICON_ENABLED = 'get-is-tray-icon-enabled',
  RESTORE_LOCAL_STORAGE = 'restore-local-storage',
  SEND_TO_SEARCH_CORE = 'send-to-search-core',
}

export type TrafficLightPosition = 'standard' | 'lowered';

// Re-export types from @tg-search/core and @tg-search/common for type safety
// Use core package types instead of redefining them

// Specific message interface for our IPC layer
export interface SearchCoreIPCMessage {
  type: string;
  payload?: unknown;
  data?: unknown;
}

// Message validation helper types
export interface MessageProcessIPCPayload {
  messages: import('../api/types').ApiMessage[];
}

export interface SearchMessagesIPCPayload {
  chatId: string;
  content: string;
  useVector?: boolean;
}

// Type-safe event callback
export type SearchCoreEventCallback = (message: SearchCoreIPCMessage) => void;

export interface ElectronApi {
  isFullscreen: () => Promise<boolean>;
  installUpdate: () => Promise<void>;
  handleDoubleClick: () => Promise<void>;
  openNewWindow: (url: string, title?: string) => Promise<void>;
  setWindowTitle: (title?: string) => Promise<void>;
  setTrafficLightPosition: (position: TrafficLightPosition) => Promise<void>;
  setIsAutoUpdateEnabled: (value: boolean) => Promise<void>;
  getIsAutoUpdateEnabled: () => Promise<boolean>;
  setIsTrayIconEnabled: (value: boolean) => Promise<void>;
  getIsTrayIconEnabled: () => Promise<boolean>;
  restoreLocalStorage: () => Promise<void>;
  sendToSearchCore: (message: SearchCoreIPCMessage) => void;
  on: (eventName: ElectronEvent, callback: SearchCoreEventCallback) => VoidFunction;
}

declare global {
  interface Window {
    electron?: ElectronApi;
  }
}
