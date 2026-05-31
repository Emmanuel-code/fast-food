import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { 
  ChefHat, 
  LogIn, 
  ArrowRight, 
  Clock, 
  Sparkles, 
  Smartphone, 
  Smile, 
  CheckCircle2, 
  MapPin, 
  ChevronRight,
  UtensilsCrossed,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/timeSlots';
import { tenantConfig } from '@/config/tenantConfig';

export default function Landing() {
  const { user, profile } = useAuth();
  const { settings, isOpen } = useRestaurant();
  const navigate = useNavigate();

  const getRoleRoute = (role: string) => {
    if (role === 'worker') return '/kitchen';
    if (role === 'manager' || role === 'admin') return '/dashboard';
    return '/menu';
  };

  const handleCTAClick = () => {
    if (user && profile) {
      navigate(getRoleRoute(profile.role));
    } else {
      navigate('/menu');
    }
  };

  const featuredItems = [
    {
      name: "Special Jollof Rice",
      description: "Jollof rice cooked with fresh natural ingredients and spices. Served with grilled chicken, fried plantain and salad.",
      price: 25.99,
      image: "https://i.pinimg.com/736x/35/80/d4/3580d49461d07077313489b2323ec957.jpg",
      dietary: ["Hot Seller"],
    },
    {
      name: "Elous Pizza",
      description: "Our signature golden pizza made with fresh ingredients and spices.",
      price: 6.99,
      image: "https://i.pinimg.com/736x/d9/cb/5f/d9cb5fb5c6d0d7d3dc6f9a2926f47100.jpg",
      dietary: ["Vegetarian"],
    },
    {
      name: "special Banku",
      description: "homemade banku made with any soup of your choice, grilled tilapia or chicken,  fresh pepper and onions and side salad",
      price: 14.99,
      image: "https://i.pinimg.com/1200x/d4/b7/f4/d4b7f484155fbdfabafb096ffe03ea96.jpg",
      dietary: ["Combo Value"],
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {/* Sticky Premium Navbar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-card hover:scale-105 transition-transform">
              <ChefHat size={22} />
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-foreground">{tenantConfig.appName}</span>
              <div className="flex items-center gap-1 sm:hidden">
                <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
                <span className="text-[10px] text-muted-foreground">{isOpen ? 'Open Now' : 'Closed'}</span>
              </div>
            </div>
          </div>

          {/* Center Info Badge (Hidden on mobile) */}
          <div className="hidden sm:flex items-center gap-3 bg-muted/50 border border-border px-4 py-1.5 rounded-full text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
              {isOpen ? 'Cooking Live Now' : 'Closed for Today'}
            </span>
            <span className="w-px h-3 bg-border" />
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {settings?.prep_time_estimate_minutes ?? 15} Mins Est.
            </span>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            {user && profile ? (
              <div className="flex items-center gap-3">
                <span className="hidden md:inline text-sm text-muted-foreground font-medium">
                  Welcome, <span className="text-foreground font-semibold">{profile.name?.split(' ')[0] || 'there'}</span> 👋
                </span>
                <Button
                  onClick={handleCTAClick}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-full shadow-card flex items-center gap-1.5 text-xs sm:text-sm hover:translate-y-[-1px] active:translate-y-[0px] transition-all"
                >
                  Go to App
                  <ChevronRight size={16} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="font-bold text-muted-foreground hover:text-foreground text-xs sm:text-sm px-3 sm:px-4 flex items-center gap-1.5 rounded-full hover:bg-muted"
                >
                  <LogIn size={15} />
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate('/menu')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-extrabold px-4 sm:px-6 rounded-full shadow-card text-xs sm:text-sm flex items-center gap-1 hover:translate-y-[-1px] transition-all"
                >
                  Order Now
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Glow/Light Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Hero Text details */}
            <div className="lg:col-span-7 space-y-6 md:space-y-8 text-center lg:text-left">
              {/* Dynamic Closed/Open Notification Banner */}
              <div className="inline-flex items-center gap-2.5 bg-primary/10 text-primary-foreground border border-primary/20 px-4 py-2 rounded-full text-xs font-semibold shadow-sm animate-fade-in mx-auto lg:mx-0">
                <Sparkles size={14} className="text-primary animate-spin" style={{ animationDuration: '3s' }} />
                <span>Gourmet fast food crafted with obsession</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground tracking-tight leading-tight">
                Savor Gastronomy, <br />
                <span className="bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
                  Made with Love
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal text-pretty">
                Fast-food, re-engineered for the modern foodie, satisfing your cravings in every way and giving you pleasure in our home made dishes.             </p>

              {/* Statistics Grid */}
              <div className="grid grid-cols-3 gap-4 py-4 max-w-md mx-auto lg:mx-0 border-y border-border/60">
                <div className="text-center lg:text-left">
                  <p className="text-xl sm:text-2xl font-black text-primary">4.9 ★</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Rating</p>
                </div>
                <div className="text-center lg:text-left border-x border-border">
                  <p className="text-xl sm:text-2xl font-black text-foreground">~15m</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Prep Time</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-xl sm:text-2xl font-black text-foreground">100%</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Freshness</p>
                </div>
              </div>

              {/* Call-To-Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  onClick={handleCTAClick}
                  className="h-12 sm:h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-extrabold px-8 sm:px-10 rounded-full text-base shadow-lg group hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                >
                  {user ? 'Go to Menu' : 'Browse Full Menu'}
                  <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/location')}
                  className="h-12 sm:h-14 font-extrabold px-8 sm:px-10 border-2 rounded-full text-base bg-card hover:bg-muted text-foreground flex items-center justify-center gap-2"
                >
                  <MapPin size={18} className="text-primary" />
                  Find Us
                </Button>
              </div>
            </div>

            {/* Hero Image Mockup Area */}
            <div className="lg:col-span-5 relative flex justify-center">
              {/* Floating aesthetic backing cards */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] aspect-square rounded-[3rem] bg-gradient-to-tr from-primary/10 to-orange-500/5 rotate-12 blur-2xl pointer-events-none" />

              <div className="relative w-full max-w-sm sm:max-w-md aspect-[4/5] bg-card rounded-[2.5rem] border border-border shadow-card overflow-hidden p-3 hover:shadow-hover hover:scale-[1.01] transition-all duration-500">
                <div className="w-full h-full rounded-[2rem] overflow-hidden relative group">
                  <img
                    src={tenantConfig.images.hero}
                    alt="Special Fufu and Soup"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Floating badge inside image */}
                  <div className="absolute bottom-5 left-5 right-5 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-white">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-extrabold text-sm sm:text-base leading-snug">Double Smash Burger</h4>
                        <p className="text-[10px] sm:text-xs text-white/80 mt-0.5">Glazed Bun • Crispy Patty</p>
                      </div>
                      <span className="font-black text-primary text-base sm:text-lg bg-white px-3 py-1 rounded-full">{formatCurrency(13.99)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties Highlight Section */}
      <section className="py-16 sm:py-24 bg-muted/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-xs font-black tracking-widest text-primary uppercase">{tenantConfig.marketing.recommendationsLabel}</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Our Signature Delights</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              {tenantConfig.marketing.landingMenuIntro}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 sm:mt-16">
            {featuredItems.map((item) => (
              <div
                key={item.name}
                className="bg-card rounded-3xl border border-border overflow-hidden shadow-card hover:shadow-hover hover:translate-y-[-4px] transition-all duration-300 flex flex-col group"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-muted relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4 flex gap-1">
                    {item.dietary.map(tag => (
                      <span key={tag} className="bg-primary/95 backdrop-blur-sm text-primary-foreground text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors">{item.name}</h4>
                    <span className="font-black text-primary text-base sm:text-lg shrink-0">{formatCurrency(item.price)}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex-1 text-balance">
                    {item.description}
                  </p>
                  <Button
                    onClick={() => navigate('/menu')}
                    className="w-full h-10 bg-muted hover:bg-primary hover:text-primary-foreground text-foreground font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-border group-hover:border-primary/20"
                  >
                    View in Menu
                    <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Grid Features/Benefits Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-xs font-black tracking-widest text-primary uppercase">Modern Food Experience</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">{tenantConfig.marketing.standardLabel}</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              We leverage modern technology to provide you with the most seamless and robust fast-food ordering experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Box 1: PWA support */}
            <div className="md:col-span-7 bg-card border border-border rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between gap-6 hover:shadow-hover transition-shadow group">
              <div className="space-y-4 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Smartphone size={24} />
                </div>
                <h4 className="font-black text-lg sm:text-xl text-foreground">Progressive Web App (PWA)</h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
                  {tenantConfig.marketing.landingPWAIntro}
                </p>
              </div>
              <div className="flex items-center justify-center shrink-0">
                <div className="relative w-28 h-28 bg-muted/80 rounded-2xl border border-border flex flex-col items-center justify-center text-center p-3 shadow-inner">
                  <Smartphone size={28} className="text-primary animate-bounce" />
                  <span className="text-[10px] font-extrabold text-foreground mt-2">1-Click Install</span>
                </div>
              </div>
            </div>

            {/* Box 2: Live Tracking */}
            <div className="md:col-span-5 bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-4 hover:shadow-hover transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Clock size={24} />
              </div>
              <h4 className="font-black text-lg sm:text-xl text-foreground">Real-time Tracker</h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                No guessing games. Follow your meal progression in real-time. Watch as it moves from the new orders queue, through preparation, and lands completed under our heat lamps.
              </p>
            </div>

            {/* Box 3: Flexible pickup options */}
            <div className="md:col-span-5 bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-4 hover:shadow-hover transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <MapPin size={24} />
              </div>
              <h4 className="font-black text-lg sm:text-xl text-foreground">Curbside & Scheduled Slots</h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Choose delivery or select custom 15-minute pickup slots to ensure your meals are cooked perfectly hot right as you pull up curbside. High capacity controls mean no waiting lines.
              </p>
            </div>

            {/* Box 4: Quality */}
            <div className="md:col-span-7 bg-card border border-border rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between gap-6 hover:shadow-hover transition-shadow">
              <div className="space-y-4 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck size={24} />
                </div>
                <h4 className="font-black text-lg sm:text-xl text-foreground">Supreme Culinary Standards</h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
                  We don't do pre-packaged ingredients. Every burger is fresh beef hand-smashed on our high-temperature griddle. Our house slaw is prepped fresh daily, keeping standard quality unmatched.
                </p>
              </div>
              <div className="flex items-center justify-center shrink-0">
                <div className="relative w-28 h-28 bg-primary/5 rounded-full border border-primary/20 flex flex-col items-center justify-center">
                  <UtensilsCrossed size={32} className="text-primary animate-pulse" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Gourmet</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="py-16 sm:py-24 relative overflow-hidden bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div 
            className="rounded-[3rem] p-8 sm:p-12 md:p-16 flex flex-col items-center text-center space-y-6 md:space-y-8 relative overflow-hidden border border-primary/20"
            style={{ background: 'var(--gradient-primary)' }}
          >
            {/* Background elements */}
            <div className="absolute top-[-50%] right-[-30%] w-[60vw] h-[60vw] rounded-full bg-white/10 blur-[80px] pointer-events-none" />
            <div className="absolute bottom-[-50%] left-[-30%] w-[60vw] h-[60vw] rounded-full bg-white/5 blur-[80px] pointer-events-none" />

            <Smile size={48} className="text-white animate-bounce" />

            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
              Ready to Taste the Obsession?
            </h3>

            <p className="text-sm sm:text-base md:text-lg text-white/90 max-w-2xl mx-auto font-medium leading-relaxed">
              Order now for hot pickup, delivery, or drive-thru in minutes. Choose standard immediate delivery or plan future orders. Savor fast food made with endless love.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2 w-full justify-center sm:w-auto">
              <Button
                onClick={() => navigate('/menu')}
                className="h-12 sm:h-14 bg-white text-primary hover:bg-white/90 font-extrabold px-10 rounded-full text-base sm:text-lg shadow-card flex items-center justify-center gap-1.5"
              >
                Start Your Order
                <ChevronRight size={18} />
              </Button>
              {!user && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="h-12 sm:h-14 border-2 border-white text-white hover:bg-white/15 hover:text-white font-extrabold px-10 rounded-full text-base sm:text-lg bg-transparent flex items-center justify-center gap-2"
                >
                  <LogIn size={18} />
                  Join the Club
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-muted border-t border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            {/* Logo/Info column */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black">
                  <ChefHat size={16} />
                </div>
                <span className="font-extrabold text-base sm:text-lg text-foreground tracking-tight">{tenantConfig.appName}</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm text-pretty">
                {tenantConfig.marketing.landingHeroSubtitle}
              </p>
              <p className="text-xs text-muted-foreground">
                contact developer: ({tenantConfig.contactInfo.developer} - {tenantConfig.contactInfo.phone})
                © {new Date().getFullYear()} {tenantConfig.appName}. All rights reserved. 
              </p>
            </div>

            {/* Columns 2 & 3: Hours & Contact */}
            <div className="md:col-span-4 space-y-4">
              <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Kitchen Hours</h5>
              <div className="space-y-1.5 text-xs sm:text-sm">
                {settings?.opening_hours
                  ? (Object.entries(settings.opening_hours) as [string, { open: string; close: string; enabled: boolean }][]).map(([day, h]) => {
                      const today = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];
                      const isToday = day === today;
                      const fmt = (t: string) => { const [hr, m] = t.split(':').map(Number); const d = new Date(); d.setHours(hr, m); return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); };
                      return (
                        <p key={day} className={`flex justify-between gap-4 ${isToday ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                          <span className="capitalize">{day.slice(0,3)}{isToday ? ' ✦' : ''}</span>
                          <span className={isToday ? 'text-primary' : ''}>{h.enabled ? `${fmt(h.open)} – ${fmt(h.close)}` : 'Closed'}</span>
                        </p>
                      );
                    })
                  : (
                    <p className="text-muted-foreground text-xs">Loading hours…</p>
                  )
                }
              </div>
            </div>

            <div className="md:col-span-3 space-y-4">
              <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Get In Touch</h5>
              <div className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                <p className="flex items-start gap-2">
                  <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                  <button
                    onClick={() => navigate('/location')}
                    className="text-left hover:text-primary transition-colors"
                  >
                    {settings?.restaurant_address || 'Navrongo, Upper East Region, Ghana'}
                  </button>
                </p>
                <div className="mt-8 flex flex-wrap gap-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-primary w-5 h-5" />
                    <span className="text-sm font-medium">Real-time order tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-primary w-5 h-5" />
                    <span className="text-sm font-medium">Curbside & Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
