-- Marketplace Schema Migration for Comm Tab Functionality
-- Creates tables for S-Comm (community sharing) and B-Comm (secondary market)
-- Generated: 2026-01-29

-- ============================================
-- ENUMS for marketplace status and types
-- ============================================

-- Marketplace listing mode (S-Comm or B-Comm)
CREATE TYPE public.marketplace_listing_mode AS ENUM ('s-comm', 'b-comm');

-- Marketplace listing status
CREATE TYPE public.marketplace_listing_status AS ENUM ('available', 'pending', 'completed', 'cancelled', 'expired');

-- Marketplace request status (handshake workflow)
CREATE TYPE public.marketplace_request_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled', 'completed');

-- Marketplace message types
CREATE TYPE public.marketplace_message_type AS ENUM ('text', 'offer', 'accept', 'decline', 'system');

-- ============================================
-- TABLE: marketplace_listings
-- Items available for sharing or sale
-- ============================================

CREATE TABLE public.marketplace_listings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
    mode marketplace_listing_mode NOT NULL DEFAULT 's-comm',
    title TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10, 2), -- Only used for B-Comm mode, NULL for S-Comm
    condition TEXT, -- e.g., 'new', 'like-new', 'good', 'fair', 'poor'
    status marketplace_listing_status NOT NULL DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration for listings
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- TABLE: marketplace_requests
-- Handshake/request workflow for item exchanges
-- ============================================

CREATE TABLE public.marketplace_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
    requester_household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    owner_household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    status marketplace_request_status NOT NULL DEFAULT 'pending',
    message TEXT, -- Initial request message from requester
    proposed_quantity INTEGER DEFAULT 1,
    proposed_price DECIMAL(10, 2), -- For B-Comm counter-offers
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- TABLE: marketplace_chats
-- Negotiation conversations linked to requests
-- ============================================

CREATE TABLE public.marketplace_chats (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES public.marketplace_requests(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- TABLE: marketplace_messages
-- Real-time chat messages within conversations
-- ============================================

CREATE TABLE public.marketplace_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES public.marketplace_chats(id) ON DELETE CASCADE,
    sender_household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    sender_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type marketplace_message_type NOT NULL DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================

-- Add foreign key constraint for marketplace_requests.owner_household_id
ALTER TABLE public.marketplace_requests
ADD CONSTRAINT marketplace_requests_owner_household_fkey
FOREIGN KEY (owner_household_id) REFERENCES public.households(id) ON DELETE CASCADE;

-- ============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================

-- marketplace_listings indexes
CREATE INDEX idx_marketplace_listings_household_id ON public.marketplace_listings(household_id);
CREATE INDEX idx_marketplace_listings_item_id ON public.marketplace_listings(item_id);
CREATE INDEX idx_marketplace_listings_mode ON public.marketplace_listings(mode);
CREATE INDEX idx_marketplace_listings_status ON public.marketplace_listings(status);
CREATE INDEX idx_marketplace_listings_created_at ON public.marketplace_listings(created_at);
CREATE INDEX idx_marketplace_listings_expires_at ON public.marketplace_listings(expires_at);
CREATE INDEX idx_marketplace_listings_available ON public.marketplace_listings(mode, status) 
WHERE status = 'available';

-- marketplace_requests indexes
CREATE INDEX idx_marketplace_requests_listing_id ON public.marketplace_requests(listing_id);
CREATE INDEX idx_marketplace_requests_requester_household_id ON public.marketplace_requests(requester_household_id);
CREATE INDEX idx_marketplace_requests_owner_household_id ON public.marketplace_requests(owner_household_id);
CREATE INDEX idx_marketplace_requests_status ON public.marketplace_requests(status);
CREATE INDEX idx_marketplace_requests_created_at ON public.marketplace_requests(created_at);
CREATE INDEX idx_marketplace_requests_pending ON public.marketplace_requests(owner_household_id, status) 
WHERE status = 'pending';

-- marketplace_chats indexes
CREATE INDEX idx_marketplace_chats_request_id ON public.marketplace_chats(request_id);

-- marketplace_messages indexes
CREATE INDEX idx_marketplace_messages_chat_id ON public.marketplace_messages(chat_id);
CREATE INDEX idx_marketplace_messages_sender_household_id ON public.marketplace_messages(sender_household_id);
CREATE INDEX idx_marketplace_messages_created_at ON public.marketplace_messages(created_at);
CREATE INDEX idx_marketplace_messages_chat_created ON public.marketplace_messages(chat_id, created_at);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user can access a marketplace listing
CREATE OR REPLACE FUNCTION public.can_access_marketplace_listing(_listing_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.marketplace_listings ml
        WHERE ml.id = _listing_id
        AND (
            ml.status = 'available' -- Anyone can view available listings
            OR public.is_member_of_household(ml.household_id) -- Owner can view any
        )
    )
$$;

-- Function to check if user can access a marketplace request
CREATE OR REPLACE FUNCTION public.can_access_marketplace_request(_request_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.marketplace_requests mr
        WHERE mr.id = _request_id
        AND (
            public.is_member_of_household(mr.requester_household_id)
            OR public.is_member_of_household(mr.owner_household_id)
        )
    )
$$;

-- Function to check if user can access a marketplace chat
CREATE OR REPLACE FUNCTION public.can_access_marketplace_chat(_chat_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.marketplace_chats mc
        JOIN public.marketplace_requests mr ON mc.request_id = mr.id
        WHERE mc.id = _chat_id
        AND (
            public.is_member_of_household(mr.requester_household_id)
            OR public.is_member_of_household(mr.owner_household_id)
        )
    )
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all marketplace tables
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- marketplace_listings RLS Policies
-- ============================================

-- View available listings (public read access)
CREATE POLICY "Anyone can view available marketplace listings"
    ON public.marketplace_listings FOR SELECT
    USING (status = 'available');

-- View own household's listings
CREATE POLICY "Household members can view their own listings"
    ON public.marketplace_listings FOR SELECT
    USING (public.is_member_of_household(household_id));

-- Create listings (household members only)
CREATE POLICY "Household members can create marketplace listings"
    ON public.marketplace_listings FOR INSERT
    WITH CHECK (public.is_member_of_household(household_id));

-- Update own household's listings
CREATE POLICY "Household members can update their own listings"
    ON public.marketplace_listings FOR UPDATE
    USING (public.is_member_of_household(household_id));

-- Delete own household's listings
CREATE POLICY "Household members can delete their own listings"
    ON public.marketplace_listings FOR DELETE
    USING (public.is_member_of_household(household_id));

-- ============================================
-- marketplace_requests RLS Policies
-- ============================================

-- View requests for own household listings (as owner)
CREATE POLICY "Owners can view requests on their listings"
    ON public.marketplace_requests FOR SELECT
    USING (public.is_member_of_household(owner_household_id));

-- View requests made by own household
CREATE POLICY "Requesters can view their own requests"
    ON public.marketplace_requests FOR SELECT
    USING (public.is_member_of_household(requester_household_id));

-- Create requests (any authenticated user from a household)
CREATE POLICY "Household members can create requests"
    ON public.marketplace_requests FOR INSERT
    WITH CHECK (
        public.is_member_of_household(requester_household_id)
        AND requester_household_id != owner_household_id -- Cannot request own listing
    );

-- Update requests (owner can accept/reject, requester can cancel)
CREATE POLICY "Participants can update marketplace requests"
    ON public.marketplace_requests FOR UPDATE
    USING (
        public.is_member_of_household(owner_household_id)
        OR (
            public.is_member_of_household(requester_household_id)
            AND status = 'pending' -- Requester can only cancel pending requests
        )
    );

-- ============================================
-- marketplace_chats RLS Policies
-- ============================================

-- View chats for marketplace requests (participants only)
CREATE POLICY "Participants can view marketplace chats"
    ON public.marketplace_chats FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.marketplace_requests mr
            WHERE mr.id = marketplace_chats.request_id
            AND (
                public.is_member_of_household(mr.requester_household_id)
                OR public.is_member_of_household(mr.owner_household_id)
            )
        )
    );

-- Create chats (participants only, when request is created)
CREATE POLICY "Participants can create marketplace chats"
    ON public.marketplace_chats FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.marketplace_requests mr
            WHERE mr.id = marketplace_chats.request_id
            AND (
                public.is_member_of_household(mr.requester_household_id)
                OR public.is_member_of_household(mr.owner_household_id)
            )
        )
    );

-- ============================================
-- marketplace_messages RLS Policies
-- ============================================

-- View messages in accessible chats
CREATE POLICY "Participants can view marketplace messages"
    ON public.marketplace_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.marketplace_chats mc
            JOIN public.marketplace_requests mr ON mc.request_id = mr.id
            WHERE mc.id = marketplace_messages.chat_id
            AND (
                public.is_member_of_household(mr.requester_household_id)
                OR public.is_member_of_household(mr.owner_household_id)
            )
        )
    );

-- Send messages (participants only)
CREATE POLICY "Participants can send marketplace messages"
    ON public.marketplace_messages FOR INSERT
    WITH CHECK (
        public.is_member_of_household(sender_household_id)
        AND EXISTS (
            SELECT 1 FROM public.marketplace_chats mc
            JOIN public.marketplace_requests mr ON mc.request_id = mr.id
            WHERE mc.id = marketplace_messages.chat_id
            AND (
                public.is_member_of_household(mr.requester_household_id)
                OR public.is_member_of_household(mr.owner_household_id)
            )
        )
    );

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION public.update_marketplace_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_marketplace_listings_updated_at
    BEFORE UPDATE ON public.marketplace_listings
    FOR EACH ROW EXECUTE FUNCTION public.update_marketplace_updated_at_column();

CREATE TRIGGER update_marketplace_requests_updated_at
    BEFORE UPDATE ON public.marketplace_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_marketplace_updated_at_column();

CREATE TRIGGER update_marketplace_chats_updated_at
    BEFORE UPDATE ON public.marketplace_chats
    FOR EACH ROW EXECUTE FUNCTION public.update_marketplace_updated_at_column();

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for marketplace tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_listings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_messages;

-- Set replica identity for realtime updates
ALTER TABLE public.marketplace_listings REPLICA IDENTITY FULL;
ALTER TABLE public.marketplace_requests REPLICA IDENTITY FULL;
ALTER TABLE public.marketplace_chats REPLICA IDENTITY FULL;
ALTER TABLE public.marketplace_messages REPLICA IDENTITY FULL;

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Available listings for browsing (public view)
CREATE OR REPLACE VIEW public.marketplace_listings_available AS
SELECT 
    ml.id,
    ml.household_id,
    ml.item_id,
    ml.mode,
    ml.title,
    ml.description,
    ml.quantity,
    ml.price,
    ml.condition,
    ml.created_at,
    ml.expires_at,
    h.name as household_name
FROM public.marketplace_listings ml
JOIN public.households h ON ml.household_id = h.id
WHERE ml.status = 'available'
AND (ml.expires_at IS NULL OR ml.expires_at > now());

-- View: My household's marketplace listings
CREATE OR REPLACE VIEW public.my_marketplace_listings AS
SELECT 
    ml.*,
    h.name as household_name
FROM public.marketplace_listings ml
JOIN public.households h ON ml.household_id = h.id
WHERE public.is_member_of_household(ml.household_id);

-- View: Incoming requests on my household's listings
CREATE OR REPLACE VIEW public.my_incoming_requests AS
SELECT 
    mr.*,
    ml.title as listing_title,
    ml.mode as listing_mode,
    ml.price as listing_price,
    hr.name as requester_household_name
FROM public.marketplace_requests mr
JOIN public.marketplace_listings ml ON mr.listing_id = ml.id
JOIN public.households hr ON mr.requester_household_id = hr.id
WHERE public.is_member_of_household(mr.owner_household_id);

-- View: Outgoing requests I've made
CREATE OR REPLACE VIEW public.my_outgoing_requests AS
SELECT 
    mr.*,
    ml.title as listing_title,
    ml.mode as listing_mode,
    ml.price as listing_price,
    ml.condition as listing_condition,
    ho.name as owner_household_name
FROM public.marketplace_requests mr
JOIN public.marketplace_listings ml ON mr.listing_id = ml.id
JOIN public.households ho ON mr.owner_household_id = ho.id
WHERE public.is_member_of_household(mr.requester_household_id);

-- ============================================
-- SAMPLE DATA FUNCTIONS (Optional)
-- ============================================

-- Function to create a listing from an inventory item
CREATE OR REPLACE FUNCTION public.create_listing_from_inventory(
    _item_id UUID,
    _mode marketplace_listing_mode,
    _title TEXT,
    _description TEXT,
    _price DECIMAL(10, 2) DEFAULT NULL,
    _condition TEXT DEFAULT NULL,
    _expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _listing_id UUID;
    _household_id UUID;
    _inventory_item public.inventory_items;
BEGIN
    -- Get the inventory item and verify ownership
    SELECT * INTO _inventory_item 
    FROM public.inventory_items 
    WHERE id = _item_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inventory item not found';
    END IF;

    _household_id := _inventory_item.household_id;

    IF NOT public.is_member_of_household(_household_id) THEN
        RAISE EXCEPTION 'You do not have access to this inventory item';
    END IF;

    -- Create the listing
    INSERT INTO public.marketplace_listings (
        household_id,
        item_id,
        mode,
        title,
        description,
        quantity,
        price,
        condition,
        expires_at
    ) VALUES (
        _household_id,
        _item_id,
        _mode,
        _title,
        _description,
        _inventory_item.quantity,
        _price,
        _condition,
        _expires_at
    )
    RETURNING id INTO _listing_id;

    RETURN _listing_id;
END;
$$;
