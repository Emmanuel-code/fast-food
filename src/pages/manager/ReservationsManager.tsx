import { useState, useEffect } from 'react';
import PageMeta from '@/components/common/PageMeta';
import { tenantConfig } from '@/config/tenantConfig';
import { reservationService } from '@/services/reservationService';
import type { Reservation, ReservationStatus } from '@/types/types';
import { format } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Check, 
  X, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formatTime = (timeStr: string) => {
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(parseInt(h, 10));
  d.setMinutes(parseInt(m, 10));
  return format(d, 'h:mm a');
};

export default function ReservationsManager() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>('today');

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await reservationService.getReservations();
      setReservations(data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleStatusChange = async (id: string, status: ReservationStatus) => {
    try {
      await reservationService.updateReservationStatus(id, status);
      toast.success(`Reservation marked as ${status}`);
      fetchReservations(); // Refresh list to get accurate conflicts
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update reservation status');
    }
  };

  // Filter reservations
  const filteredReservations = reservations.filter(res => {
    const today = format(new Date(), 'yyyy-MM-dd');
    if (dateFilter === 'today') return res.reservation_date === today;
    if (dateFilter === 'upcoming') return res.reservation_date >= today && res.status !== 'completed';
    if (dateFilter === 'past') return res.reservation_date < today || res.status === 'completed';
    return true; // 'all'
  });

  // Calculate conflicts for pending reservations
  // If a slot has >= 5 confirmed reservations, it's considered fully booked
  const getConflictWarning = (res: Reservation) => {
    if (res.status !== 'pending') return null;
    
    const confirmedSameSlot = reservations.filter(r => 
      r.reservation_date === res.reservation_date && 
      r.reservation_time === res.reservation_time &&
      r.status === 'confirmed'
    ).length;

    if (confirmedSameSlot >= 5) {
      return "Time slot is fully booked (5+ confirmed)";
    } else if (confirmedSameSlot > 0) {
      return `${confirmedSameSlot} other table(s) booked at this time`;
    }
    return null;
  };

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Pending</Badge>;
      case 'confirmed': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Confirmed</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      case 'completed': return <Badge variant="outline">Completed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6">
      <PageMeta title={`Reservations | ${tenantConfig.appName}`} />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reservations</h1>
          <p className="text-muted-foreground">Manage table bookings and capacity</p>
        </div>
        
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="past">Past / Completed</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
          <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No reservations found</p>
          <p className="text-sm">Try changing your date filter</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredReservations.map((res) => {
            const warning = getConflictWarning(res);
            
            return (
              <div key={res.id} className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-6">
                
                {/* Time & Date Block */}
                <div className="flex-shrink-0 w-full md:w-48 flex flex-col justify-center bg-muted/50 rounded-lg p-4 text-center">
                  <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    {format(new Date(res.reservation_date), 'EEE, MMM d')}
                  </span>
                  <span className="text-2xl font-bold mt-1 text-primary">
                    {formatTime(res.reservation_time)}
                  </span>
                  <div className="mt-3 flex justify-center">
                    {getStatusBadge(res.status)}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">{res.customer_name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <Users className="w-4 h-4" /> Party of {res.party_size}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4" /> {res.customer_phone}
                        </span>
                        {res.customer_email && (
                          <span className="flex items-center gap-1.5 hidden sm:flex">
                            <Mail className="w-4 h-4" /> {res.customer_email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {res.special_requests && (
                    <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 p-3 rounded-md text-sm flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p>"{res.special_requests}"</p>
                    </div>
                  )}

                  {warning && (
                    <div className="text-destructive flex items-center gap-1.5 text-sm font-medium mt-2">
                      <AlertCircle className="w-4 h-4" />
                      {warning}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                  {res.status === 'pending' && (
                    <>
                      <Button 
                        className="w-full bg-green-500 hover:bg-green-600" 
                        onClick={() => handleStatusChange(res.id, 'confirmed')}
                      >
                        <Check className="w-4 h-4 mr-2" /> Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full text-destructive hover:bg-destructive/10"
                        onClick={() => handleStatusChange(res.id, 'cancelled')}
                      >
                        <X className="w-4 h-4 mr-2" /> Decline
                      </Button>
                    </>
                  )}
                  {res.status === 'confirmed' && (
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => handleStatusChange(res.id, 'completed')}
                    >
                      Mark Complete
                    </Button>
                  )}
                  {res.status === 'confirmed' && (
                     <Button 
                     variant="ghost" 
                     className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                     onClick={() => handleStatusChange(res.id, 'cancelled')}
                   >
                     Cancel Booking
                   </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
