import { useEffect, useState } from 'react';
import { Download, X, Sparkles, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tenantConfig } from '@/config/tenantConfig';
// Helper component for Safari Share Icon
function SafariShareIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect x="5" y="12" width="14" height="10" rx="2" />
      <path d="M12 15V3" />
      <path d="m9 6 3-3 3 3" />
    </svg>
  );
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // 1. Handle standard PWA prompt event (Chrome, Edge, Samsung, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 2. Check if already running in standalone mode (installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (navigator as any).standalone === true;

    if (isStandalone) {
      setIsVisible(false);
      setShowIOSPrompt(false);
      return;
    }

    // 3. Apple iOS specific handling (iOS does not support beforeinstallprompt)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isDismissed = localStorage.getItem('pwa_ios_prompt_dismissed') === 'true';

    if (isIOS && !isStandalone && !isDismissed) {
      // Delay prompt by 3 seconds for a premium and non-intrusive feel
      const timer = setTimeout(() => {
        setShowIOSPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleIOSDismiss = () => {
    setShowIOSPrompt(false);
    localStorage.setItem('pwa_ios_prompt_dismissed', 'true');
  };

  // Render iOS Safari Prompt
  if (showIOSPrompt) {
    return (
      <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-80 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="bg-card/95 backdrop-blur-md rounded-2xl border border-border shadow-2xl p-4 flex flex-col gap-3 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-colors duration-500" />
          
          <button 
            onClick={handleIOSDismiss} 
            className="absolute top-2.5 right-2.5 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X size={14} />
          </button>

          <div className="flex gap-3 items-start pr-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">Add to Home Screen</h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed text-pretty">
                Install **{tenantConfig.appName}** on your iPhone for full screen access, fast orders, and offline support!
              </p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-xl p-3 border border-border/60 space-y-2.5 text-xs text-foreground/90">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-background flex items-center justify-center border border-border shrink-0">
                <SafariShareIcon className="w-3.5 h-3.5 text-foreground/80" />
              </div>
              <span>1. Tap the <strong>Share</strong> button in Safari</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-background flex items-center justify-center border border-border shrink-0 font-bold text-[10px]">
                ＋
              </div>
              <span>2. Scroll down & select <strong>Add to Home Screen</strong></span>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button 
              size="sm" 
              onClick={handleIOSDismiss}
              className="text-xs h-8 bg-primary text-primary-foreground font-semibold px-4 shadow-sm hover:shadow-md transition-all duration-300 w-full"
            >
              Got it!
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render Standard Android / Desktop PWA Prompt
  if (!isVisible || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-80 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-card/90 backdrop-blur-md rounded-2xl border border-border shadow-2xl p-4 flex flex-col gap-3 relative overflow-hidden group">
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-colors duration-500" />
        
        <button 
          onClick={handleDismiss} 
          className="absolute top-2 right-2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X size={14} />
        </button>

        <div className="flex gap-3 items-start pr-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-foreground">Install {tenantConfig.appName}</h4>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed text-pretty">
              Add to your home screen for quick ordering, instant notifications, and offline access!
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="text-xs h-8"
          >
            Not now
          </Button>
          <Button 
            size="sm" 
            onClick={handleInstallClick}
            className="text-xs h-8 gap-1.5 bg-gradient-to-r from-primary to-amber-600 text-primary-foreground font-medium shadow-sm hover:shadow-md transition-all duration-300"
          >
            <Download size={13} />
            Install App
          </Button>
        </div>
      </div>
    </div>
  );
}
