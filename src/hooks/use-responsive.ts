import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  
  const guidelineBaseWidth = 375;
  const isTablet = width >= 768;
  const effectiveWidth = Math.min(width, 500); // Caps scaling on tablets
  
  const s = (size: number) => (effectiveWidth / guidelineBaseWidth) * size;
  
  const ms = (size: number, factor = isTablet ? 0.3 : 0.5) => {
    return size + (s(size) - size) * factor;
  };

  const wp = (percentage: number) => (percentage * width) / 100;
  const hp = (percentage: number) => (percentage * height) / 100;

  return { s, ms, wp, hp, width, height };
}
