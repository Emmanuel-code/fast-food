import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Users, Clock, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import PageMeta from '@/components/common/PageMeta';
import { reservationService } from '@/services/reservationService';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { tenantConfig } from '@/config/tenantConfig';

const formSchema = z.object({
  customer_name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  customer_phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  customer_email: z.string().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
  reservation_date: z.date({
    required_error: 'A date of reservation is required.',
  }),
  reservation_time: z.string({
    required_error: 'Please select a time.',
  }),
  party_size: z.coerce.number().min(1).max(20),
  special_requests: z.string().optional(),
});

// Generate time slots (e.g., 11:00 AM to 10:00 PM)
const TIME_SLOTS = Array.from({ length: 23 }, (_, i) => {
  const hour = Math.floor(i / 2) + 11;
  const minute = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}:00`;
});

const formatTimeDisplay = (time: string) => {
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${m} ${ampm}`;
};

export default function ReservationBooking() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      party_size: 2,
      special_requests: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      
      const dateStr = format(values.reservation_date, 'yyyy-MM-dd');
      
      // Check for conflicts
      const count = await reservationService.getConfirmedReservationsCount(dateStr, values.reservation_time);
      
      // Example: Max 5 reservations per slot
      if (count >= 5) {
        toast.error('This time slot is fully booked. Please choose another time.');
        return;
      }

      await reservationService.createReservation({
        user_id: user?.id || null,
        customer_name: values.customer_name,
        customer_phone: values.customer_phone,
        customer_email: values.customer_email || null,
        reservation_date: dateStr,
        reservation_time: values.reservation_time,
        party_size: values.party_size,
        special_requests: values.special_requests || null,
      });

      setIsSuccess(true);
      toast.success('Reservation request submitted successfully!');
    } catch (error) {
      console.error('Reservation error:', error);
      toast.error('Failed to submit reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <PageMeta title={`Reservation Confirmed | ${tenantConfig.appName}`} />
        <div className="max-w-md w-full bg-card rounded-2xl shadow-xl p-8 text-center border border-border">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Request Received!</h2>
          <p className="text-muted-foreground mb-8">
            Thank you for booking with us. We have received your reservation request and will review it shortly.
          </p>
          <div className="space-y-4">
            <Button asChild className="w-full">
              <Link to="/menu">Return to Menu</Link>
            </Button>
            <Button asChild variant="outline" className="w-full" onClick={() => setIsSuccess(false)}>
              <Link to="#">Make Another Booking</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8 pt-6">
      <PageMeta title={`Book a Table | ${tenantConfig.appName}`} />
      
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Book a Table</h1>
          <p className="text-muted-foreground">Reserve your spot and enjoy an exceptional dining experience.</p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="reservation_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reservation_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 opacity-50" />
                              <SelectValue placeholder="Select time" />
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIME_SLOTS.map((time) => (
                            <SelectItem key={time} value={time}>
                              {formatTimeDisplay(time)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="party_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Party Size</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input type="number" min="1" max="20" className="pl-9" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="customer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="customer_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="customer_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="special_requests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Requests</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any dietary requirements, high chair needed, etc." 
                        className="resize-none h-24"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full text-lg h-12" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Request Reservation'
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
