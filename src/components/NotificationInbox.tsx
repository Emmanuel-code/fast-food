import { Inbox } from '@novu/react';
import { useAuth } from '@/contexts/AuthContext';

export function NotificationInbox() {
  const { user } = useAuth();
  
  // Use Vite's environment variable syntax
  const applicationIdentifier = import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER || '5AtAn831vdaP';
  
  if (!applicationIdentifier) {
    console.warn('Novu application identifier is not defined');
    return null;
  }

  // Primary: use authenticated user ID
  // Fallback: provided subscriberId as requested in requirements
  const subscriberId = user?.id || '6a1a6f4c7d1fd5d55dc5b6ea';

  return (
    <Inbox
      applicationIdentifier={applicationIdentifier}
      subscriberId={subscriberId}
      appearance={{
        variables: {
          colorPrimary: 'hsl(var(--primary))',
          colorPrimaryForeground: 'hsl(var(--primary-foreground))',
          colorSecondary: 'hsl(var(--secondary))',
          colorSecondaryForeground: 'hsl(var(--secondary-foreground))',
          colorBackground: 'hsl(var(--card))',
          colorForeground: 'hsl(var(--foreground))',
          colorNeutral: 'hsl(var(--border))',
          colorRing: 'hsl(var(--ring))',
          colorShadow: 'var(--shadow-card)',
          // Counter matches primary color or a distinct notification color if available
          colorCounter: 'hsl(var(--destructive))',
          colorCounterForeground: 'hsl(var(--destructive-foreground))',
        },
        elements: {
          bellIcon: {
            color: 'hsl(var(--foreground))',
          },
        },
      }}
    />
  );
}
