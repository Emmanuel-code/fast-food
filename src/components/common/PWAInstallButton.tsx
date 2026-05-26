import { useEffect, useState } from 'react';
import { Download, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also check if app is already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, discard it
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-80 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-card/90 backdrop-blur-md rounded-2xl border border-border shadow-2xl p-4 flex flex-col gap-3 relative overflow-hidden group">
        {/* Subtle decorative elements */}
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
            <h4 className="font-semibold text-sm text-foreground">Install Chef's Kitchen</h4>
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
