-- proposals: add dedicated notes & remarks columns
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS notes_json JSON DEFAULT NULL COMMENT 'Selected notes [{id, note_name}]',
  ADD COLUMN IF NOT EXISTS additional_remarks TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS client_instructions TEXT DEFAULT NULL;

-- proposals: expand status ENUM
ALTER TABLE proposals
  MODIFY COLUMN status ENUM(
    'draft',
    'approved',
    'sent',
    'proforma_generated',
    'proforma_sent',
    'payment_awaited',
    'payment_received',
    'invoiced',
    'submitted',
    'admin_reviewed',
    'client_sent',
    'client_approved',
    'client_rejected'
  ) DEFAULT 'draft';

-- proposal_proforma: add snapshot columns
ALTER TABLE proposal_proforma
  ADD COLUMN IF NOT EXISTS pricing_snapshot JSON DEFAULT NULL COMMENT 'Snapshot of proposal pricing_table_json',
  ADD COLUMN IF NOT EXISTS notes_snapshot JSON DEFAULT NULL COMMENT 'Snapshot of proposal notes_json',
  ADD COLUMN IF NOT EXISTS terms_snapshot JSON DEFAULT NULL COMMENT 'Snapshot of proposal terms_notes_json',
  ADD COLUMN IF NOT EXISTS remarks_snapshot TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS client_instructions_snapshot TEXT DEFAULT NULL;

-- proposal_proforma: expand status ENUM
ALTER TABLE proposal_proforma
  MODIFY COLUMN status ENUM(
    'generated',
    'sent',
    'payment_awaited',
    'payment_received',
    'partially_paid',
    'paid'
  ) DEFAULT 'generated';

-- proposal_payment_records: add notes field
ALTER TABLE proposal_payment_records
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;
