-- Step 1: Create the new database
CREATE DATABASE IF NOT EXISTS `revenue_engine`;

-- Step 2: Move all tables from the old database (dm_calculator) to the new database (revenue_engine).
-- This also renames the 3 tables that had "dm_calculator_" in their name.

RENAME TABLE `dm_calculator`.`addtional_service` TO `revenue_engine`.`addtional_service`;
RENAME TABLE `dm_calculator`.`ads_campaign_details` TO `revenue_engine`.`ads_campaign_details`;
RENAME TABLE `dm_calculator`.`ads_campaign_details_invoice` TO `revenue_engine`.`ads_campaign_details_invoice`;
RENAME TABLE `dm_calculator`.`amount_remaining` TO `revenue_engine`.`amount_remaining`;
RENAME TABLE `dm_calculator`.`assign_quotation` TO `revenue_engine`.`assign_quotation`;
RENAME TABLE `dm_calculator`.`calculator_transactions` TO `revenue_engine`.`calculator_transactions`;
RENAME TABLE `dm_calculator`.`categories` TO `revenue_engine`.`categories`;
RENAME TABLE `dm_calculator`.`client_requirement_links` TO `revenue_engine`.`client_requirement_links`;
RENAME TABLE `dm_calculator`.`complimentary` TO `revenue_engine`.`complimentary`;
RENAME TABLE `dm_calculator`.`complimentary_invoice` TO `revenue_engine`.`complimentary_invoice`;
RENAME TABLE `dm_calculator`.`discount` TO `revenue_engine`.`discount`;
RENAME TABLE `dm_calculator`.`discount_settings` TO `revenue_engine`.`discount_settings`;
RENAME TABLE `dm_calculator`.`editing_types` TO `revenue_engine`.`editing_types`;
RENAME TABLE `dm_calculator`.`invoice` TO `revenue_engine`.`invoice`;
RENAME TABLE `dm_calculator`.`invoice_client_notes` TO `revenue_engine`.`invoice_client_notes`;
RENAME TABLE `dm_calculator`.`invoice_graphic` TO `revenue_engine`.`invoice_graphic`;
RENAME TABLE `dm_calculator`.`invoice_notes_data` TO `revenue_engine`.`invoice_notes_data`;
RENAME TABLE `dm_calculator`.`notes_bydefault` TO `revenue_engine`.`notes_bydefault`;
RENAME TABLE `dm_calculator`.`notes_data` TO `revenue_engine`.`notes_data`;
RENAME TABLE `dm_calculator`.`plans_notes` TO `revenue_engine`.`plans_notes`;
RENAME TABLE `dm_calculator`.`plan_client_notes` TO `revenue_engine`.`plan_client_notes`;
RENAME TABLE `dm_calculator`.`plan_data` TO `revenue_engine`.`plan_data`;
RENAME TABLE `dm_calculator`.`plan_details` TO `revenue_engine`.`plan_details`;
RENAME TABLE `dm_calculator`.`proposals` TO `revenue_engine`.`proposals`;
RENAME TABLE `dm_calculator`.`proposal_payment_records` TO `revenue_engine`.`proposal_payment_records`;
RENAME TABLE `dm_calculator`.`proposal_proforma` TO `revenue_engine`.`proposal_proforma`;
RENAME TABLE `dm_calculator`.`quotation_status` TO `revenue_engine`.`quotation_status`;
RENAME TABLE `dm_calculator`.`requirement_submissions` TO `revenue_engine`.`requirement_submissions`;
RENAME TABLE `dm_calculator`.`requirement_submission_items` TO `revenue_engine`.`requirement_submission_items`;
RENAME TABLE `dm_calculator`.`services` TO `revenue_engine`.`services`;
RENAME TABLE `dm_calculator`.`service_progress` TO `revenue_engine`.`service_progress`;
RENAME TABLE `dm_calculator`.`teams` TO `revenue_engine`.`teams`;
RENAME TABLE `dm_calculator`.`team_members` TO `revenue_engine`.`team_members`;
RENAME TABLE `dm_calculator`.`workflow_payment_ledger` TO `revenue_engine`.`workflow_payment_ledger`;
RENAME TABLE `dm_calculator`.`workflow_project_assignments` TO `revenue_engine`.`workflow_project_assignments`;
RENAME TABLE `dm_calculator`.`workflow_remarks` TO `revenue_engine`.`workflow_remarks`;
RENAME TABLE `dm_calculator`.`workflow_strategy` TO `revenue_engine`.`workflow_strategy`;
RENAME TABLE `dm_calculator`.`workflow_task_assignments` TO `revenue_engine`.`workflow_task_assignments`;

-- And finally rename the specific dm_calculator tables:
RENAME TABLE `dm_calculator`.`dm_calculator_ads` TO `revenue_engine`.`revenue_engine_ads`;
RENAME TABLE `dm_calculator`.`dm_calculator_client_details` TO `revenue_engine`.`revenue_engine_client_details`;
RENAME TABLE `dm_calculator`.`dm_calculator_employees` TO `revenue_engine`.`revenue_engine_employees`;

-- Step 3: Now you can safely drop the old empty database:
-- DROP DATABASE dm_calculator;
