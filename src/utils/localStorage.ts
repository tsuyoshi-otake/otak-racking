// LocalStorage操作のユーティリティ
export interface AppState {
  darkMode: boolean;
  zoomLevel: number;
  selectedRack: string;
  activeViewMode: string | null;
  rackViewPerspective: 'front' | 'rear' | 'left' | 'right';
  racks: Record<string, any>;
  floorSettings: {
    hasAccessFloor: boolean;
    floorHeight: number;
    tileSize: number;
    supportType: 'adjustable' | 'fixed' | 'string';
    loadCapacity: 'light' | 'medium' | 'heavy';
    cableRouting: {
      power: 'underfloor' | 'overhead' | 'side';
      data: 'underfloor' | 'overhead' | 'side';
      fiber: 'underfloor' | 'overhead' | 'side';
    };
  };
}

const STORAGE_KEY = 'otak-racking-app-state';
const STORAGE_VERSION = '1.0.0';

// デフォルト状態
export const DEFAULT_APP_STATE: Partial<AppState> = {
  darkMode: false,
  zoomLevel: 100,
  activeViewMode: null,
  rackViewPerspective: 'front',
  floorSettings: {
    hasAccessFloor: true,
    floorHeight: 600,
    tileSize: 600,
    supportType: 'adjustable',
    loadCapacity: 'heavy',
    cableRouting: {
      power: 'underfloor',
      data: 'underfloor',
      fiber: 'overhead'
    }
  }
};

// LocalStorageから状態を読み込み
export const loadAppState = (): Partial<AppState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      console.log('アプリ状態が見つかりません。デフォルト状態を使用します。');
      return DEFAULT_APP_STATE;
    }

    const parsed = JSON.parse(stored);
    
    // バージョンチェック
    if (parsed.version !== STORAGE_VERSION) {
      console.log(`アプリ状態のバージョンが異なります (保存済み: ${parsed.version}, 現在: ${STORAGE_VERSION})。デフォルト状態を使用します。`);
      return DEFAULT_APP_STATE;
    }

    // データの検証
    if (!parsed.data || typeof parsed.data !== 'object') {
      console.warn('保存されたアプリ状態が無効です。デフォルト状態を使用します。');
      return DEFAULT_APP_STATE;
    }

    // 既存のラックデータに新しいプロパティを追加
    if (parsed.data.racks) {
      Object.keys(parsed.data.racks).forEach(rackId => {
        const rack = parsed.data.racks[rackId];
        if (!rack.pduPlacements) {
          rack.pduPlacements = [];
        }
        if (!rack.railInstallations) {
          rack.railInstallations = {};
        }
      });
    }

    console.log('アプリ状態を正常に読み込みました。');
    return {
      ...DEFAULT_APP_STATE,
      ...parsed.data
    };
  } catch (error) {
    console.error('アプリ状態の読み込み中にエラーが発生しました:', error);
    return DEFAULT_APP_STATE;
  }
};

// LocalStorageに状態を保存
export const saveAppState = (state: Partial<AppState>): void => {
  try {
    const dataToSave = {
      version: STORAGE_VERSION,
      timestamp: new Date().toISOString(),
      data: state
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    console.log('アプリ状態を正常に保存しました。');
  } catch (error) {
    console.error('アプリ状態の保存中にエラーが発生しました:', error);
    
    // localStorage容量不足の場合
    if (error instanceof DOMException && error.code === 22) {
      console.warn('LocalStorageの容量が不足しています。古いデータを削除して再試行します。');
      try {
        // 古いデータを削除して再試行
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          version: STORAGE_VERSION,
          timestamp: new Date().toISOString(),
          data: state
        }));
        console.log('容量不足後の再保存が成功しました。');
      } catch (retryError) {
        console.error('再保存も失敗しました:', retryError);
      }
    }
  }
};

// LocalStorageをクリア
export const clearAppState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('アプリ状態を削除しました。');
  } catch (error) {
    console.error('アプリ状態の削除中にエラーが発生しました:', error);
  }
};

// デバッグ用：保存されているデータのサイズを表示
export const getStorageSize = (): string => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return '0 bytes';
    
    const sizeInBytes = stored.length;
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} bytes`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  } catch (error) {
    console.error('ストレージサイズの取得中にエラーが発生しました:', error);
    return 'unknown';
  }
};

// 保存されたデータの情報を取得
export const getStorageInfo = (): { exists: boolean; timestamp?: string; version?: string; size?: number } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { exists: false };
    }

    const parsed = JSON.parse(stored);
    return {
      exists: true,
      timestamp: parsed.timestamp,
      version: parsed.version,
      size: stored.length
    };
  } catch (error) {
    console.error('ストレージ情報の取得中にエラーが発生しました:', error);
    return { exists: false };
  }
};
