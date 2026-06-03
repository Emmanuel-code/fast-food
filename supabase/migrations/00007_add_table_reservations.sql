CREATE TABLE public.reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional, for logged-in users
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    party_size INTEGER NOT NULL CHECK (party_size > 0),
    special_requests TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a reservation (for guest bookings)
CREATE POLICY "Anyone can create a reservation"
    ON public.reservations FOR INSERT
    WITH CHECK (true);

-- Users can read their own reservations if logged in
CREATE POLICY "Users can view their own reservations"
    ON public.reservations FOR SELECT
    USING (auth.uid() = user_id);

-- Managers and admins can read and update all reservations
CREATE POLICY "Managers can view all reservations"
    ON public.reservations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('manager', 'admin')
        )
    );

CREATE POLICY "Managers can update reservations"
    ON public.reservations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('manager', 'admin')
        )
    );


