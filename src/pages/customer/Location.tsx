import { useRestaurant } from '@/contexts/RestaurantContext';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Phone, Clock, Car, Info } from 'lucide-react';

export default function Location() {
  const { settings } = useRestaurant();

  const address = settings?.restaurant_address || '123 Main Street, New York, NY 10001';
  const lat = settings?.restaurant_lat || 40.7128;
  const lng = settings?.restaurant_lng || -74.006;

  const handleGetDirections = () => {
    const query = encodeURIComponent(address);
    const url = `https://maps.google.com/?q=${query}`;
    window.open(url, '_blank');
  };

  return (
    <CustomerLayout>
      <div className="px-4 pt-5 pb-4">
        <h1 className="text-xl font-bold text-foreground">Find Us</h1>
        <p className="text-sm text-muted-foreground mt-1">Come visit Chef's Kitchen</p>
      </div>

      <div className="px-4 pb-8 space-y-4">
        {/* Map placeholder */}
        <div
          className="rounded-2xl overflow-hidden bg-muted border border-border"
          style={{ height: 200 }}
        >
          <iframe
            title="Chef's Kitchen Location"
            width="100%"
            height="200"
            style={{ border: 0 }}
            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU3Lkw&q=${encodeURIComponent(address)}`}
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
            </div>
          </div>

          <Button
            onClick={handleGetDirections}
            className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-semibold"
          >
            <Navigation size={16} />
            Get Directions
          </Button>
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
                    <span className="capitalize">{day}{isToday ? ' (Today)' : ''}</span>
                    <span>
                      {hours.enabled ? `${fmt(hours.open)} – ${fmt(hours.close)}` : 'Closed'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Parking tips */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Car size={16} className="text-primary" />
            <h2 className="font-semibold text-sm text-foreground">Parking Tips</h2>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Info size={13} className="mt-0.5 shrink-0 text-primary" />
              Free parking available in our dedicated lot on the east side of the building.
            </li>
            <li className="flex items-start gap-2">
              <Info size={13} className="mt-0.5 shrink-0 text-primary" />
              Curbside pickup spots available near the entrance – look for the orange markers.
            </li>
            <li className="flex items-start gap-2">
              <Info size={13} className="mt-0.5 shrink-0 text-primary" />
              Street parking is available on Main Street (2-hour limit on weekdays).
            </li>
          </ul>
        </div>
      </div>
    </CustomerLayout>
  );
}
