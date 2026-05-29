export const tenantConfig = {
  // Brand Details
  appName: "Chef's Kitchen",
  appNameShort: "ChefKitchen", // For PWA name
  description: "Order fresh, fast and delicious food from our kitchen directly to you.",
  contactInfo: {
    developer: "Jimah",
    phone: "+233541555607",
  },
  copyrightYear: new Date().getFullYear(),
  
  // Theme Colors (Tailwind HSL variables)
  // Format: "H S% L%" (e.g. "38 100% 50%")
  theme: {
    // Primary brand color
    primary: "38 100% 50%",           // Vibrant Premium Amber Gold
    primaryForeground: "30 100% 8%",  // Dark text on primary
    
    // Background and cards
    background: "35 30% 98%",
    foreground: "28 40% 12%",
    card: "0 0% 100%",
    cardForeground: "28 40% 12%",
    
    // Ring and accents
    ring: "38 100% 50%",
    
    // Sidebar colors
    sidebarBackground: "28 55% 10%",
    sidebarForeground: "40 50% 94%",
    sidebarPrimary: "38 100% 50%",
    sidebarPrimaryForeground: "30 100% 8%",
    sidebarAccent: "28 50% 15%",
    sidebarAccentForeground: "40 50% 94%",
    sidebarBorder: "28 40% 16%",
    sidebarRing: "38 100% 50%",
  },

  // Imagery & Visuals
  images: {
    // Used in the landing page hero section
    hero: "https://miaoda-site-img.s3cdn.medo.dev/images/KLing_2e47c1f8-d4fa-471d-85f8-80df2a514217.jpg",
    // Used as the placeholder for menu items
    featuredBurger: "https://miaoda-site-img.s3cdn.medo.dev/images/KLing_018e378f-6b93-4338-b3c9-576f4b233dce.jpg",
  },
  
  // Marketing Copy
  marketing: {
    landingHeroTitle: "Elevated Fast Food",
    landingHeroSubtitle: "Engineering the finest fast food experience with high culinary standards and real-time live ordering technology.",
    landingMenuIntro: "Handcrafted, fresh, and bursting with rich local flavor.",
    landingPWAIntro: "With off-line cache support, browse our menu and access your orders instantly like a native app without wasting app store space.",
    // Section headings on the Landing page
    recommendationsLabel: "Chef's Recommendations",
    standardLabel: "The Chef's Standard",
  },

  // Email (used by the send-order-confirmation-email edge function via env vars)
  email: {
    fromName: "Chef's Kitchen",
    fromAddress: "orders@chefskitchen.gh",
    footerTagline: "Thank you for ordering from Chef's Kitchen! 🍽️",
  },

  // Location & Map
  // These are the fallback defaults used when the DB/settings are unavailable.
  // The live values come from the restaurant_settings table (manager can update them).
  location: {
    defaultLat: 10.8941,
    defaultLng: -1.0944,
    defaultAddress: "Catholic Road, Navrongo, Upper East Region, Ghana",
    city: "Navrongo",
    // Short landmark hint shown under the address card
    locationHint: "Near AMA Container · Catholic Road, Navrongo",
    // Longer visit tip sentence shown in the Visit Tips card
    visitTip: "We are located near the AMA Container along Catholic Road in Navrongo — look for our signage.",
    // Direct Google Maps pin URL (right-click a pin on maps.google.com → Share → Copy link)
    googleMapsUrl: "https://maps.app.goo.gl/ed2i7LSpR94p8ocL6",
  },
};
