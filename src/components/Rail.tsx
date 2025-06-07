import React from 'react';
import { Rack, RailInstallation } from '../types';

interface RailProps {
  rack: Rack;
  rail: RailInstallation;
  unitHeight: number;
  zoomLevel: number;
  rackWidth: number;
  totalUnits: number;
  darkMode: boolean;
}

/**
 * このコンポーネントはレール設置のロジックをトリガーするために存在しますが、
 * 視覚的な表現は MountingHoles.tsx が担当します。
 * そのため、このコンポーネントは何もレンダリングしません。
 */
export const Rail: React.FC<RailProps> = () => {
  return <></>;
};