import { useEffect } from 'react';
import { tenantConfig } from '@/config/tenantConfig';

export function ThemeInjector() {
  useEffect(() => {
    const root = document.documentElement;
    const { theme } = tenantConfig;

    // Map theme object to CSS custom properties
    const cssVars = {
      '--primary': theme.primary,
      '--primary-foreground': theme.primaryForeground,
      '--background': theme.background,
      '--foreground': theme.foreground,
      '--card': theme.card,
      '--card-foreground': theme.cardForeground,
      '--ring': theme.ring,
      '--sidebar-background': theme.sidebarBackground,
      '--sidebar-foreground': theme.sidebarForeground,
      '--sidebar-primary': theme.sidebarPrimary,
      '--sidebar-primary-foreground': theme.sidebarPrimaryForeground,
      '--sidebar-accent': theme.sidebarAccent,
      '--sidebar-accent-foreground': theme.sidebarAccentForeground,
      '--sidebar-border': theme.sidebarBorder,
      '--sidebar-ring': theme.sidebarRing,
    };

    // Apply variables to root
    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Update document title
    document.title = tenantConfig.appName;

  }, []);

  return null;
}
