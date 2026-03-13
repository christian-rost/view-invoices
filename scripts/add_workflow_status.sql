-- Migration: Workflow-Status für Rechnungen
-- Ausführen in Supabase SQL Editor

ALTER TABLE rechnungen
  ADD COLUMN IF NOT EXISTS workflow_status text DEFAULT 'offen';

-- Bestehende Datensätze auf 'offen' setzen (falls NULL)
UPDATE rechnungen SET workflow_status = 'offen' WHERE workflow_status IS NULL;
