-- ==============================================================================
-- RUHIT LEAD TRACKING SYSTEM - LEAD LIST COLLECTION SCHEMA
-- Migration: 002_lead_collection_schema.sql
-- ==============================================================================

-- 1. KEYWORD SETS
CREATE TABLE IF NOT EXISTS collection_keyword_sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  created_by TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. KEYWORDS
CREATE TABLE IF NOT EXISTS collection_keywords (
  id TEXT PRIMARY KEY,
  keyword_set_id TEXT NOT NULL REFERENCES collection_keyword_sets(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. LOCATIONS
CREATE TABLE IF NOT EXISTS collection_locations (
  id TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  region TEXT,
  country TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'claimed', 'in_progress', 'completed', 'partial')) DEFAULT 'available',
  last_used_date TIMESTAMPTZ,
  last_used_batch_id TEXT,
  last_used_keyword_set_id TEXT,
  last_used_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. BATCHES
CREATE TABLE IF NOT EXISTS collection_batches (
  id TEXT PRIMARY KEY,
  batch_number TEXT NOT NULL,
  batch_name TEXT NOT NULL,
  keyword_set_id TEXT REFERENCES collection_keyword_sets(id) ON DELETE SET NULL,
  keyword_set_name TEXT NOT NULL,
  country TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ready', 'in_progress', 'completed', 'partial', 'cancelled')) DEFAULT 'ready',
  keyword_count INT NOT NULL DEFAULT 0,
  location_count INT NOT NULL DEFAULT 0,
  combination_count INT NOT NULL DEFAULT 0,
  leads_collected INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_by TEXT,
  created_by_name TEXT,
  started_at TIMESTAMPTZ,
  started_by TEXT,
  started_by_name TEXT,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  completed_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. BATCH LOCATIONS JUNCTION
CREATE TABLE IF NOT EXISTS collection_batch_locations (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES collection_batches(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES collection_locations(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  UNIQUE(batch_id, location_id)
);

-- 6. BATCH KEYWORDS SNAPSHOT
CREATE TABLE IF NOT EXISTS collection_batch_keywords (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES collection_batches(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL
);

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_col_kw_set ON collection_keywords(keyword_set_id);
CREATE INDEX IF NOT EXISTS idx_col_loc_country ON collection_locations(country);
CREATE INDEX IF NOT EXISTS idx_col_loc_status ON collection_locations(status);
CREATE INDEX IF NOT EXISTS idx_col_loc_norm ON collection_locations(normalized_name);
CREATE INDEX IF NOT EXISTS idx_col_batches_status ON collection_batches(status);
CREATE INDEX IF NOT EXISTS idx_col_batches_country ON collection_batches(country);
CREATE INDEX IF NOT EXISTS idx_col_batch_loc_batch ON collection_batch_locations(batch_id);
CREATE INDEX IF NOT EXISTS idx_col_batch_loc_loc ON collection_batch_locations(location_id);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE collection_keyword_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_batch_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_batch_keywords ENABLE ROW LEVEL SECURITY;

DO 
BEGIN
  CREATE POLICY "Allow team read keyword sets" ON collection_keyword_sets FOR SELECT USING (true);
  CREATE POLICY "Allow team write keyword sets" ON collection_keyword_sets FOR ALL USING (true);

  CREATE POLICY "Allow team read keywords" ON collection_keywords FOR SELECT USING (true);
  CREATE POLICY "Allow team write keywords" ON collection_keywords FOR ALL USING (true);

  CREATE POLICY "Allow team read locations" ON collection_locations FOR SELECT USING (true);
  CREATE POLICY "Allow team write locations" ON collection_locations FOR ALL USING (true);

  CREATE POLICY "Allow team read batches" ON collection_batches FOR SELECT USING (true);
  CREATE POLICY "Allow team write batches" ON collection_batches FOR ALL USING (true);

  CREATE POLICY "Allow team read batch locations" ON collection_batch_locations FOR SELECT USING (true);
  CREATE POLICY "Allow team write batch locations" ON collection_batch_locations FOR ALL USING (true);

  CREATE POLICY "Allow team read batch keywords" ON collection_batch_keywords FOR SELECT USING (true);
  CREATE POLICY "Allow team write batch keywords" ON collection_batch_keywords FOR ALL USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END ;

-- Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE collection_batches;
ALTER PUBLICATION supabase_realtime ADD TABLE collection_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE collection_keyword_sets;
