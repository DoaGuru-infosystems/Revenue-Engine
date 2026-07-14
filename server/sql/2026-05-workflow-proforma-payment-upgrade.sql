-- DM Calculator workflow upgrade:
-- client_approved -> proforma_invoice_generated -> proforma_invoice_sent
-- -> payment_received_invoice_ready -> invoice_sent

ALTER TABLE quotation_status
  MODIFY COLUMN status ENUM(
    'pending',
    'approved',
    'admin_approved',
    'admin_rejected',
    'client_sent',
    'client_approved',
    'client_rejected',
    'proforma_invoice_generated',
    'proforma_invoice_sent',
    'payment_received_invoice_ready',
    'invoice_sent',
    'team_assigned',
    'strategy_saved',
    'strategy_sent_to_admin',
    'strategy_admin_approved',
    'strategy_admin_rejected',
    'strategy_changes_requested',
    'strategy_client_sent',
    'strategy_client_approved',
    'strategy_client_rejected',
    'tasks_assigned',
    'execution'
  ) DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS workflow_payment_ledger (
  id INT AUTO_INCREMENT PRIMARY KEY,
  txn_id VARCHAR(100) NOT NULL,
  client_id VARCHAR(100) NOT NULL,
  amount_received DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL,
  payment_mode VARCHAR(50) NOT NULL,
  transaction_reference VARCHAR(255) NOT NULL,
  remark TEXT,
  received_by VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_txn_client (txn_id, client_id),
  KEY idx_payment_date (payment_date)
);
