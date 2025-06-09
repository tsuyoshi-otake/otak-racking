import React, { useState, useCallback } from 'react';
import { Share2, Check } from 'lucide-react';
import { generateShareUrl, createShareableData } from '../utils/shareUtils';

interface ShareButtonProps {
  racks: Record<string, any>;
  floorSettings: any;
  selectedRack: string;
  activeViewMode: string | null;
  rackViewPerspective: any;
  isProMode: boolean;
  zoomLevel: number;
  onShowModal: (title: string, message: string) => void;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  racks,
  floorSettings,
  selectedRack,
  activeViewMode,
  rackViewPerspective,
  isProMode,
  zoomLevel,
  onShowModal
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    setIsSharing(true);
    
    try {
      const shareableData = createShareableData(
        racks,
        floorSettings,
        selectedRack,
        activeViewMode,
        rackViewPerspective,
        isProMode,
        zoomLevel
      );

      const result = generateShareUrl(shareableData);

      if (result.success && result.url) {
        // URLをクリップボードにコピー
        await navigator.clipboard.writeText(result.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);

        onShowModal(
          '共有URLを生成しました',
          `URLがクリップボードにコピーされました。\n\n圧縮率: ${result.stats?.ratio.toFixed(1)}%\n元サイズ: ${result.stats?.original}文字\n圧縮後: ${result.stats?.compressed}文字`
        );
      } else {
        onShowModal('共有エラー', result.error || '不明なエラーが発生しました');
      }
    } catch (error) {
      onShowModal('共有エラー', 'URLの生成中にエラーが発生しました');
    } finally {
      setIsSharing(false);
    }
  }, [racks, floorSettings, selectedRack, activeViewMode, rackViewPerspective, isProMode, zoomLevel, onShowModal]);

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 focus:outline-none disabled:opacity-50"
      title={isSharing ? '共有URL生成中...' : copied ? 'URLをコピーしました' : '現在の設計を共有'}
    >
      {isSharing ? (
        <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full" />
      ) : copied ? (
        <Check size={20} />
      ) : (
        <Share2 size={20} />
      )}
    </button>
  );
};