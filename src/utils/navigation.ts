import { router } from "expo-router";

export const handleSmartBack = (pathname: string) => {
  if (router.canGoBack()) {
    router.back();
  } else {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 1) {
      const parentPath = "/" + segments.slice(0, -1).join("/");
      router.replace(parentPath as any);
    } else {
      router.replace("/" as any);
    }
  }
};
