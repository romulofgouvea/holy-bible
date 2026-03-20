import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  
  const guidelineBaseWidth = 375;
  
  const s = (size: number) => (width / guidelineBaseWidth) * size;
  
  const ms = (size: number, factor = 0.5) => {
    return size + (s(size) - size) * factor;
  };

  const wp = (percentage: number) => (percentage * width) / 100;
  const hp = (percentage: number) => (percentage * height) / 100;

  return { s, ms, wp, hp, width, height };
}
