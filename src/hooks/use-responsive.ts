import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const guidelineBaseWidth = 375;
  const isWeb = typeof window !== 'undefined' && window.navigator && window.navigator.userAgent;
  const isTablet = width >= 768 || isWeb;
  
  // Limit extreme scaling, creating a 1.2x global zoom compared to 500px mobile logic
  const effectiveWidth = isTablet ? Math.min(width, 680) : Math.min(width, 500);

  const s = (size: number) => (effectiveWidth / guidelineBaseWidth) * size;

  const ms = (size: number, factor = isTablet ? 0.25 : 0.5) => {
    return size + (s(size) - size) * factor;
  };

  const wp = (percentage: number) => (percentage * width) / 100;
  const hp = (percentage: number) => (percentage * height) / 100;

  return { s, ms, wp, hp, width, height, isTablet, isWeb };
}
