import { protectedRoutesConsts } from '../constants/protectedRoutes';
export const isProtectedRoute = (path: string): boolean => {
  const staticProtectedRoutes = [
    ...protectedRoutesConsts
  ];

  // Check if the path is in static protected routes
  if (staticProtectedRoutes.includes(path)) {
    return true;
  }

  // Check for dynamic routes: "/:id/view" and "/channel/:id/view"
  const dynamicRoutePatterns = [
    /^\/[^/]+\/view$/,           // matches /:id/view
    /^\/channel\/[^/]+\/view$/   // matches /channel/:id/view
  ];

  if (dynamicRoutePatterns.some(pattern => pattern.test(path))) {
    return true;
  }

  return false;
};
