-- Create species catalog table
CREATE TABLE public.species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hs_code TEXT NOT NULL UNIQUE,
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create saved queries table
CREATE TABLE public.saved_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  reporter_code TEXT NOT NULL,
  partner_code TEXT,
  hs_code TEXT NOT NULL,
  flow_code TEXT NOT NULL,
  frequency TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create time series cache table
CREATE TABLE public.time_series_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Enable RLS
ALTER TABLE public.species ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_series_cache ENABLE ROW LEVEL SECURITY;

-- Species policies (public read)
CREATE POLICY "Species are viewable by everyone"
  ON public.species FOR SELECT
  USING (true);

-- Saved queries policies (user-specific)
CREATE POLICY "Users can view their own queries"
  ON public.saved_queries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own queries"
  ON public.saved_queries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own queries"
  ON public.saved_queries FOR DELETE
  USING (auth.uid() = user_id);

-- Cache policies (authenticated users can read)
CREATE POLICY "Authenticated users can view cache"
  ON public.time_series_cache FOR SELECT
  TO authenticated
  USING (true);

-- Insert initial species data (HS Chapter 03 - Fish and seafood)
INSERT INTO public.species (hs_code, name_es, name_en, description) VALUES
('0302', 'Pescado fresco o refrigerado', 'Fish, fresh or chilled', 'Fresh or chilled fish, excluding fish fillets'),
('030631', 'Langostinos y camarones congelados', 'Frozen shrimps and prawns', 'Frozen shrimps and prawns'),
('0306', 'Crustáceos congelados', 'Frozen crustaceans', 'Frozen crustaceans, including shrimps, prawns, lobsters'),
('0307', 'Moluscos', 'Molluscs', 'Molluscs, whether in shell or not'),
('030749', 'Jibias y calamares congelados', 'Frozen cuttlefish and squid', 'Frozen cuttlefish and squid'),
('0303', 'Pescado congelado', 'Frozen fish', 'Frozen fish, excluding fish fillets');
