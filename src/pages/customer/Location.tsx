import { useRestaurant } from '@/contexts/RestaurantContext';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Clock, Info, Phone } from 'lucide-react';
import { tenantConfig } from '@/config/tenantConfig';

const { defaultLat, defaultLng, defaultAddress, city, locationHint, visitTip, googleMapsUrl } =
  tenantConfig.location;

export default function Location() {
  const { settings } = useRestaurant();

  const address = settings?.restaurant_address || defaultAddress;
  const lat = settings?.restaurant_lat ?? defaultLat;
  const lng = settings?.restaurant_lng ?? defaultLng;

  // OpenStreetMap embed – no API key required
  const delta = 0.012;
  const osmSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta},${lat - delta},${lng + delta},${lat + delta}&layer=mapnik&marker=${lat},${lng}`;

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const handleOpenInMaps = () => {
    window.open(googleMapsUrl, '_blank');
  };

  return (
    <CustomerLayout>
      <div className="px-4 pt-5 pb-4">
        <h1 className="text-xl font-bold text-foreground">Find Us</h1>
        <p className="text-sm text-muted-foreground mt-1">Come visit {tenantConfig.appName} in {city}</p>
      </div>

      <div className="px-4 pb-8 space-y-4">
        {/* Map – OpenStreetMap (no API key) */}
        <div
          className="rounded-2xl overflow-hidden bg-muted border border-border shadow-sm"
          style={{ height: 220 }}
        >
          <iframe
            title={`${tenantConfig.appName} Location – ${city}`}
            width="100%"
            height="220"
            style={{ border: 0 }}
            src={osmSrc}
            allowFullScreen
          />
        </div>

        {/* Address card */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Address</p>
              <p className="text-sm text-muted-foreground mt-0.5">{address}</p>
              <p className="text-xs text-muted-foreground mt-1">{locationHint}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleGetDirections}
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-semibold text-sm"
            >
              <Navigation size={15} />
              Directions
            </Button>
            <Button
              onClick={handleOpenInMaps}
              variant="outline"
              className="w-full h-11 gap-2 font-semibold text-sm border-border"
            >
              <MapPin size={15} className="text-primary" />
              Open in Maps
            </Button>
          </div>
        </div>

        {/* Hours card */}
        {settings && (
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              <h2 className="font-semibold text-sm text-foreground">Opening Hours</h2>
            </div>
            <div className="space-y-2">
              {(Object.entries(settings.opening_hours) as [string, { open: string; close: string; enabled: boolean }][]).map(([day, hours]) => {
                const today = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];
                const isToday = day === today;
                const fmt = (t: string) => {
                  const [h, m] = t.split(':').map(Number);
                  const d = new Date();
                  d.setHours(h, m);
                  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                };
                return (
                  <div
                    key={day}
                    className={`flex justify-between text-sm ${isToday ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
                  >
                    <span className="capitalize flex items-center gap-1.5">
                      {day}
                      {isToday && (
                        <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Today</span>
                      )}
                    </span>
                    <span>
                      {hours.enabled ? `${fmt(hours.open)} – ${fmt(hours.close)}` : 'Closed'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Visit Tips */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-primary" />
            <h2 className="font-semibold text-sm text-foreground">Visit Tips</h2>
          </div>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Info size={13} className="mt-0.5 shrink-0 text-primary" />
              {visitTip}
            </li>
            <li className="flex items-start gap-2">
              <Info size={13} className="mt-0.5 shrink-0 text-primary" />
              Motorbike parking is available right in front of the restaurant. Car parking is on the roadside nearby.
            </li>
            <li className="flex items-start gap-2">
              <Info size={13} className="mt-0.5 shrink-0 text-primary" />
              We accept Mobile Money (MTN, Telecel, AirtelTigo) and cash. No need to carry exact change!
            </li>
          </ul>
        </div>
      </div>
    </CustomerLayout>
  );
}
