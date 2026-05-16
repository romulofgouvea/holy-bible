import { useCallback, useEffect, useState } from 'react';
import { HistoryItem } from './useHistory';

export function useNavigationHistory() {
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Logic for navigation history
  }, []);

  return {
    canGoBack,
    setCanGoBack
  };
}
