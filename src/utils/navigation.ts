import { router } from 'expo-router';

/**
 * Handles smart back navigation.
 * If history exists, goes back.
 * Otherwise, calculates the parent path from the current URL and replaces it.
 */
export const handleSmartBack = (pathname: string) => {
  if (router.canGoBack()) {
    router.back();
  } else {
    // Logic to go to parent path
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 1) {
      const parentPath = '/' + segments.slice(0, -1).join('/');
      router.replace(parentPath as any);
    } else {
      // Fallback to home
      router.replace('/' as any);
    }
  }
};
