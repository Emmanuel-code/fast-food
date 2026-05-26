/**
 * FCM push notification registration utility.
 * Requests permission, registers the service worker, obtains a registration token,
 * and stores it in the fcm_tokens table (deduplicated by user_id + token).
 *
 * NOTE: FCM_VAPID_KEY is optional — if not provided, registration is skipped
 * gracefully so the app keeps working without notifications configured.
 */
import { supabase } from '@/db/supabase';

// Set this to your FCM Web Push certificate VAPID public key if you have one.
// Leave empty and notifications are silently skipped.
const VAPID_PUBLIC_KEY = import.meta.env.VITE_FCM_VAPID_KEY || '';

export async function registerFCMToken(userId: string): Promise<void> {
  try {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    if (!VAPID_PUBLIC_KEY) return; // FCM not configured

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    // Register / reuse the existing service worker
    const registration = await navigator.serviceWorker.ready;

    // Dynamically import Firebase messaging to avoid bundle bloat when unused
    const { initializeApp, getApps } = await import('firebase/app');
    const { getMessaging, getToken } = await import('firebase/messaging');

    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    // Avoid duplicate initialization during HMR
    const app = getApps().length === 0
      ? initializeApp(firebaseConfig)
      : getApps()[0];

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_PUBLIC_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) return;

    // Upsert token — ignore duplicates
    await supabase
      .from('fcm_tokens')
      .upsert({ user_id: userId, token }, { onConflict: 'user_id,token', ignoreDuplicates: true });
  } catch {
    // FCM registration failure must never break the login/signup flow
  }
}
