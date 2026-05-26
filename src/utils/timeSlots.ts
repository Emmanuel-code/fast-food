import { type DayName, type OpeningHours, type RestaurantSettings } from '@/types/types';
import { addDays, format, isAfter, isBefore, parse, setHours, setMinutes } from 'date-fns';

const DAY_ORDER: DayName[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function getDayName(date: Date): DayName {
  return DAY_ORDER[date.getDay()];
}

export function isRestaurantOpen(settings: RestaurantSettings): boolean {
  if (settings.closed_temporarily) return false;
  const now = new Date();
  const dayName = getDayName(now);
  const dayHours = settings.opening_hours[dayName];
  if (!dayHours?.enabled) return false;
  const [openH, openM] = dayHours.open.split(':').map(Number);
  const [closeH, closeM] = dayHours.close.split(':').map(Number);
  const openTime = setMinutes(setHours(new Date(), openH), openM);
  const closeTime = setMinutes(setHours(new Date(), closeH), closeM);
  return isAfter(now, openTime) && isBefore(now, closeTime);
}

export function isDayOpen(date: Date, openingHours: OpeningHours): boolean {
  const dayName = getDayName(date);
  return openingHours[dayName]?.enabled ?? false;
}

export function getAvailableDates(settings: RestaurantSettings): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  const isOpenToday = isRestaurantOpen(settings);
  if (isOpenToday) dates.push(today);
  for (let i = 1; i <= settings.max_pre_order_days; i++) {
    const d = addDays(today, i);
    if (isDayOpen(d, settings.opening_hours)) dates.push(d);
  }
  return dates;
}

export function generateTimeSlots(date: Date, settings: RestaurantSettings): string[] {
  const dayName = getDayName(date);
  const dayHours = settings.opening_hours[dayName];
  if (!dayHours?.enabled) return [];
  const slots: string[] = [];
  const [openH, openM] = dayHours.open.split(':').map(Number);
  const [closeH, closeM] = dayHours.close.split(':').map(Number);
  const startMinutes = openH * 60 + openM + settings.prep_time_estimate_minutes;
  const endMinutes = closeH * 60 + closeM - 15;
  for (let m = startMinutes; m <= endMinutes; m += 15) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const d = setMinutes(setHours(new Date(date), h), min);
    // For today, only show future slots
    const today = new Date();
    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') && isBefore(d, today)) {
      continue;
    }
    const label = format(d, 'h:mm a');
    slots.push(label);
  }
  return slots;
}

export function parseTimeSlotToDate(slot: string, date: Date): Date {
  const parsed = parse(slot, 'h:mm a', new Date(date));
  return parsed;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy');
}

export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
}

export function elapsedTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function elapsedMinutes(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}
