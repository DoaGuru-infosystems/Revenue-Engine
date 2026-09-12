-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 11, 2026 at 03:41 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `revenue_engine`
--

-- --------------------------------------------------------

--
-- Table structure for table `re_addtional_service`
--

CREATE TABLE `re_addtional_service` (
  `id` int(255) NOT NULL,
  `txn_id` varchar(255) NOT NULL,
  `client_id` int(255) NOT NULL,
  `service_name` varchar(255) NOT NULL,
  `category_name` varchar(255) NOT NULL,
  `editing_type_id` int(255) DEFAULT NULL,
  `editing_type_name` varchar(255) NOT NULL,
  `editing_type_amount` varchar(255) NOT NULL,
  `quantity` varchar(255) NOT NULL,
  `include_content_posting` varchar(255) NOT NULL,
  `include_thumbnail_creation` varchar(255) NOT NULL,
  `include_youtube_video_posting` varchar(255) NOT NULL DEFAULT '0',
  `total_amount` varchar(255) NOT NULL,
  `plan_name` varchar(255) NOT NULL,
  `employee` varchar(255) NOT NULL,
  `created_at` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_ads_campaign_details`
--

CREATE TABLE `re_ads_campaign_details` (
  `id` int(11) NOT NULL,
  `txn_id` varchar(100) DEFAULT NULL,
  `client_id` int(11) NOT NULL,
  `unique_id` varchar(50) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `amount` varchar(100) DEFAULT NULL,
  `percent` varchar(100) DEFAULT NULL,
  `charge` varchar(100) DEFAULT NULL,
  `total` varchar(100) DEFAULT NULL,
  `employee` varchar(250) DEFAULT NULL,
  `created_at` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_ads_campaign_details_invoice`
--

CREATE TABLE `re_ads_campaign_details_invoice` (
  `id` int(11) NOT NULL,
  `txn_id` varchar(100) DEFAULT NULL,
  `client_id` int(11) NOT NULL,
  `unique_id` varchar(50) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `amount` varchar(100) DEFAULT NULL,
  `percent` varchar(100) DEFAULT NULL,
  `charge` varchar(100) DEFAULT NULL,
  `total` varchar(100) DEFAULT NULL,
  `employee` varchar(250) DEFAULT NULL,
  `created_at` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `re_ads_campaign_details_invoice`
--

INSERT INTO `re_ads_campaign_details_invoice` (`id`, `txn_id`, `client_id`, `unique_id`, `category`, `amount`, `percent`, `charge`, `total`, `employee`, `created_at`) VALUES
(1, '1789116460806', 266, '1789116472367-k44iya', 'Google Add', '5000', '20', '1000', '6000', 'Ad Dubay', '2026-09-11 08:47:52'),
(2, '1789116460806', 266, '1789116472368-6198rv', 'Meta add', '5000', '12', '600', '5600', 'Ad Dubay', '2026-09-11 08:47:52'),
(3, '1789133142036', 266, '1789133153225-6f2yoo', 'Google Add', '5000', '20', '1000', '6000', 'Ad Dubay', '2026-09-11 13:25:53'),
(4, '1789133142036', 266, '1789133153236-79avuc', 'Meta add', '5000', '12', '600', '5600', 'Ad Dubay', '2026-09-11 13:25:53');

-- --------------------------------------------------------

--
-- Table structure for table `re_amount_remaining`
--

CREATE TABLE `re_amount_remaining` (
  `id` int(255) NOT NULL,
  `txn_id` varchar(255) NOT NULL,
  `client_id` int(255) NOT NULL,
  `service_name` text NOT NULL,
  `price` varchar(255) NOT NULL,
  `employee` varchar(255) NOT NULL,
  `created_at` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_assign_quotation`
--

CREATE TABLE `re_assign_quotation` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `txn_id` varchar(64) NOT NULL,
  `user_id` int(11) NOT NULL,
  `assignment_mode` enum('single','team') NOT NULL DEFAULT 'single',
  `team_id` int(11) DEFAULT NULL,
  `assign_group_id` varchar(64) DEFAULT NULL,
  `deadline` date DEFAULT NULL,
  `created_at` varchar(100) DEFAULT NULL,
  `version` varchar(100) DEFAULT '1',
  `updated_at` varchar(100) DEFAULT NULL,
  `reminder_start_sent` tinyint(1) NOT NULL DEFAULT 0,
  `reminder_mid_sent` tinyint(1) NOT NULL DEFAULT 0,
  `reminder_day_before_sent` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_calculator_transactions`
--

CREATE TABLE `re_calculator_transactions` (
  `id` int(11) NOT NULL,
  `txn_id` varchar(100) DEFAULT NULL,
  `client_id` int(11) DEFAULT NULL,
  `service_name` varchar(255) DEFAULT NULL,
  `category_name` varchar(255) DEFAULT NULL,
  `editing_type_id` int(100) DEFAULT NULL,
  `editing_type_name` varchar(255) DEFAULT NULL,
  `editing_type_amount` varchar(100) DEFAULT NULL,
  `quantity` varchar(100) DEFAULT NULL,
  `include_content_posting` varchar(50) DEFAULT NULL,
  `include_thumbnail_creation` varchar(50) DEFAULT NULL,
  `total_amount` varchar(100) DEFAULT NULL,
  `employee` varchar(250) DEFAULT NULL,
  `plan_name` varchar(255) NOT NULL DEFAULT 'Customise	',
  `created_at` varchar(100) DEFAULT NULL,
  `include_youtube_video_posting` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `re_calculator_transactions`
--

INSERT INTO `re_calculator_transactions` (`id`, `txn_id`, `client_id`, `service_name`, `category_name`, `editing_type_id`, `editing_type_name`, `editing_type_amount`, `quantity`, `include_content_posting`, `include_thumbnail_creation`, `total_amount`, `employee`, `plan_name`, `created_at`, `include_youtube_video_posting`) VALUES
(1, '1', 114, 'website developmet', 'developmet', 1, NULL, '50000', '1', '0', '0', '50000', 'Ad Dubay', 'Customise', '2026-07-15 18:31:38', 0.00),
(2, '1', 114, 'gmb', 'smo', 2, NULL, '5000', '1', '0', '0', '5000', 'Ad Dubay', 'Customise', '2026-07-15 18:31:46', 0.00),
(3, '2', 266, 'website developmet', 'developmet', 1, NULL, '50000', '1', '0', '0', '50000', 'Ad Dubay', 'Customise', '2026-07-16 14:11:55', 0.00),
(4, '2', 266, 'gmb', 'smo', 2, NULL, '5000', '1', '0', '0', '5000', 'Ad Dubay', 'Customise', '2026-07-16 14:12:00', 0.00),
(5, NULL, 266, 'website developmet', 'developmet', 1, NULL, '50000', '4', '0', '0', '200000', 'Ad Dubay', 'Customise', '2026-09-10 14:26:27', 0.00),
(6, NULL, 266, 'gmb', 'smo', 2, NULL, '5000', '1', '0', '0', '5000', 'Ad Dubay', 'Customise', '2026-09-10 14:26:33', 0.00),
(7, NULL, 266, 'website developmet', 'developmet', 1, NULL, '50000', '1', '0', '0', '50000', 'Ad Dubay', 'Customise', '2026-09-10 14:26:52', 0.00),
(8, NULL, 266, 'gmb', 'smo', 2, NULL, '5000', '5', '0', '0', '25000', 'Ad Dubay', 'Customise', '2026-09-10 14:27:21', 0.00),
(9, NULL, 266, 'website developmet', 'developmet', 1, NULL, '50000', '1', '0', '0', '50000', 'Ad Dubay', 'Customise', '2026-09-10 14:27:50', 0.00),
(10, NULL, 266, 'gmb', 'smo', 2, NULL, '5000', '3', '0', '0', '15000', 'Ad Dubay', 'Customise', '2026-09-10 14:28:08', 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `re_categories`
--

CREATE TABLE `re_categories` (
  `category_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `created_at` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `re_categories`
--

INSERT INTO `re_categories` (`category_id`, `service_id`, `category_name`, `created_at`) VALUES
(1, 1, 'developmet', '2026-07-15 18:30:32'),
(2, 2, 'smo', '2026-07-15 18:30:52'),
(3, 3, 'standard editing', '2026-09-11 18:19:04');

-- --------------------------------------------------------

--
-- Table structure for table `re_client_requirement_links`
--

CREATE TABLE `re_client_requirement_links` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `expires_at` varchar(191) NOT NULL,
  `created_by` varchar(250) DEFAULT NULL,
  `created_at` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_complimentary`
--

CREATE TABLE `re_complimentary` (
  `id` int(255) NOT NULL,
  `txn_id` varchar(255) NOT NULL,
  `client_id` int(255) NOT NULL,
  `service_name` varchar(255) NOT NULL,
  `category_name` varchar(255) NOT NULL,
  `editing_type_id` int(255) DEFAULT NULL,
  `editing_type_name` varchar(255) NOT NULL,
  `editing_type_amount` varchar(255) NOT NULL,
  `quantity` varchar(255) NOT NULL,
  `include_content_posting` varchar(255) NOT NULL,
  `include_thumbnail_creation` varchar(255) NOT NULL,
  `total_amount` varchar(255) NOT NULL,
  `employee` varchar(255) NOT NULL,
  `created_at` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_complimentary_invoice`
--

CREATE TABLE `re_complimentary_invoice` (
  `id` int(255) NOT NULL,
  `client_id` int(255) NOT NULL,
  `txn_id` varchar(255) NOT NULL,
  `service_name` varchar(255) NOT NULL,
  `category_name` varchar(255) NOT NULL,
  `editing_type_id` int(255) DEFAULT NULL,
  `editing_type_name` varchar(255) NOT NULL,
  `editing_type_amount` varchar(255) NOT NULL,
  `quantity` varchar(255) NOT NULL,
  `include_content_posting` varchar(255) NOT NULL,
  `include_thumbnail_creation` varchar(255) NOT NULL,
  `total_amount` varchar(255) NOT NULL,
  `employee` varchar(255) NOT NULL,
  `created_at` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_discount`
--

CREATE TABLE `re_discount` (
  `id` int(255) NOT NULL,
  `client_id` int(255) NOT NULL,
  `txn_id` varchar(255) NOT NULL,
  `discount_type` varchar(255) NOT NULL,
  `discount_per` int(255) DEFAULT NULL,
  `discount_amt` int(255) DEFAULT NULL,
  `created_at` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `re_discount`
--

INSERT INTO `re_discount` (`id`, `client_id`, `txn_id`, `discount_type`, `discount_per`, `discount_amt`, `created_at`) VALUES
(1, 266, '1789112806172', 'Amount', 0, 1000, '2026-09-11 07:47:00'),
(2, 266, '1789116460806', 'Amount', 0, 1000, '2026-09-11 08:47:52');

-- --------------------------------------------------------

--
-- Table structure for table `re_discount_settings`
--

CREATE TABLE `re_discount_settings` (
  `id` int(11) NOT NULL,
  `discount_per` int(255) NOT NULL,
  `discount_amt` int(255) NOT NULL,
  `created_at` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `re_discount_settings`
--

INSERT INTO `re_discount_settings` (`id`, `discount_per`, `discount_amt`, `created_at`) VALUES
(1, 0, 2000, '2026-07-14 18:51:28');

-- --------------------------------------------------------

--
-- Table structure for table `re_editing_types`
--

CREATE TABLE `re_editing_types` (
  `editing_type_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `editing_type_name` varchar(100) DEFAULT NULL,
  `amount` varchar(100) NOT NULL,
  `created_at` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `re_editing_types`
--

INSERT INTO `re_editing_types` (`editing_type_id`, `service_id`, `category_id`, `editing_type_name`, `amount`, `created_at`) VALUES
(1, 1, 1, NULL, '50000', '2026-07-15 18:30:32'),
(2, 2, 2, NULL, '5000', '2026-07-15 18:30:52'),
(3, 3, 3, 'mobile', '1000', '2026-09-11 18:19:04'),
(4, 3, 3, 'Tablet editing', '500', '2026-09-11 18:48:02');

-- --------------------------------------------------------

--
-- Table structure for table `re_invoice`
--

CREATE TABLE `re_invoice` (
  `id` int(255) NOT NULL,
  `invoice_source` enum('calculator','proposal') NOT NULL DEFAULT 'calculator' COMMENT 'calculator = old txn flow, proposal = new proposal flow',
  `proposal_id` int(11) DEFAULT NULL COMMENT 'FK to proposals table (only for proposal flow)',
  `proforma_id` int(11) DEFAULT NULL COMMENT 'FK to proposal_proforma table (only for proposal flow)',
  `bill_type` enum('GST','NON_GST') DEFAULT 'NON_GST',
  `base_amount` decimal(12,2) DEFAULT NULL COMMENT 'Net amount before GST — proposal flow only',
  `gst_rate` decimal(5,2) DEFAULT NULL COMMENT 'GST rate e.g. 18.00 — proposal flow only',
  `gst_amount` decimal(12,2) DEFAULT NULL COMMENT 'GST amount — proposal flow only',
  `tds_amount` decimal(12,2) DEFAULT 0.00,
  `bill_number` varchar(50) DEFAULT NULL,
  `txn_id` varchar(255) NOT NULL,
  `client_id` int(255) NOT NULL,
  `client_name` varchar(255) NOT NULL,
  `client_organization` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `dg_employee` varchar(255) DEFAULT NULL,
  `duration_start_date` varchar(255) NOT NULL,
  `duration_end_date` varchar(255) NOT NULL,
  `payment_mode` varchar(255) NOT NULL,
  `payment_date` date DEFAULT NULL COMMENT 'Date payment was received',
  `payment_reference` varchar(255) DEFAULT NULL COMMENT 'UTR / Cheque number / Transaction ID',
  `client_gst_no` varchar(255) DEFAULT NULL,
  `client_pan_no` varchar(255) DEFAULT NULL,
  `tag_received_amt` varchar(255) NOT NULL DEFAULT 'pending',
  `received_amt` varchar(255) DEFAULT NULL,
  `current_amt` varchar(255) DEFAULT NULL,
  `previous_amt` varchar(255) DEFAULT NULL,
  `pricing_snapshot` longtext DEFAULT NULL COMMENT 'JSON of line items — copied from proposal_proforma.pricing_snapshot',
  `notes_snapshot` longtext DEFAULT NULL COMMENT 'JSON notes — copied from proposal_proforma.notes_snapshot',
  `terms_snapshot` longtext DEFAULT NULL COMMENT 'JSON terms — copied from proposal_proforma.terms_snapshot',
  `created_at` varchar(255) NOT NULL,
  `public_token_hash` varchar(64) DEFAULT NULL,
  `public_token_expires` datetime DEFAULT NULL,
  `realized_ad_budget` decimal(15,2) DEFAULT 0.00,
  `realized_google_budget` decimal(15,2) DEFAULT 0.00,
  `realized_meta_budget` decimal(15,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `re_invoice`
--

INSERT INTO `re_invoice` (`id`, `invoice_source`, `proposal_id`, `proforma_id`, `bill_type`, `base_amount`, `gst_rate`, `gst_amount`, `tds_amount`, `bill_number`, `txn_id`, `client_id`, `client_name`, `client_organization`, `email`, `phone`, `address`, `dg_employee`, `duration_start_date`, `duration_end_date`, `payment_mode`, `payment_date`, `payment_reference`, `client_gst_no`, `client_pan_no`, `tag_received_amt`, `received_amt`, `current_amt`, `previous_amt`, `pricing_snapshot`, `notes_snapshot`, `terms_snapshot`, `created_at`, `public_token_hash`, `public_token_expires`, `realized_ad_budget`, `realized_google_budget`, `realized_meta_budget`) VALUES
(1, 'proposal', NULL, NULL, 'NON_GST', 60000.00, 18.00, 0.00, 500.00, '01', '1789130272454', 266, 'ashish', 'ashsih', 'ad201054@gmail.com', '9302300834', 'xyz', 'Ad Dubay', '2026-09-12 00:00:00.000', '2026-10-16 00:00:00.000', 'UPI', '2026-09-11', NULL, '', '', 'pending', '50000', '10000', '0', '[{\"id\":1789130016067,\"service_name\":\"website developmet\",\"category_name\":\"developmet\",\"editing_type_name\":null,\"editing_type_amount\":\"50000\",\"quantity\":1,\"unit_price\":\"50000\",\"total_price\":50000,\"total_amount\":50000,\"include_content_posting\":0,\"include_thumbnail_creation\":0,\"include_youtube_video_posting\":0,\"include_in_total\":true,\"source\":\"custom_graphic\",\"service\":\"website developmet - developmet\"},{\"id\":1789130025467,\"service_name\":\"gmb\",\"category_name\":\"smo\",\"editing_type_name\":null,\"editing_type_amount\":\"5000\",\"quantity\":2,\"unit_price\":\"5000\",\"total_price\":10000,\"total_amount\":10000,\"include_content_posting\":0,\"include_thumbnail_creation\":0,\"include_youtube_video_posting\":0,\"include_in_total\":true,\"source\":\"custom_graphic\",\"service\":\"gmb - smo\"}]', '[]', '[]', '2026-09-11 12:38:03', '5c948fed7ab01ae9e3dbcaddfd61eab2d6fd2ac8bb70365079e9e99fc11ecac1', '2026-10-11 12:38:03', 0.00, 0.00, 0.00),
(2, 'proposal', NULL, 4, 'NON_GST', 74500.00, 18.00, 0.00, 400.00, '02', '1789133142036', 266, 'ashish', 'ashsih', 'ad201054@gmail.com', '9302300834', 'xyz', 'Ad Dubay', '2026-09-11 00:00:00.000', '2026-10-11 00:00:00.000', 'UPI', '2026-09-11', NULL, '', '', 'pending', '50000', '24500', '0', '[{\"id\":1789130839536,\"service_name\":\"website developmet\",\"category_name\":\"developmet\",\"editing_type_name\":null,\"editing_type_amount\":\"50000\",\"quantity\":1,\"unit_price\":\"50000\",\"total_price\":50000,\"total_amount\":50000,\"include_content_posting\":0,\"include_thumbnail_creation\":0,\"include_youtube_video_posting\":0,\"include_in_total\":true,\"source\":\"custom_graphic\",\"service\":\"website developmet - developmet\"},{\"id\":1789130844390,\"service_name\":\"gmb\",\"category_name\":\"smo\",\"editing_type_name\":null,\"editing_type_amount\":\"5000\",\"quantity\":5,\"unit_price\":\"5000\",\"total_price\":25000,\"total_amount\":25000,\"include_content_posting\":0,\"include_thumbnail_creation\":0,\"include_youtube_video_posting\":0,\"include_in_total\":true,\"source\":\"custom_graphic\",\"service\":\"gmb - smo\"},{\"txn_id\":\"4\",\"client_id\":\"266\",\"service_name\":\"video editing\",\"category_name\":\"standard editing\",\"editing_type_id\":4,\"editing_type_name\":\"Tablet editing\",\"editing_type_amount\":\"500\",\"quantity\":1,\"include_content_posting\":0,\"include_thumbnail_creation\":0,\"include_youtube_video_posting\":0,\"total_amount\":500,\"employee\":\"Ad Dubay\",\"id\":\"1789132784008s2e\"},{\"txn_id\":\"4\",\"client_id\":\"266\",\"service_name\":\"video editing\",\"category_name\":\"standard editing\",\"editing_type_id\":3,\"editing_type_name\":\"mobile\",\"editing_type_amount\":\"1000\",\"quantity\":1,\"include_content_posting\":0,\"include_thumbnail_creation\":0,\"include_youtube_video_posting\":0,\"total_amount\":1000,\"employee\":\"Ad Dubay\",\"id\":\"1789132795512ffl\"},{\"source\":\"custom_service_charge\",\"service_type\":\"Graphic Service\",\"service_name\":\"Service Charge\",\"category_name\":\"Google Add\",\"editing_type_name\":\"Google Add Campaign Management & Optimization (20%)\",\"quantity\":1,\"unit_price\":1000,\"editing_type_amount\":1000,\"total_price\":1000,\"total_amount\":1000,\"include_in_total\":true},{\"source\":\"custom_service_charge\",\"service_type\":\"Graphic Service\",\"service_name\":\"Service Charge\",\"category_name\":\"Meta add\",\"editing_type_name\":\"Meta add Campaign Management & Optimization (12%)\",\"quantity\":1,\"unit_price\":600,\"editing_type_amount\":600,\"total_price\":600,\"total_amount\":600,\"include_in_total\":true}]', '[]', '[]', '2026-09-11 13:25:53', 'd1c8989a0010e952cc6f9464c574edd19757026dccd3a7f9e226fb0c815886f3', '2026-10-11 13:25:53', 10000.00, 5000.00, 5000.00);

-- --------------------------------------------------------

--
-- Table structure for table `re_invoice_client_notes`
--

CREATE TABLE `re_invoice_client_notes` (
  `id` int(255) NOT NULL,
  `client_id` int(255) NOT NULL,
  `txn_id` varchar(255) NOT NULL,
  `note_name` varchar(255) NOT NULL,
  `created_at` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_invoice_graphic`
--

CREATE TABLE `re_invoice_graphic` (
  `id` int(255) NOT NULL,
  `txn_id` varchar(255) NOT NULL,
  `client_id` int(255) NOT NULL,
  `service_name` varchar(255) NOT NULL,
  `category_name` varchar(255) NOT NULL,
  `editing_type_id` int(255) DEFAULT NULL,
  `editing_type_name` varchar(255) NOT NULL,
  `editing_type_amount` varchar(255) NOT NULL,
  `quantity` varchar(255) NOT NULL,
  `include_content_posting` varchar(255) NOT NULL,
  `include_thumbnail_creation` varchar(255) NOT NULL,
  `total_amount` varchar(255) NOT NULL,
  `plan_name` varchar(255) DEFAULT NULL,
  `employee` varchar(255) NOT NULL,
  `created_at` varchar(255) NOT NULL,
  `include_youtube_video_posting` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `re_invoice_graphic`
--

INSERT INTO `re_invoice_graphic` (`id`, `txn_id`, `client_id`, `service_name`, `category_name`, `editing_type_id`, `editing_type_name`, `editing_type_amount`, `quantity`, `include_content_posting`, `include_thumbnail_creation`, `total_amount`, `plan_name`, `employee`, `created_at`, `include_youtube_video_posting`) VALUES
(5, '1789116460806', 266, 'website developmet', 'developmet', NULL, '', '50000', '1', '0', '0', '50000', '', 'Ad Dubay', '2026-09-11 08:47:52', 0.00),
(6, '1789116460806', 266, 'gmb', 'smo', NULL, '', '5000', '1', '0', '0', '5000', '', 'Ad Dubay', '2026-09-11 08:47:52', 0.00),
(7, '1789116460806', 266, 'Service Charge', 'Google Add', NULL, 'Google Add Campaign Management & Optimization (20%)', '1000', '1', '0', '0', '1000', '', 'Ad Dubay', '2026-09-11 08:47:52', 0.00),
(8, '1789116460806', 266, 'Service Charge', 'Meta add', NULL, 'Meta add Campaign Management & Optimization (12%)', '600', '1', '0', '0', '600', '', 'Ad Dubay', '2026-09-11 08:47:52', 0.00),
(9, '1789130272454', 266, 'website developmet', 'developmet', NULL, '', '50000', '1', '0', '0', '50000', '', 'Ad Dubay', '2026-09-11 12:38:03', 0.00),
(10, '1789130272454', 266, 'gmb', 'smo', NULL, '', '5000', '2', '0', '0', '10000', '', 'Ad Dubay', '2026-09-11 12:38:03', 0.00),
(11, '1789133142036', 266, 'website developmet', 'developmet', NULL, '', '50000', '1', '0', '0', '50000', '', 'Ad Dubay', '2026-09-11 13:25:53', 0.00),
(12, '1789133142036', 266, 'gmb', 'smo', NULL, '', '5000', '5', '0', '0', '25000', '', 'Ad Dubay', '2026-09-11 13:25:53', 0.00),
(13, '1789133142036', 266, 'video editing', 'standard editing', NULL, 'Tablet editing', '0', '1', '0', '0', '0', '', 'Ad Dubay', '2026-09-11 13:25:53', 0.00),
(14, '1789133142036', 266, 'video editing', 'standard editing', NULL, 'mobile', '0', '1', '0', '0', '0', '', 'Ad Dubay', '2026-09-11 13:25:53', 0.00),
(15, '1789133142036', 266, 'Service Charge', 'Google Add', NULL, 'Google Add Campaign Management & Optimization (20%)', '1000', '1', '0', '0', '1000', '', 'Ad Dubay', '2026-09-11 13:25:53', 0.00),
(16, '1789133142036', 266, 'Service Charge', 'Meta add', NULL, 'Meta add Campaign Management & Optimization (12%)', '600', '1', '0', '0', '600', '', 'Ad Dubay', '2026-09-11 13:25:53', 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `re_invoice_notes_data`
--

CREATE TABLE `re_invoice_notes_data` (
  `id` int(11) NOT NULL,
  `note_text` text NOT NULL,
  `created_at` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_notes_bydefault`
--

CREATE TABLE `re_notes_bydefault` (
  `id` int(255) NOT NULL,
  `note_text` varchar(1000) NOT NULL,
  `created_at` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_notes_data`
--

CREATE TABLE `re_notes_data` (
  `id` int(11) NOT NULL,
  `note_text` text NOT NULL,
  `created_at` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_plans_notes`
--

CREATE TABLE `re_plans_notes` (
  `id` int(255) NOT NULL,
  `plan_id` varchar(255) DEFAULT NULL,
  `note_name` varchar(255) NOT NULL,
  `plan` varchar(255) NOT NULL,
  `created_at` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_plan_client_notes`
--

CREATE TABLE `re_plan_client_notes` (
  `id` int(255) NOT NULL,
  `client_id` int(255) NOT NULL,
  `txn_id` varchar(255) NOT NULL,
  `note_name` varchar(255) NOT NULL,
  `created_at` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_plan_data`
--

CREATE TABLE `re_plan_data` (
  `id` int(11) NOT NULL,
  `plan_id` int(255) NOT NULL,
  `plan_name` varchar(250) NOT NULL,
  `service_name` varchar(255) DEFAULT NULL,
  `editing_type_id` int(255) DEFAULT NULL,
  `category_name` varchar(255) DEFAULT NULL,
  `editing_type_name` varchar(255) DEFAULT NULL,
  `editing_type_amount` varchar(100) DEFAULT NULL,
  `quantity` varchar(100) DEFAULT NULL,
  `include_content_posting` varchar(50) DEFAULT NULL,
  `include_thumbnail_creation` varchar(50) DEFAULT NULL,
  `total_amount` varchar(100) DEFAULT NULL,
  `amount_ads` varchar(255) DEFAULT NULL,
  `percent_ads` varchar(255) DEFAULT NULL,
  `charge_ads` varchar(255) DEFAULT NULL,
  `total_ads` varchar(255) DEFAULT NULL,
  `employee` varchar(250) DEFAULT NULL,
  `created_at` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_plan_details`
--

CREATE TABLE `re_plan_details` (
  `id` int(11) NOT NULL,
  `plan_name` varchar(255) NOT NULL,
  `created_at` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_proposals`
--

CREATE TABLE `re_proposals` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `txn_id` varchar(255) DEFAULT NULL,
  `proposal_type` enum('development','digital_marketing') NOT NULL,
  `billing_type` enum('monthly','yearly','custom') NOT NULL,
  `billing_start_date` date DEFAULT NULL,
  `billing_end_date` date DEFAULT NULL,
  `sections_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '{}' CHECK (json_valid(`sections_json`)),
  `optional_toggles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '{"strategy_overview":false,"expected_results":false,"why_choose_us":false}' CHECK (json_valid(`optional_toggles`)),
  `pricing_table_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]' CHECK (json_valid(`pricing_table_json`)),
  `grand_total_excl_gst` decimal(12,2) DEFAULT 0.00,
  `terms_notes_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`terms_notes_json`)),
  `status` enum('draft','approved','sent','proforma_generated','proforma_sent','payment_awaited','payment_received','partially_paid','invoiced','submitted','admin_reviewed','client_sent','client_approved','client_rejected','changes','rejected') DEFAULT 'draft',
  `pdf_path` varchar(500) DEFAULT NULL,
  `created_by` varchar(200) DEFAULT NULL,
  `updated_by` varchar(200) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `notes_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Selected notes [{id, note_name}]' CHECK (json_valid(`notes_json`)),
  `additional_remarks` text DEFAULT NULL,
  `client_instructions` text DEFAULT NULL,
  `public_token_hash` varchar(64) DEFAULT NULL,
  `public_token_expires` datetime DEFAULT NULL,
  `public_snapshot_json` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `re_proposals`
--

INSERT INTO `re_proposals` (`id`, `client_id`, `txn_id`, `proposal_type`, `billing_type`, `billing_start_date`, `billing_end_date`, `sections_json`, `optional_toggles`, `pricing_table_json`, `grand_total_excl_gst`, `terms_notes_json`, `status`, `pdf_path`, `created_by`, `updated_by`, `created_at`, `updated_at`, `notes_json`, `additional_remarks`, `client_instructions`, `public_token_hash`, `public_token_expires`, `public_snapshot_json`) VALUES
(2, 266, '1789130846886', 'development', 'monthly', '2026-09-11', '2026-10-11', '{\"cover_page\":{\"duration\":\"1 Month\",\"proposal_date\":\"11 September 2026\",\"proposal_validity\":\"7 Days\",\"prepared_by\":\"DOAGuru InfoSystems\",\"website\":\"www.doaguru.com\"},\"executive_summary\":\"We are pleased to present this proposal for ashsih. This document outlines our recommended approach, scope of services, timeline, and investment to help achieve your business objectives.\\n\\nOur team has carefully evaluated your requirements and developed a comprehensive strategy that aligns with your goals and budget. We believe this partnership will deliver measurable results and drive sustainable growth for your organization.\",\"about_us\":\"DoaGuru InfoSystems is a leading digital solutions company specializing in web development, digital marketing, graphic design, and IT consulting. With a proven track record of delivering exceptional results, we partner with businesses of all sizes to transform their digital presence.\\n\\nOur Expertise:\\n• Digital Marketing (SEO, SEM, Social Media, Content Marketing)\\n• Web & App Development (React, Node.js, Mobile Apps)\\n• Graphic Design & Branding (Logo, UI/UX, Print Media)\\n• IT Consulting & Cloud Solutions\\n\\nWith a dedicated team of 50+ professionals and 200+ successful projects delivered, we bring the expertise and commitment needed to drive your business forward.\",\"client_problem\":\"Based on our initial discussions and analysis, we have identified the following key challenges that ashsih is currently facing:\\n\\n1. [Challenge 1] — Describe the specific problem area\\n2. [Challenge 2] — Describe another pain point\\n3. [Challenge 3] — Additional challenge\\n\\nThese challenges are impacting [area of business] and require a strategic, data-driven approach to resolve effectively.\",\"proposed_solution\":\"To address the challenges outlined above, we propose the following solution:\\n\\nApproach:\\nOur strategy combines [methodology/approach] with [tools/platforms] to deliver a comprehensive solution that addresses each challenge systematically.\\n\\nKey Components:\\n1. [Component 1] — Brief description of what this involves\\n2. [Component 2] — Brief description\\n3. [Component 3] — Brief description\\n\\nThis solution is designed to be scalable, measurable, and aligned with your business objectives.\",\"scope_of_work\":[],\"strategy_overview\":\"Our strategic approach involves a phased implementation:\\n\\nPhase 1 — Foundation & Setup (Month 1)\\n• Initial audit and analysis\\n• Strategy development and planning\\n• Tool setup and configuration\\n\\nPhase 2 — Execution & Optimization (Month 2-3)\\n• Campaign launch and management\\n• Content creation and distribution\\n• Performance monitoring and optimization\\n\\nPhase 3 — Growth & Scaling (Month 4+)\\n• Advanced optimization techniques\\n• Scaling successful campaigns\\n• Monthly reporting and strategy refinement\",\"timeline\":[],\"expected_results\":\"Based on our experience with similar projects, we anticipate the following results:\\n\\nWithin 3 Months:\\n• [Result 1 with metric, e.g., 30% increase in organic traffic]\\n• [Result 2 with metric]\\n\\nWithin 6 Months:\\n• [Result 3 with metric]\\n• [Result 4 with metric]\\n\\nNote: These projections are based on industry benchmarks and past performance. Actual results may vary based on market conditions and implementation consistency.\",\"pricing_investment\":[],\"terms_conditions\":[],\"notes_selection\":[],\"additional_remarks\":\"\",\"client_instructions\":\"\",\"why_choose_us\":\"Why DoaGuru InfoSystems?\\n\\n✓ Proven Track Record — 200+ successful projects across diverse industries\\n✓ Dedicated Team — Assigned project managers and specialists for each client\\n✓ Transparent Reporting — Monthly reports with clear metrics and ROI tracking\\n✓ Flexible Engagement — Customizable packages to fit your budget and goals\\n✓ 24/7 Support — Round-the-clock assistance for critical issues\\n✓ Result-Oriented — We focus on measurable outcomes, not just activities\",\"approval_acceptance\":{\"our_signatory_name\":\"\",\"our_signatory_designation\":\"\",\"client_signatory_name\":\"\",\"client_signatory_designation\":\"\",\"acceptance_date\":\"\"},\"pricing_discount\":{\"type\":\"Amount\",\"value\":0}}', '{\"client_problem\":false,\"strategy_overview\":false,\"timeline\":false,\"expected_results\":false,\"additional_remarks\":false,\"client_instructions\":false,\"why_choose_us\":false}', '[{\"id\":3,\"service\":\"website developmet - developmet\",\"service_name\":\"website developmet\",\"category_name\":\"developmet\",\"editing_type_name\":null,\"quantity\":\"1\",\"unit_price\":50000,\"total_price\":50000,\"include_in_total\":true,\"source\":\"custom_graphic\"},{\"id\":4,\"service\":\"gmb - smo\",\"service_name\":\"gmb\",\"category_name\":\"smo\",\"editing_type_name\":null,\"quantity\":\"1\",\"unit_price\":5000,\"total_price\":5000,\"include_in_total\":true,\"source\":\"custom_graphic\"},{\"id\":1789133024408,\"service_name\":\"video editing\",\"category_name\":\"standard editing\",\"editing_type_name\":\"mobile\",\"editing_type_amount\":\"1000\",\"quantity\":1,\"unit_price\":\"1000\",\"total_price\":1000,\"total_amount\":1000,\"include_content_posting\":0,\"include_thumbnail_creation\":0,\"include_youtube_video_posting\":0,\"include_in_total\":true,\"source\":\"custom_graphic\",\"service\":\"video editing - standard editing (mobile)\"},{\"id\":1789133035616,\"service_name\":\"video editing\",\"category_name\":\"standard editing\",\"editing_type_name\":\"Tablet editing\",\"editing_type_amount\":\"500\",\"quantity\":1,\"unit_price\":\"500\",\"total_price\":500,\"total_amount\":500,\"include_content_posting\":0,\"include_thumbnail_creation\":0,\"include_youtube_video_posting\":0,\"include_in_total\":true,\"source\":\"custom_graphic\",\"service\":\"video editing - standard editing (Tablet editing)\"}]', 56500.00, '[]', 'proforma_generated', NULL, 'Ad Dubay', 'Ad Dubay', '2026-09-11 12:47:26', '2026-09-11 13:24:01', '[]', '', '', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `re_proposal_payment_records`
--

CREATE TABLE `re_proposal_payment_records` (
  `id` int(11) NOT NULL,
  `proforma_id` int(11) NOT NULL,
  `proposal_id` int(11) DEFAULT NULL,
  `client_id` int(11) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `is_gst` tinyint(1) DEFAULT 0,
  `tds_applicable` tinyint(1) DEFAULT 0,
  `tds_percentage` decimal(6,2) DEFAULT 0.00,
  `tds_amount` decimal(12,2) DEFAULT 0.00,
  `final_amount` decimal(12,2) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_mode` varchar(50) DEFAULT NULL,
  `transaction_reference` varchar(255) DEFAULT NULL,
  `status` enum('pending_approval','approved','rejected') DEFAULT 'pending_approval',
  `approved_by` varchar(200) DEFAULT NULL,
  `remark` text DEFAULT NULL,
  `created_by` varchar(200) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `notes` text DEFAULT NULL,
  `txn_id` varchar(255) DEFAULT NULL,
  `realized_ad_budget` decimal(15,2) DEFAULT 0.00,
  `realized_google_budget` decimal(15,2) DEFAULT 0.00,
  `realized_meta_budget` decimal(15,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `re_proposal_payment_records`
--

INSERT INTO `re_proposal_payment_records` (`id`, `proforma_id`, `proposal_id`, `client_id`, `amount`, `is_gst`, `tds_applicable`, `tds_percentage`, `tds_amount`, `final_amount`, `payment_date`, `payment_mode`, `transaction_reference`, `status`, `approved_by`, `remark`, `created_by`, `created_at`, `notes`, `txn_id`, `realized_ad_budget`, `realized_google_budget`, `realized_meta_budget`) VALUES
(2, 4, 2, 266, 50000.00, 0, 1, 1.00, 400.00, 49600.00, '2026-09-11', 'UPI', '', 'approved', 'Ad Dubay', NULL, 'Ad Dubay', '2026-09-11 13:25:42', NULL, '1789133142036', 10000.00, 5000.00, 5000.00);

-- --------------------------------------------------------

--
-- Table structure for table `re_proposal_proforma`
--

CREATE TABLE `re_proposal_proforma` (
  `id` int(11) NOT NULL,
  `proposal_id` int(11) DEFAULT NULL,
  `client_id` int(11) NOT NULL,
  `txn_id` varchar(255) DEFAULT NULL,
  `is_gst` tinyint(1) DEFAULT 0,
  `gst_rate` decimal(5,2) DEFAULT 18.00,
  `base_amount` decimal(12,2) DEFAULT 0.00,
  `gst_amount` decimal(12,2) DEFAULT 0.00,
  `total_amount` decimal(12,2) DEFAULT 0.00,
  `status` enum('generated','sent','payment_awaited','payment_received','partially_paid','paid') DEFAULT 'generated',
  `payment_status` enum('pending','partial','fully-paid') DEFAULT 'pending',
  `pdf_path` varchar(500) DEFAULT NULL,
  `created_by` varchar(200) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `pricing_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Snapshot of proposal pricing_table_json' CHECK (json_valid(`pricing_snapshot`)),
  `ads_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Snapshot of Ads Campaign budget items (JSON array)',
  `notes_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Snapshot of proposal notes_json' CHECK (json_valid(`notes_snapshot`)),
  `terms_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Snapshot of proposal terms_notes_json' CHECK (json_valid(`terms_snapshot`)),
  `remarks_snapshot` text DEFAULT NULL,
  `client_instructions_snapshot` text DEFAULT NULL,
  `source_type` enum('proposal','manual') DEFAULT 'proposal',
  `source_id` int(11) DEFAULT NULL,
  `public_token_hash` varchar(64) DEFAULT NULL,
  `public_token_expires` datetime DEFAULT NULL,
  `duration_start_date` date DEFAULT NULL,
  `duration_end_date` date DEFAULT NULL,
  `discount_snapshot` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `re_proposal_proforma`
--

INSERT INTO `re_proposal_proforma` (`id`, `proposal_id`, `client_id`, `txn_id`, `is_gst`, `gst_rate`, `base_amount`, `gst_amount`, `total_amount`, `status`, `pdf_path`, `created_by`, `created_at`, `updated_at`, `pricing_snapshot`, `ads_snapshot`, `notes_snapshot`, `terms_snapshot`, `remarks_snapshot`, `client_instructions_snapshot`, `source_type`, `source_id`, `public_token_hash`, `public_token_expires`, `duration_start_date`, `duration_end_date`, `discount_snapshot`) VALUES
(4, 2, 266, '1789132741976', 0, 18.00, 74500.00, 0.00, 74500.00, 'partially_paid', NULL, 'System', '2026-09-11 13:19:01', '2026-09-11 13:25:53', '[{\"id\":1789130839536,\"service_name\":\"website developmet\",\"category_name\":\"developmet\",\"editing_type_name\":null,\"editing_type_amount\":\"50000\",\"quantity\":1,\"unit_price\":\"50000\",\"total_price\":50000,\"total_amount\":50000,\"include_content_posting\":0,\"include_thumbnail_creation\":0,\"include_youtube_video_posting\":0,\"include_in_total\":true,\"source\":\"custom_graphic\",\"service\":\"website developmet - developmet\"},{\"id\":1789130844390,\"service_name\":\"gmb\",\"category_name\":\"smo\",\"editing_type_name\":null,\"editing_type_amount\":\"5000\",\"quantity\":5,\"unit_price\":\"5000\",\"total_price\":25000,\"total_amount\":25000,\"include_content_posting\":0,\"include_thumbnail_creation\":0,\"include_youtube_video_posting\":0,\"include_in_total\":true,\"source\":\"custom_graphic\",\"service\":\"gmb - smo\"},{\"txn_id\":\"4\",\"client_id\":\"266\",\"service_name\":\"video editing\",\"category_name\":\"standard editing\",\"editing_type_id\":4,\"editing_type_name\":\"Tablet editing\",\"editing_type_amount\":\"500\",\"quantity\":1,\"include_content_posting\":0,\"include_thumbnail_creation\":0,\"include_youtube_video_posting\":0,\"total_amount\":500,\"employee\":\"Ad Dubay\",\"id\":\"1789132784008s2e\"},{\"txn_id\":\"4\",\"client_id\":\"266\",\"service_name\":\"video editing\",\"category_name\":\"standard editing\",\"editing_type_id\":3,\"editing_type_name\":\"mobile\",\"editing_type_amount\":\"1000\",\"quantity\":1,\"include_content_posting\":0,\"include_thumbnail_creation\":0,\"include_youtube_video_posting\":0,\"total_amount\":1000,\"employee\":\"Ad Dubay\",\"id\":\"1789132795512ffl\"}]', '[{\"id\":\"178913277197992v\",\"service_name\":\"Ads Campaign\",\"category_name\":\"Google Add\",\"category\":\"Google Add\",\"quantity\":1,\"unit_price\":6000,\"total_price\":6000,\"total_amount\":6000,\"total\":6000,\"include_in_total\":true,\"source\":\"custom_ads\",\"budget\":5000,\"amount\":5000,\"percent\":20,\"charge\":1000},{\"id\":\"1789132771979sv2\",\"service_name\":\"Ads Campaign\",\"category_name\":\"Meta add\",\"category\":\"Meta add\",\"quantity\":1,\"unit_price\":5600,\"total_price\":5600,\"total_amount\":5600,\"total\":5600,\"include_in_total\":true,\"source\":\"custom_ads\",\"budget\":5000,\"amount\":5000,\"percent\":12,\"charge\":600}]', '[]', '[]', '', '', 'proposal', NULL, NULL, NULL, '2026-09-26', '2026-10-10', '{\"type\":\"Amount\",\"value\":500,\"discount_type\":\"amount\",\"discount_amt\":500,\"discount_per\":0}');

-- --------------------------------------------------------

--
-- Table structure for table `re_public_access_logs`
--

CREATE TABLE `re_public_access_logs` (
  `id` int(11) NOT NULL,
  `doc_type` varchar(50) NOT NULL,
  `doc_id` int(11) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `status` varchar(20) NOT NULL COMMENT 'Success, 403, 404, etc.',
  `accessed_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `re_public_access_logs`
--

INSERT INTO `re_public_access_logs` (`id`, `doc_type`, `doc_id`, `ip_address`, `user_agent`, `status`, `accessed_at`) VALUES
(1, 'final', 2147483647, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'Success', '2026-07-16 14:15:52'),
(2, 'final', 2147483647, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', 'Success', '2026-09-11 13:19:34'),
(3, 'final', 2147483647, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', 'Success', '2026-09-11 13:21:28'),
(4, 'final', 2147483647, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', 'Success', '2026-09-11 13:21:31'),
(5, 'final', 2147483647, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', 'Success', '2026-09-11 13:21:55'),
(6, 'final', 2147483647, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', 'Success', '2026-09-11 13:30:38'),
(7, 'final', 2147483647, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', 'Success', '2026-09-11 13:30:52'),
(8, 'final', 2147483647, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', 'Success', '2026-09-11 13:33:10'),
(9, 'final', 2147483647, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', 'Success', '2026-09-11 13:33:37'),
(10, 'final', 2147483647, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', 'Success', '2026-09-11 13:55:08'),
(11, 'final', 2147483647, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', 'Success', '2026-09-11 14:03:36'),
(12, 'final', 2147483647, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', 'Success', '2026-09-11 14:04:23'),
(13, 'final', 2147483647, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', 'Success', '2026-09-11 14:04:40'),
(14, 'final', 2147483647, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', 'Success', '2026-09-11 14:04:59'),
(15, 'final', 2147483647, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', 'Success', '2026-09-11 14:05:19'),
(16, 'final', 2147483647, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', 'Success', '2026-09-11 14:05:49'),
(17, 'final', 2147483647, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', 'Success', '2026-09-11 14:06:19'),
(18, 'final', 2147483647, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', 'Success', '2026-09-11 14:18:21'),
(19, 'final', 2147483647, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', 'Success', '2026-09-11 18:43:02');

-- --------------------------------------------------------

--
-- Table structure for table `re_quotation_status`
--

CREATE TABLE `re_quotation_status` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `txn_id` varchar(100) NOT NULL,
  `status` enum('pending','approved','admin_approved','admin_rejected','client_sent','client_approved','client_rejected','proforma_invoice_generated','proforma_invoice_sent','payment_received_invoice_ready','invoice_sent','team_assigned','strategy_saved','strategy_sent_to_admin','strategy_admin_approved','strategy_admin_rejected','strategy_changes_requested','strategy_client_sent','strategy_client_approved','strategy_client_rejected','tasks_assigned','execution') DEFAULT 'pending',
  `approved_by` varchar(255) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_requirement_submissions`
--

CREATE TABLE `re_requirement_submissions` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `link_id` int(11) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(32) NOT NULL,
  `requirement` text DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_requirement_submission_items`
--

CREATE TABLE `re_requirement_submission_items` (
  `id` int(11) NOT NULL,
  `submission_id` int(11) NOT NULL,
  `category` varchar(191) NOT NULL,
  `sub_category` varchar(191) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `qty` int(11) NOT NULL DEFAULT 0,
  `line_total` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_revenue_engine_ads`
--

CREATE TABLE `re_revenue_engine_ads` (
  `id` int(11) NOT NULL,
  `ads_category` varchar(250) DEFAULT NULL,
  `amt_range_start` varchar(100) DEFAULT NULL,
  `amt_range_end` varchar(100) DEFAULT NULL,
  `percentage` varchar(20) DEFAULT NULL,
  `created_at` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `re_revenue_engine_ads`
--

INSERT INTO `re_revenue_engine_ads` (`id`, `ads_category`, `amt_range_start`, `amt_range_end`, `percentage`, `created_at`) VALUES
(1, 'Meta add', '1000', '10000', '12', '2026-09-10 15:11:36'),
(2, 'Google Add', '1000', '10000', '20', '2026-09-10 15:26:57');

-- --------------------------------------------------------

--
-- Table structure for table `re_revenue_engine_client_details`
--

CREATE TABLE `re_revenue_engine_client_details` (
  `id` int(11) NOT NULL,
  `client_name` varchar(250) DEFAULT NULL,
  `client_organization` varchar(250) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(100) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `dg_employee` varchar(250) DEFAULT NULL,
  `created_at` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `re_revenue_engine_client_details`
--

INSERT INTO `re_revenue_engine_client_details` (`id`, `client_name`, `client_organization`, `email`, `phone`, `address`, `dg_employee`, `created_at`) VALUES
(17, 'google meta ', 'google ', 'google@gemail.com', '8585858585', 'USA 1', 'Abhinav Pandey', '2025-08-23 18:27:11'),
(20, 'Chirag Gala', 'Gala Developers', 'Galadevelopers.jbp@gmail.com', '9244145552', 'Gala developers 3rd floor near maharashtra school,, Jabalpur, India, Madhya Pradesh', 'Abhinav Pandey', '2025-08-05 15:32:37'),
(25, 'Chirag Gala', 'Gala Developers', 'Galadevelopers.jbp@gmail.com', '9244145552', 'Gala developers 3rd floor near maharashtra school,, Jabalpur, India, Madhya Pradesh', 'Mohammad Mazhar', '2025-08-05 17:43:27'),
(26, 'Akhil Grover', 'Hotel Satya Ashoka', 'hotelsatyaashoka@hotmail.com', '9407561411', 'Pandit Ravishankar Shukla Stadium, Opposite, Wright Town Jabalpur', 'Mohammad Mazhar', '2025-09-22 19:35:44'),
(27, 'test of client ', 'Gala Developers', 'doaguruinfosystems@gmail.com', '7586868566', 'jjjjjjj', 'Dev BD', '2025-08-08 11:11:31'),
(29, 'Water purifier', 'Water purifier', 'test@gmail.com', '4567890234', 'Right Town, Jabalpur, MP', 'Abhinav Pandey', '2025-08-11 14:35:47'),
(32, 'Adarsh Agrawal', 'Chaitanya Promoters & Developers', 'chaitanyacity1234@gmail.com', '9111391113', 'Sadar Main Road, Oppsite Sadar Post office, Jabalpur', 'Mohammad Mazhar', '2025-08-12 18:12:48'),
(33, 'Ayushmaan', 'Ayushmaan Multispecialist Hospital', 'ayushmanhospital@gmail.com', '7000090721', 'Ayushman Multispeciality Hospital, Station Road, Khitola, Sihora, Sihora 483225', 'Mohammad Mazhar', '2025-08-15 18:17:26'),
(34, 'Ayushman ', 'Ayushman Multispeciality Hospital Sihora', 'ayushmanhospital@gmail.com', '7000090721', 'Station Road Khitola, Sihora, Madhya Pradesh 483225', 'Vishakha Agrahari', '2025-08-15 19:58:24'),
(35, 'Rajkumar Vishwaraj', 'N/A', 'rahkumargupta2331973@gmail.com', '9981826693', 'Raipur Kachuliyam Rewa, MP', 'Mohammad Mazhar', '2025-08-18 20:14:58'),
(36, 'Akshay Kumar', 'SPA', 'akshay9062kumar@gmail.com', '8305271320', 'Nanak Nagar BhawarKuan', 'Mohammad Mazhar', '2025-08-18 20:14:23'),
(37, 'Keshari Chauhan', 'Chauhan construction interior company', 'madhuinterior81@gmail.com', '8303087030', 'Lucknow Uttar Pradesh', 'Mohammad Mazhar', '2025-08-18 20:41:02'),
(38, 'Neelesh Gupta', 'NA', 'neelesh.reewa@gmail.com', '8770231515', 'Rewa', 'Vishakha Agrahari', '2025-08-19 11:45:22'),
(39, 'Kshitij Joshi', 'Hair colour', 'avdhootfoundation@gmail.com', '7073121482', 'NA', 'Vishakha Agrahari', '2025-08-19 12:05:58'),
(40, 'Anupam Mishra', 'Integrity Classes', 'na@gmail.com', '7610140007', 'Madan Mahal, Near Khandelwal Super Mart, Wright Town, Jabalpur', 'Mohammad Mazhar', '2025-08-19 13:55:18'),
(41, 'Md Wasim', 'Interior Designer', 'wasimkhan999327@gmail.com', '8878999327', 'Madhya Pradesh', 'Mohammad Mazhar', '2025-08-19 17:26:53'),
(42, 'Neelesh Gupta', 'ajnms  kjdsjhd allkieu ajjbdh', 'neelesh.reewa@gmail.com', '8770231515', 'Rewa, Madhya Pradeshjjjjjj hhhhs hhhsa ', 'Mohammad Mazhar', '2025-08-19 18:31:28'),
(43, 'Hasrat Ali ', 'Ayan Enterprises ', 'ayanenterprises@gmail.com', '9892925717', 'Mumbai, Maharashtra ', 'Vishakha Agrahari', '2025-08-21 12:31:51'),
(51, 'SIHORA HOSPITAL', 'SIHORA HOSPITAL MULTI-SPECIALITY', 'sihorahospital@gmail.com', '9424706733', 'Sihora, Madhya Pradesh 483225', 'Vishakha Agrahari', '2025-08-22 14:12:34'),
(58, 'Manoj Sharma', 'Bharamaputra Construction', NULL, '9300656583', 'Patan Bypass, Jabalpur', 'Mohammad Mazhar', '2025-08-23 17:26:21'),
(76, 'kanhaiya', 'Kanhaiya sada banshidhar', '', '7899032865', '', 'Vishakha Agrahari', '2025-08-26 14:38:18'),
(86, 'Bhawna Rajput', 'Podcast ', NULL, '7566582020', 'Jabalpur', 'Abhinav Pandey', '2025-08-26 15:26:43'),
(87, 'Arjit Jain ', 'Constructor', '', '9713434348', '', 'Vishakha Agrahari', '2025-08-27 13:35:32'),
(88, 'test of client ', '', '', '7586868566', '', 'Abhinav Pandey', '2025-08-27 15:18:27'),
(89, 'TestClient', 'Doa', 'deepanshushukla07@gmail.com', '7397952088', '480\nRamnagar', 'Dev BD', '2025-08-29 12:18:07'),
(90, 'Tushar Gupta', 'Pathalogy', NULL, '7999938672', 'Jabalpur', 'Abhinav Pandey', '2025-08-29 12:18:32'),
(93, 'Ayush Agrawal ', 'AGRAWAL MOTORS', '', '8839215849', 'Baldeobagh Jabalpur, Madhya Pradesh 482002', 'Vishakha Agrahari', '2025-08-30 13:18:16'),
(94, 'Test New Client', 'Water purifier', 'deepanshu123.doaguru@gmail.com', '2345678902', 'Jabalpur', 'Abhinav Pandey', '2025-09-01 14:30:06'),
(95, 'basic', NULL, NULL, '7746004774', NULL, 'Lavina Kukreja', '2025-09-09 11:37:05'),
(96, 'Bhavna Rajput', 'Podcast', '', '7566582020', '', 'Lavina Kukreja', '2025-09-01 17:11:49'),
(97, 'Computer Hardware', 'Compact', 'deepanshushukla07@gmail.com', '4567890234', 'Jabalpur', 'Dev BD', '2025-09-02 12:16:30'),
(99, 'Rajeev Kumar ', 'ARR Construction', '', '9685966806', 'Jabalpur ', 'Vishakha Agrahari', '2025-09-03 10:34:03'),
(102, 'Jaideep Mishra ', 'Mekalsuta Eduspace ', '', '8435555515', 'jabalpur ', 'Vishakha Agrahari', '2025-09-03 17:57:28'),
(114, 'google meta ', NULL, NULL, '9302300834', NULL, 'Dev BD', '2026-07-16 14:08:18'),
(119, 'Deepak GADs', NULL, 'deepu@example.com', '4567890232', NULL, 'Abhinav Pandey', '2025-09-04 18:00:51'),
(120, 'Shashank Dubey', 'PR', '', '9754880013', '', 'Lavina Kukreja', '2025-09-08 11:40:35'),
(121, 'Real Estate - Basic', 'Basic Plan', NULL, '774604774', NULL, 'Lavina Kukreja', '2025-09-08 14:43:46'),
(126, 'Durgesh Sir', 'Ayushi Construction', 'infoayushiconstruction@gmail.com', '9575809888', 'Infront of Garha Thana, Tripuri Chowk, Jabalpur', 'Vishakha Agrahari', '2025-10-13 12:38:31'),
(130, 'Ram Patel', 'N/A', '', '8517824590', 'Jabalpur', 'Vishakha Agrahari', '2025-09-10 16:50:32'),
(131, 'Babulal Agrawal ', 'kajaria Tiles', '', '9827282001', 'Jabalpur ', 'Vishakha Agrahari', '2025-09-10 18:06:45'),
(132, 'Rajeev Kumar ', 'ARR Developers', '', '9685966806', 'Dhanvantri Nagar, Ahinsa Chowk, Gadha, Jabalpur', 'Vishakha Agrahari', '2025-09-22 13:06:14'),
(133, 'Milton Test Devops', 'Milton Test Devops', 'milton@devops.com', '9855466322', 'Jabalpur', 'Abhinav Pandey', '2025-09-12 12:41:22'),
(134, 'Dr. Parimal Swamy', 'Diabetes Center Clinic', '', '7389752555', 'Mohit Chamber Near Chanchala Bai College, Wright Town, Jabalpur', 'Abhinav Pandey', '2025-09-13 20:01:26'),
(135, 'Neel Patel', 'The Phonebooth', '', '9993664294', 'Gohalpur, Amkhera Road Jabalpur', 'Abhinav Pandey', '2025-09-15 16:05:29'),
(136, 'Nathan Wade', 'Disrupta', 'nathan@disrupta.com.au', '0416209798', ' Australia', 'Abhinav Pandey', '2025-09-15 16:41:31'),
(138, 'Kaustubh Harshey', 'Daksh Netralaya', 'dakshnetralaya@gmail.com', '7860342564', 'First Floor, Golbazar, Jabalpur', 'Abhinav Pandey', '2025-09-15 19:35:51'),
(139, 'Richa Chhatrashal', 'MRV Venture LTD', 'ohbombaymilton@gmail.com', '9056361211', '1050 Main St E, Milton, ON L9T 9M3, Canada, Ontario', 'Abhinav Pandey', '2025-09-16 15:39:03'),
(142, 'Gulabchand Gupta', 'Sasumaa Saree', '', '9039821381', 'Shop No. 27, SP Market, LordGanj, Jabalpur', 'Vishakha Agrahari', '2025-09-18 12:45:04'),
(143, 'Mr. Pratik Jain', 'Ayushman Children Hospital', '', '8649977777', '', 'Lavina Kukreja', '2025-09-18 12:20:15'),
(148, 'Sumit Gupta', 'MGSchool', 'deepanshu123.doaguru@gmail.com', '5545446464', 'Jabalpur', 'Deepanshu Shukla', '2025-09-18 16:02:16'),
(149, 'Deepak Test', 'Deep furniture', 'deepanshu123.doaguru@gmail.com', '3456781234', 'Jabalpur', 'Abhinav Pandey', '2025-09-19 12:05:33'),
(150, 'Kamlesh Tiwari', 'Ritika Buildcon', NULL, '9301121084', 'Jabalpur', 'Abhinav Pandey', '2025-09-19 19:02:10'),
(152, 'google meta 123', 'Gala Developers', 'umerqureshi786786@gmail.com', '7586868566', 'qw', 'Abhinav Pandey', '2025-10-15 14:20:33'),
(153, 'Reda Hassan', 'Reda Hassan Real Estate', 'redah6522@gmail.com', '1501388617', 'Dubai, United Arab', 'Abhinav Pandey', '2025-09-23 14:28:59'),
(154, 'Nikita Shukla', 'Water purifier', NULL, '5678934568', NULL, 'Abhinav Pandey', '2025-09-23 16:35:55'),
(155, 'jayant', 'doaguru infosystems', 'doaguruinfosystems@gmail.com', '7440992424', 'kanpur', 'Mohammad Mazhar', '2025-09-25 12:11:57'),
(158, 'Rohit Rajak', 'Nidhivan Developer', NULL, '8770375800', 'Sundarpur Fagua Nala Near Pariyat Dam, Jabalpur', 'Abhinav Pandey', '2026-06-17 18:11:28'),
(161, 'test', 'abc', '', '5555555555', 'aaaaa', 'Abhinav Pandey', '2025-10-01 12:38:28'),
(163, 'DR. Pawan Sthapak', 'Janjyoti, DVJEI', '', '9826950101', '1051, Gole Bazar Ranital, near Kesharwani College, Wright Town Jabalpur', 'Abhinav Pandey', '2025-09-30 18:46:00'),
(164, 'Osanj', 'Osho Amritdham', '', '9617997667', '1883, Medical Road, Devtal, Garha, Jabalpur', 'Abhinav Pandey', '2025-10-01 14:37:57'),
(165, 'Dr Bhavik Dhirawani', 'Jabalpur Hospital & Research Centre', '', '8308300456', 'Russel Chowk, Napier Town, Jabalpur', 'Abhinav Pandey', '2025-10-01 16:59:26'),
(166, 'Deepak Agrawal', 'Naivedyam The Veg Lounge', '', '9827234959', 'Adrashnagar Narmada Road Near Petrol Pump, Jabalpur', 'Abhinav Pandey', '2025-10-01 18:58:00'),
(167, 'Mr. Navi', 'MN Tire Changers', 'info@mntirechangers.com', '2896731929', 'USA', 'Lavina Kukreja', '2025-10-06 11:30:25'),
(168, 'Anand Baharani', 'Baharani Hospital', '', '9179979777', 'Next to Standard Maruti Showroom, Bhavartal Garden Road, Napier Town, Jabalpur', 'Abhinav Pandey', '2025-10-04 14:23:21'),
(169, 'Aman civil engineering', 'Hilton Garden Inn Jabalpur', '', '8269230511', '466, Hitkarini College Rd, Jabalpur', 'Abhinav Pandey', '2025-10-13 16:44:41'),
(170, 'testtoday', 'Doa', 'deepanshu123.doaguru@gmail.com', '3535336636', 'Jabalpur', 'Abhinav Pandey', '2025-10-06 12:06:13'),
(171, 'Deepak Shiv Hare', 'Positive Real Estate Pvt. Ltd.', '', '7693066371', 'Madan Mehal Near 133 Pillar, Jabalpur', 'Jayant Hazari', '2025-10-06 15:13:22'),
(172, 'Dr. Archana Shrivastav', 'Pluro Jabalpur Fertility Centre', 'jabalpurivf1@gmail.com', '9826553302', '199-A, Vishva Hindu Parishad Lane, Home Science College Road, Napier Town Jabalpur', 'Abhinav Pandey', '2026-05-01 14:41:20'),
(173, 'Deepak Shiv Hare', 'Biocellix Nature Forever', '', '7693066371', 'Jabalpur', 'Abhinav Pandey', '2025-10-14 19:30:26'),
(174, 'Suryakant Jarariya', 'Ram Academy', '', '9004673896', 'Jaiswal Bhawan, Home Science College Road, Shastri Bridge, Jabalpur', 'Abhinav Pandey', '2025-10-08 12:12:18'),
(175, 'R S Chauhan', 'Royal Senior Secondary School', 'royalschool_jbp@hotmail.com', '9993204840', 'Sanjeevani Nagar', 'Lavina Kukreja', '2025-10-11 15:44:46'),
(176, 'Mr. Rahul Tiwari', 'Jabali Paramedical Institute Of Science', '', '9713685500', 'Gohalpur, Jabalpur', 'Lavina Kukreja', '2025-10-11 16:46:56'),
(177, 'TestNewfeature', '', '', '5454646436', 'pp', 'Abhinav Pandey', '2025-10-21 15:35:46'),
(178, 'Nitin Singh Thakur', 'XYZ Limited Test', 'test@gmail.com', '9876541230', 'Jabalpur', 'Abhinav Pandey', '2025-12-04 12:29:21'),
(181, 'Dr. Akshay Saxena', 'Saxena Cosmetic Clinic', 'saxenacosmeticclinic@yahoo.in', '9131589496', 'Khushi Plaza, Near Krishna Hotel, In Front Of Bhawartal Garden, Napier Town, Jabalpur', 'Lavina Kukreja', '2025-11-03 16:55:40'),
(182, 'Test Client', 'Bombay Furniture ', 'test@gmail.com', '4325355355', 'Writetown Jabalpur', 'Abhinav Pandey', '2025-10-21 15:50:02'),
(183, 'Mrs. Heena', 'Little Kingdom School', NULL, '9685707032', 'Amkhera Rd, New Ram Nagar, Jagriti Nagar, Adhartal, Jabalpur', 'Abhinav Pandey', '2025-10-25 19:20:08'),
(184, 'Sanjay Dahiya', 'Hanshika Farm House', '', '9300028127', '2nd Floor Roopali Chamber Medicine Complex, Near Shastri Bridge, Jabalpur', 'Abhinav Pandey', '2025-10-28 14:50:00'),
(185, 'Shomil Dixit', 'Shree Vriddhi Group', 'shomildixit90@gmail.com', '7415400400', 'Jabalpur', 'Abhinav Pandey', '2025-10-30 21:03:19'),
(186, 'Mohd Adil Rehmani', 'Huzaif Dental Clinic', '', '8279332638', 'Sakari Tubewell & Shree Ram Finance ke Pass Pipal Adda Etah-207001 (M.P.)', 'Abhinav Pandey', '2025-11-04 20:23:12'),
(187, 'Deepak Agrawal', 'NAIVEDYAM The Veg Lounge', 'lavinakukreja7@gmail.com', '9827234959', 'Rampur, Jabalpur', 'Lavina Kukreja', '2025-11-05 15:44:20'),
(188, 'Pankaj Sen', 'Spark Build', 'sparkbuildconstruction@gmail.com', '7000220483', 'Ukhri road, Jabalpur', 'Abhinav Pandey', '2025-11-05 19:19:56'),
(189, 'Shivam Vishwakarma', 'Easy Earn Stock Trading Institute', NULL, '8839726315', 'Near DN Jain College, Gole Bazaar, Wright Town , Jabalpur ( M.P ) 482002', 'Abhinav Pandey', '2025-11-10 19:16:35'),
(190, 'Dr. Mukesh Shrivastava', 'Life Medicity Hospital', NULL, '9171404528', 'Aaga Chowk, Jabalpur', 'Lavina Kukreja', '2025-11-11 14:36:24'),
(191, 'Sharad Jain', 'Darbar Restaurant', '', '7828400463', 'Jayanti Complex, Gurunanak School Rd, Marhatal, Jabalpur M.P 482002', 'Abhinav Pandey', '2025-11-10 12:16:33'),
(192, 'Dr. Priyanshu Dixit', 'SUN ORTHO CLINIC', 'priyanshudixit01@gmail.com', '9923933508', 'Shop No. 16, Dixit Pride, Napier Town In Front Of Tyab Ali Petrol Pump,Napier Town, Jabalpur, Madhya Pradesh 482002', 'Lavina Kukreja', '2025-11-10 17:47:25'),
(193, 'A+ Academy', 'A+ Academy', '', '9425157053', 'Jabalpur', 'Abhinav Pandey', '2025-11-10 20:32:30'),
(194, 'Anil Kolhe', 'Ortho Clinic', NULL, '8269939120', 'Jabalpur', 'Abhinav Pandey', '2025-11-11 19:19:38'),
(195, 'Keerti Sharma', 'Little London Kids', '', '8109239728', 'Near Java Electricals Main Road Gol Bajar Wright Town Ganjipura Jabalpur (M.P.) 482002', 'Abhinav Pandey', '2025-11-12 14:31:41'),
(196, 'Dr Ashita Dubey', 'Care4Her by Dr. Ashita', 'lavinakukreja7@gmail.com', '9754073277', 'jabalpur', 'Lavina Kukreja', '2025-11-18 16:36:46'),
(197, 'Dr. Shekar ', 'Clinic', '', '9589962334', 'Rampur, Jabalpur', 'Abhinav Pandey', '2025-11-18 19:11:19'),
(198, 'Mr. Arjit Jain', 'NJ Infrastructure', NULL, '9713434348', 'jabalpur', 'Abhinav Pandey', '2025-11-18 22:01:17'),
(199, 'Sharad Jain', 'Jain Dhaba', NULL, '7828400463', ' Shop No. 34, New Bazaar, Malaviya Chowk, Wright Town, Jabalpur, 482002', 'Abhinav Pandey', '2025-11-22 17:08:06'),
(200, 'Mr. Advocate', ' Green Valley Marriage Lawn', '', '7987699034', 'Nagpur Road Across Tilwara Bridge Before Tata Commercial, Jabalpur', 'Abhinav Pandey', '2025-11-22 16:18:49'),
(201, 'Hrishabh Sharma', 'Advayan Technologies', NULL, '7389017776', '512, 5th Cross Rd, Sector 4, HSR Layout, Bengaluru, Karnataka 560034', 'Abhinav Pandey', '2026-03-02 13:51:32'),
(202, 'Dheeraj Raikvar ', 'Dheeraj Properties ', '', '9300003333', '821, Scheme No. 41 MR-4 Road, near Ekta Chowk Extension Road, Jabalpur, Madhya Pradesh 482002', 'Abhinav Pandey', '2025-11-22 23:29:55'),
(203, 'Sanjay Tiwari Shandilya', 'Future Dream Astro', '', '9131359165', 'Jabalpur', 'Abhinav Pandey', '2025-11-24 13:32:56'),
(204, 'Aarti Pandey', 'JP School and Kindergarden', NULL, '7024298076', 'Surahi Building, Main Road, New Ram Nagar, Adhartal, Jabalpur 482004', 'Abhinav Pandey', '2025-12-03 17:20:46'),
(206, 'Mr. Rahul Tiwari', 'Just Jabalpur', NULL, '9713685500', 'Gohalpur Jabalpur', 'Abhinav Pandey', '2026-05-22 18:46:31'),
(207, 'Kriti Avasthi', 'Rishi Dental Clinic', NULL, '7041795850', 'Ranital Jabalpur Madhya Pradesh', 'Abhinav Pandey', '2025-12-24 15:01:05'),
(208, 'Asheesh Tandon ', 'Dr Asheesh Tandon ', NULL, '8827529995', 'Napier Town Jabalpur, Jabalpur', 'Abhinav Pandey', '2026-02-02 19:31:27'),
(209, 'Yash Raj Singh', 'Suman Devi Sikshan Sansthan', 'info@dooninternationaljabalpur.com', '9479600279', 'Doon International School, Jabalpur - Nagpur Rd, opposite Tata Motors, Manegaon, Jabalpur, Madhya Pradesh 482051', 'Abhinav Pandey', '2026-03-11 14:40:18'),
(210, 'Dr. Brajesh chandra choudhary', '', '', '7612413825', 'Shop No 18 thakur market shaheed smarak rd Ranital jabalpur', 'Kushagra Sharma', '2025-12-29 16:33:53'),
(211, 'Ajeet Chaturvedi', 'Chandrayan Herbal & Food Pvt. Ltd', NULL, '9926938817', 'Plot No.02A , Daddanagar, Katangi Road, Jabalpur', 'Abhinav Pandey', '2026-04-07 17:37:42'),
(212, 'NSPIRA Management Services Private Limited', 'NSPIRA Management Services Private Limited', NULL, '9522200272', 'Rail Sourabh Colony, opposite PC Jewellers, Wright Town, Jabalpur, Madhya Pradesh 482002', 'Abhinav Pandey', '2026-01-15 21:10:24'),
(213, 'Jay', 'Politician', '', '885679245', 'Mumbai, Maharashtra', 'Abhinav Pandey', '2026-01-02 13:45:46'),
(214, 'Intenics Private Limited', 'Intenics Private Limited', NULL, '6262001376', 'Plot no. 25 & 26, At IT-Park, Bargi Hills, Jabalpur - 482003', 'Abhinav Pandey', '2026-01-05 16:49:41'),
(215, 'Dr Aniruddh Shrivastava', 'Neourologist', NULL, '9998775378', 'Jabalpur', 'Abhinav Pandey', '2026-01-02 20:57:25'),
(216, 'Mr Shishir Pandey', 'Shital Chhaya Hospital', NULL, '9329711821', 'Jabalpur', 'Abhinav Pandey', '2026-01-08 18:33:31'),
(217, 'HR Mr Surendra Patel', 'Metro Hospital & Research Centre', NULL, '9399614301', 'Sharda Puram Road, near New Bus Stand Rewa, Madhya Pradesh 486003', 'Abhinav Pandey', '2026-01-09 13:56:13'),
(218, 'Sanjay Dwivedi', 'Pratham IVF Clinic', NULL, '8821000416', 'University Rd, Khutehi, Rewa, Madhya Pradesh 486001', 'Abhinav Pandey', '2026-06-20 13:37:51'),
(219, 'Dr A.K Shrivastava', 'Chirayu Hospital and Research Center', '', '8827205797', 'Tansen Complex Sirmour Chouraha, Madhya Pradesh 486001', 'Abhinav Pandey', '2026-01-10 13:17:16'),
(220, 'Dr. Gunjan Goswami', 'Jyotirmay IVF & Fertility Centre', 'jyotirmayivfcenter@gmail.com', '7724819233', 'Narendra Nagar Rd, Narendra Nagar, Amahiya, Rewa, Madhya Pradesh 486001', 'Abhinav Pandey', '2026-01-10 15:51:28'),
(221, 'Dr Dharmesh Ku Patel', 'Minerva The Medicity Multi Super Speciality Hospital', '', '9893516364', 'Jai Stambh Chowk, Rewa Madhya Pradesh 486001', 'Abhinav Pandey', '2026-01-10 17:34:06'),
(222, 'Dr. Shabd Singh Yadav M.D', 'Vardaan Multi Speciality Hospital & Research Center', '', '7828422829', 'Captain Tower, PTS Rd, Near New Doctor Colony, Ravindra Nagar, Rewa, Madhya Pradesh', 'Abhinav Pandey', '2026-01-10 18:32:01'),
(223, 'Ravindra Tomar', 'RKCT LABORATORY PVT. LTD.', NULL, '9201986401', 'P 316/3, raigwa, Patan Bypass, Road, in front of green valley school, Karmeta, Jabalpur, Madhya Pradesh 482002', 'Abhinav Pandey', '2026-03-02 13:12:55'),
(224, 'Meghna Test', NULL, NULL, '8555996644', 'Jbp', 'Meghna', '2026-01-15 13:07:18'),
(225, 'Dr Harsh Saxena ', 'Neuro and Spine Clinic', '', '9425153222', 'Datt Residency, Opp. Railway Stadium, North Civil Lines, Jabalpur – 482001', 'Abhinav Pandey', '2026-01-15 18:49:43'),
(226, 'Parash Enejh', 'MAA Enterprises', NULL, '9893667788', 'Jabalpur, Madhya Pradesh', 'Abhinav Pandey', '2026-04-23 21:43:30'),
(227, 'Dr Versha Tandon', 'Dr Varsha Tandon', NULL, '7879826833', 'Jabalpur', 'Abhinav Pandey', '2026-01-22 19:30:44'),
(228, 'Priyank Tiwari', 'Bank Of Baroda', '', '7276379918', 'Wright Town, Jabalpur 482002', 'Abhinav Pandey', '2026-01-24 21:40:51'),
(229, 'REWA HOSPITAL & RESEARCH CENTRE', 'REWA HOSPITAL & RESEARCH CENTRE', '', '9875264354', ' Ravindra Nagar, Rewa, Madhya Pradesh - 486001 ', 'Abhinav Pandey', '2026-01-26 11:48:20'),
(230, 'Ayushman Hospital', 'Ayushman Hospital', '', '9259847053', '11, PTS Rd, Chhatrapati Nagar, Rewa, Madhya Pradesh 486005', 'Abhinav Pandey', '2026-01-26 12:01:10'),
(231, 'Prarthana Hospital & Research Centre', 'Prarthana Hospital & Research Centre', '', '7662469015', 'PTS Road, Near the Flyover Bridge, New Bus Stand, Rewa, Madhya Pradesh', 'Abhinav Pandey', '2026-01-28 15:38:13'),
(233, 'Harpreet Singh', 'Elite Homes', NULL, '9893718200', 'Jabalpur', 'Abhinav Pandey', '2026-02-07 20:51:53'),
(234, ' Dr. Naresh Bajaj ', 'Life Care Hospital and Research Centre', '', '8989189664', 'Rewa', 'Abhinav Pandey', '2026-02-27 16:46:16'),
(235, 'Dinkar Dubey ', 'Dinkar Dubey ', NULL, '7011827960', 'Near Reliance Petrol Pump, Manas Nagar , Rewa, India, 486001\n', 'Abhinav Pandey', '2026-03-10 15:44:23'),
(236, 'Dr Saket Bansal', 'Dr Saket Bansal', '', '7389229000', 'Jabalpur Madhya Pradesh', 'Abhinav Pandey', '2026-03-13 15:18:06'),
(237, 'Malvika Sen', 'Indian Institute of Teacher Training', '', '7999741243', 'Jabalpur', 'Abhinav Pandey', '2026-03-13 17:09:37'),
(238, 'Ravi Raj', 'RAB Mall', '', '9425165529', 'Dindori, Madhya Pradesh', 'Abhinav Pandey', '2026-03-13 17:47:21'),
(239, 'Dr Mukesh Shrivastava', 'Dr Mukesh Shrivastava', NULL, '9171404528', 'Jabalpur', 'Abhinav Pandey', '2026-03-16 11:54:32'),
(240, 'Abhishek Singh ', 'Ashirwad Hospital', '', '9569752340', 'Near Hero Agency, Mauganj, Rewa-486331, Madhya Pradesh', 'Meghna', '2026-03-18 10:20:00'),
(241, 'Dr Abhishek Goswami', 'Dr Abhishek Goswami', NULL, '9561111442', 'Rewa, Madhya Pradesh', 'Meghna', '2026-03-18 13:02:41'),
(242, 'S K Tiwari', 'Guru Vashishth Hospital and Trauma center Mauganj', NULL, '6262220039', 'Bypass road, Mauganj, Madhya Pradesh 486331', 'Abhinav Pandey', '2026-03-18 18:48:19'),
(243, 'Praveen ', 'Restaurant (Canada) – Brand Name Not Shared Yet', NULL, '6478783191', NULL, 'Abhinav Pandey', '2026-03-20 21:09:59'),
(244, 'Gaurav Saxena', 'Cloud Kitchen', '', '9993078147', 'Jabalpur', 'Abhinav Pandey', '2026-03-26 15:56:42'),
(245, 'Dr Devkriti Dhirawani', 'Jabalpur Hospital Fertility Centre', NULL, '6263206039', 'Russel Chowk, Napier Town, Jabalpur', 'Abhinav Pandey', '2026-03-26 17:49:01'),
(247, 'Shailendra Rajpoot', 'Charak Institute of Medical Science', NULL, '9893668820', 'Ghadi Chowk, Vijay Nagar, Jabalpur, MP', 'Abhinav Pandey', '2026-04-16 20:08:39'),
(248, 'Abhishek Jain', 'Wonderchef Vardhman', NULL, '7987697561', 'Yadav Colony, Jabalpur', 'Abhinav Pandey', '2026-04-30 15:21:46'),
(249, 'Mrs Luthra', 'Crumbelle Cloud Kitchen', '', '7987638296', '', 'Abhinav Pandey', '2026-04-22 17:06:58'),
(251, 'Dr Abha Diwan', 'Dr Abha Diwan', NULL, '9424310004', 'Jabalpur', 'Abhinav Pandey', '2026-04-30 14:13:18'),
(252, 'Buddha Residency ', 'Buddha Residency ', '', '9415036521', 'Near budda public school, Lakhnow road Bahraich', 'Abhinav Pandey', '2026-05-04 11:56:59'),
(253, 'Vishal Datt', 'Datt Realinfra Pvt Ltd', NULL, '9165011107', 'Bilhari, Jabalpur', 'Abhinav Pandey', '2026-05-27 15:21:15'),
(254, 'Anamika', 'Vindhya Super Speciality Hospital', NULL, '9630603662', 'Rewa', 'Abhinav Pandey', '2026-05-13 13:58:49'),
(255, 'Dr. Akhilesh Patel', 'National Hospital ', 'dr.akhi007@gmail.com', '9827346096', ' Near New bus stand Rewa ', 'Abhinav Pandey', '2026-05-14 19:35:37'),
(256, 'Hitesh Borkhade', 'Infinity Events & Promotions', '', '9755838464', 'Mumbai', 'Mohammad Mazhar', '2026-05-14 15:40:35'),
(257, 'Saurav Nougareya ', '  Vedora Food & Co.', NULL, '8609860986', 'Ranital Jabalpur ', 'Abhinav Pandey', '2026-05-25 22:08:38'),
(258, 'LL And Sons', '', '', '9098869391', 'Deendayal Chowk Near Swastik Hospital', 'Abhinav Pandey', '2026-05-30 16:04:54'),
(259, 'Hemant Kumar Naidu', 'KAYCENT ', '', '7489777988', 'Shop No 674, Street no. 13, Sadar Bazar (Cantt), Jabalpur ', 'Abhinav Pandey', '2026-05-30 16:12:37'),
(260, 'Nav Urja', 'Nav Urja Solar Fitting', '', '9203795405', 'Jabalpur', 'Abhinav Pandey', '2026-05-30 17:00:08'),
(261, 'Arpit Sohane', '', '', '9926508934', 'Jabalpur ', 'Abhinav Pandey', '2026-06-02 20:42:06'),
(262, 'Kalpana Tiwari', 'Hybernest Yoga Center', NULL, '6263206039', 'Raipur, Chhattisgarh', 'Abhinav Pandey', '2026-06-17 17:27:36'),
(263, 'Rahul Sen', 'Gauri Clinic', '', '8982025174', 'Amarpatan', 'Abhinav Pandey', '2026-07-06 12:00:18'),
(264, 'Amarpatan Multispeciality Hospital', '', '', '7675355307', 'Near Baghelkhand Petrol Pump, Maihar-Rewa Road, Lalpur, Amarpatan', 'Abhinav Pandey', '2026-07-06 12:21:16'),
(265, 'RPS Sportech Baminton Academy', '', '', '9993086016', 'Jabalpur', 'Abhinav Pandey', '2026-07-10 20:17:53'),
(266, 'ashish', 'ashsih', 'ad201054@gmail.com', '9302300834', 'xyz', 'Ad Dubay', '2026-07-16 14:11:33');

-- --------------------------------------------------------

--
-- Table structure for table `re_revenue_engine_employees`
--

CREATE TABLE `re_revenue_engine_employees` (
  `id` int(11) NOT NULL,
  `employee_name` varchar(250) DEFAULT NULL,
  `employee_phone` varchar(20) DEFAULT NULL,
  `employee_role` varchar(200) DEFAULT NULL,
  `employee_email` varchar(100) DEFAULT NULL,
  `employee_password` varchar(250) DEFAULT NULL,
  `created_at` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `re_revenue_engine_employees`
--

INSERT INTO `re_revenue_engine_employees` (`id`, `employee_name`, `employee_phone`, `employee_role`, `employee_email`, `employee_password`, `created_at`) VALUES
(2, 'Ad Dubay', NULL, 'Owner', 'ad201054@gmail.com', '$2b$10$BvEpGZ8pJmIvOlxpqOL84uAboj9VmWTAGpE.sqqTdjegibhMEnlYi', '2026-07-14 15:58:40');

-- --------------------------------------------------------

--
-- Table structure for table `re_services`
--

CREATE TABLE `re_services` (
  `service_id` int(11) NOT NULL,
  `service_name` varchar(100) NOT NULL,
  `created_at` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `re_services`
--

INSERT INTO `re_services` (`service_id`, `service_name`, `created_at`) VALUES
(1, 'website developmet', '2026-07-15 18:30:16'),
(2, 'gmb', '2026-07-15 18:30:40'),
(3, 'video editing', '2026-09-11 18:18:21');

-- --------------------------------------------------------

--
-- Table structure for table `re_service_progress`
--

CREATE TABLE `re_service_progress` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `txn_id` varchar(64) NOT NULL,
  `service_name` varchar(191) NOT NULL,
  `category_name` varchar(191) NOT NULL,
  `editing_type_name` varchar(191) NOT NULL DEFAULT '',
  `planned_qty` int(11) NOT NULL DEFAULT 0,
  `done_qty` int(11) NOT NULL DEFAULT 0,
  `last_updated_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_teams`
--

CREATE TABLE `re_teams` (
  `id` int(11) NOT NULL,
  `name` varchar(250) NOT NULL,
  `created_at` varchar(250) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_team_members`
--

CREATE TABLE `re_team_members` (
  `id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `created_at` varchar(250) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_workflow_payment_ledger`
--

CREATE TABLE `re_workflow_payment_ledger` (
  `id` int(11) NOT NULL,
  `txn_id` varchar(100) NOT NULL,
  `client_id` int(11) NOT NULL,
  `amount_received` decimal(12,2) NOT NULL DEFAULT 0.00,
  `payment_date` date NOT NULL,
  `payment_mode` varchar(50) NOT NULL,
  `transaction_reference` varchar(255) NOT NULL,
  `remark` text DEFAULT NULL,
  `received_by` varchar(200) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_workflow_project_assignments`
--

CREATE TABLE `re_workflow_project_assignments` (
  `id` int(11) NOT NULL,
  `txn_id` varchar(100) NOT NULL,
  `client_id` varchar(100) NOT NULL,
  `team_id` varchar(100) DEFAULT NULL,
  `team_name` varchar(200) DEFAULT NULL,
  `team_lead_id` varchar(100) DEFAULT NULL,
  `team_lead_name` varchar(200) DEFAULT NULL,
  `team_lead_email` varchar(200) DEFAULT NULL,
  `assigned_by_id` varchar(100) DEFAULT NULL,
  `remark` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_workflow_remarks`
--

CREATE TABLE `re_workflow_remarks` (
  `id` int(11) NOT NULL,
  `txn_id` varchar(100) NOT NULL,
  `action_type` varchar(100) NOT NULL,
  `actor_name` varchar(200) DEFAULT NULL,
  `remark` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `re_workflow_remarks`
--

INSERT INTO `re_workflow_remarks` (`id`, `txn_id`, `action_type`, `actor_name`, `remark`, `created_at`) VALUES
(1, '1784191509663', 'payment_recorded', 'Ad Dubay', 'Payment Recorded (Pending Approval)\nAmount : ₹10000\nTime : 16/7/2026, 2:15:09 pm', '2026-07-16 03:15:09'),
(2, '1784191509663', 'payment_approved', 'Ad Dubay', 'Payment Approved\nAmount : ₹10000\nOutstanding : ₹45000\nInvoice Number : 01', '2026-07-16 03:15:27'),
(3, '1789112806172', 'payment_recorded', 'Ad Dubay', 'Payment Recorded (Pending Approval)\nAmount : ₹10000\nTime : 11/9/2026, 1:16:46 pm', '2026-09-11 02:16:46'),
(4, '1789112806172', 'payment_approved', 'Ad Dubay', 'Payment Approved\nAmount : ₹10000\nOutstanding : ₹55600\nInvoice Number : 02', '2026-09-11 02:17:00'),
(5, '1789116460806', 'payment_recorded', 'Ad Dubay', 'Payment Recorded (Pending Approval)\nAmount : ₹10000\nTime : 11/9/2026, 2:17:40 pm', '2026-09-11 03:17:40'),
(6, '1789116460806', 'payment_approved', 'Ad Dubay', 'Payment Approved\nAmount : ₹10000\nOutstanding : ₹55600\nInvoice Number : 01', '2026-09-11 03:17:52'),
(7, '1789130272454', 'payment_recorded', 'Ad Dubay', 'Payment Recorded (Pending Approval)\nAmount : ₹50000\nTime : 11/9/2026, 6:07:52 pm', '2026-09-11 07:07:52'),
(8, '1789130272454', 'payment_approved', 'Ad Dubay', 'Payment Approved\nAmount : ₹50000\nOutstanding : ₹10000\nInvoice Number : 01', '2026-09-11 07:08:03'),
(9, '1789133142036', 'payment_recorded', 'Ad Dubay', 'Payment Recorded (Pending Approval)\nAmount : ₹50000\nTime : 11/9/2026, 6:55:42 pm', '2026-09-11 07:55:42'),
(10, '1789133142036', 'payment_approved', 'Ad Dubay', 'Payment Approved\nAmount : ₹50000\nOutstanding : ₹24500\nInvoice Number : 02', '2026-09-11 07:55:53');

-- --------------------------------------------------------

--
-- Table structure for table `re_workflow_strategy`
--

CREATE TABLE `re_workflow_strategy` (
  `id` int(11) NOT NULL,
  `txn_id` varchar(100) NOT NULL,
  `client_id` varchar(100) NOT NULL,
  `service_name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `deadline` date DEFAULT NULL,
  `status` enum('saved','admin_approved','admin_rejected','changes_requested','client_sent','client_approved','client_rejected') DEFAULT 'saved',
  `admin_remark` text DEFAULT NULL,
  `client_remark` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `re_workflow_task_assignments`
--

CREATE TABLE `re_workflow_task_assignments` (
  `id` int(11) NOT NULL,
  `txn_id` varchar(100) NOT NULL,
  `client_id` varchar(100) NOT NULL,
  `strategy_id` int(11) DEFAULT NULL,
  `task_name` varchar(200) NOT NULL,
  `task_description` text DEFAULT NULL,
  `assigned_to_id` varchar(100) NOT NULL,
  `assigned_to_name` varchar(200) DEFAULT NULL,
  `assigned_to_email` varchar(200) DEFAULT NULL,
  `assigned_by_id` varchar(100) DEFAULT NULL,
  `deadline` date NOT NULL,
  `status` enum('pending','working','complete') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `re_addtional_service`
--
ALTER TABLE `re_addtional_service`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`);

--
-- Indexes for table `re_ads_campaign_details`
--
ALTER TABLE `re_ads_campaign_details`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `re_ads_campaign_details_invoice`
--
ALTER TABLE `re_ads_campaign_details_invoice`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`);

--
-- Indexes for table `re_amount_remaining`
--
ALTER TABLE `re_amount_remaining`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`);

--
-- Indexes for table `re_assign_quotation`
--
ALTER TABLE `re_assign_quotation`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_txn_user` (`txn_id`,`user_id`),
  ADD KEY `idx_txn` (`txn_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_team` (`team_id`),
  ADD KEY `idx_mode` (`assignment_mode`),
  ADD KEY `re_fk_aq_client` (`client_id`);

--
-- Indexes for table `re_calculator_transactions`
--
ALTER TABLE `re_calculator_transactions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `re_categories`
--
ALTER TABLE `re_categories`
  ADD PRIMARY KEY (`category_id`),
  ADD KEY `service_id` (`service_id`);

--
-- Indexes for table `re_client_requirement_links`
--
ALTER TABLE `re_client_requirement_links`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `client_id` (`client_id`);

--
-- Indexes for table `re_complimentary`
--
ALTER TABLE `re_complimentary`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `re_complimentary_invoice`
--
ALTER TABLE `re_complimentary_invoice`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`);

--
-- Indexes for table `re_discount`
--
ALTER TABLE `re_discount`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`);

--
-- Indexes for table `re_discount_settings`
--
ALTER TABLE `re_discount_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `re_editing_types`
--
ALTER TABLE `re_editing_types`
  ADD PRIMARY KEY (`editing_type_id`),
  ADD KEY `service_id` (`service_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `re_invoice`
--
ALTER TABLE `re_invoice`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`),
  ADD KEY `re_fk_invoice_proposal_id` (`proposal_id`),
  ADD KEY `re_fk_invoice_proforma_id` (`proforma_id`);

--
-- Indexes for table `re_invoice_client_notes`
--
ALTER TABLE `re_invoice_client_notes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`);

--
-- Indexes for table `re_invoice_graphic`
--
ALTER TABLE `re_invoice_graphic`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`);

--
-- Indexes for table `re_invoice_notes_data`
--
ALTER TABLE `re_invoice_notes_data`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `re_notes_bydefault`
--
ALTER TABLE `re_notes_bydefault`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `re_notes_data`
--
ALTER TABLE `re_notes_data`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `re_plans_notes`
--
ALTER TABLE `re_plans_notes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `re_plan_client_notes`
--
ALTER TABLE `re_plan_client_notes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`);

--
-- Indexes for table `re_plan_data`
--
ALTER TABLE `re_plan_data`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `re_plan_details`
--
ALTER TABLE `re_plan_details`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `re_proposals`
--
ALTER TABLE `re_proposals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_client` (`client_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created` (`created_at`),
  ADD KEY `idx_status_grand_total` (`status`,`grand_total_excl_gst`);

--
-- Indexes for table `re_proposal_payment_records`
--
ALTER TABLE `re_proposal_payment_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_proforma` (`proforma_id`),
  ADD KEY `idx_proposal` (`proposal_id`),
  ADD KEY `idx_client` (`client_id`),
  ADD KEY `idx_txn_id` (`txn_id`);

--
-- Indexes for table `re_proposal_proforma`
--
ALTER TABLE `re_proposal_proforma`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_proposal` (`proposal_id`),
  ADD KEY `idx_client` (`client_id`);

--
-- Indexes for table `re_public_access_logs`
--
ALTER TABLE `re_public_access_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `re_quotation_status`
--
ALTER TABLE `re_quotation_status`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_quotation_status_client_txn` (`client_id`,`txn_id`),
  ADD KEY `idx_quotation_status_txn` (`txn_id`),
  ADD KEY `idx_quotation_status_status` (`status`);

--
-- Indexes for table `re_requirement_submissions`
--
ALTER TABLE `re_requirement_submissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`),
  ADD KEY `link_id` (`link_id`);

--
-- Indexes for table `re_requirement_submission_items`
--
ALTER TABLE `re_requirement_submission_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `submission_id` (`submission_id`);

--
-- Indexes for table `re_revenue_engine_ads`
--
ALTER TABLE `re_revenue_engine_ads`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `re_revenue_engine_client_details`
--
ALTER TABLE `re_revenue_engine_client_details`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `re_revenue_engine_employees`
--
ALTER TABLE `re_revenue_engine_employees`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `re_services`
--
ALTER TABLE `re_services`
  ADD PRIMARY KEY (`service_id`);

--
-- Indexes for table `re_service_progress`
--
ALTER TABLE `re_service_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_progress` (`client_id`,`txn_id`,`service_name`,`category_name`,`editing_type_name`);

--
-- Indexes for table `re_teams`
--
ALTER TABLE `re_teams`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `re_team_members`
--
ALTER TABLE `re_team_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_team_employee` (`team_id`,`employee_id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `re_workflow_payment_ledger`
--
ALTER TABLE `re_workflow_payment_ledger`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_txn_client` (`txn_id`,`client_id`),
  ADD KEY `idx_payment_date` (`payment_date`);

--
-- Indexes for table `re_workflow_project_assignments`
--
ALTER TABLE `re_workflow_project_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_txn` (`txn_id`);

--
-- Indexes for table `re_workflow_remarks`
--
ALTER TABLE `re_workflow_remarks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_txn` (`txn_id`);

--
-- Indexes for table `re_workflow_strategy`
--
ALTER TABLE `re_workflow_strategy`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_txn_service` (`txn_id`,`service_name`),
  ADD KEY `idx_txn` (`txn_id`),
  ADD KEY `idx_client` (`client_id`);

--
-- Indexes for table `re_workflow_task_assignments`
--
ALTER TABLE `re_workflow_task_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_txn_task` (`txn_id`,`task_name`),
  ADD KEY `idx_txn` (`txn_id`),
  ADD KEY `idx_assignee` (`assigned_to_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `re_addtional_service`
--
ALTER TABLE `re_addtional_service`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_ads_campaign_details`
--
ALTER TABLE `re_ads_campaign_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_ads_campaign_details_invoice`
--
ALTER TABLE `re_ads_campaign_details_invoice`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `re_amount_remaining`
--
ALTER TABLE `re_amount_remaining`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_assign_quotation`
--
ALTER TABLE `re_assign_quotation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_calculator_transactions`
--
ALTER TABLE `re_calculator_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `re_categories`
--
ALTER TABLE `re_categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `re_client_requirement_links`
--
ALTER TABLE `re_client_requirement_links`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_complimentary`
--
ALTER TABLE `re_complimentary`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_complimentary_invoice`
--
ALTER TABLE `re_complimentary_invoice`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_discount`
--
ALTER TABLE `re_discount`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `re_discount_settings`
--
ALTER TABLE `re_discount_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `re_editing_types`
--
ALTER TABLE `re_editing_types`
  MODIFY `editing_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `re_invoice`
--
ALTER TABLE `re_invoice`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `re_invoice_client_notes`
--
ALTER TABLE `re_invoice_client_notes`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_invoice_graphic`
--
ALTER TABLE `re_invoice_graphic`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `re_invoice_notes_data`
--
ALTER TABLE `re_invoice_notes_data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_notes_bydefault`
--
ALTER TABLE `re_notes_bydefault`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_notes_data`
--
ALTER TABLE `re_notes_data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_plans_notes`
--
ALTER TABLE `re_plans_notes`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_plan_client_notes`
--
ALTER TABLE `re_plan_client_notes`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_plan_data`
--
ALTER TABLE `re_plan_data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_plan_details`
--
ALTER TABLE `re_plan_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_proposals`
--
ALTER TABLE `re_proposals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `re_proposal_payment_records`
--
ALTER TABLE `re_proposal_payment_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `re_proposal_proforma`
--
ALTER TABLE `re_proposal_proforma`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `re_public_access_logs`
--
ALTER TABLE `re_public_access_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `re_quotation_status`
--
ALTER TABLE `re_quotation_status`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_requirement_submissions`
--
ALTER TABLE `re_requirement_submissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_requirement_submission_items`
--
ALTER TABLE `re_requirement_submission_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_revenue_engine_ads`
--
ALTER TABLE `re_revenue_engine_ads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `re_revenue_engine_client_details`
--
ALTER TABLE `re_revenue_engine_client_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=267;

--
-- AUTO_INCREMENT for table `re_revenue_engine_employees`
--
ALTER TABLE `re_revenue_engine_employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `re_services`
--
ALTER TABLE `re_services`
  MODIFY `service_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `re_service_progress`
--
ALTER TABLE `re_service_progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_teams`
--
ALTER TABLE `re_teams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_team_members`
--
ALTER TABLE `re_team_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_workflow_payment_ledger`
--
ALTER TABLE `re_workflow_payment_ledger`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_workflow_project_assignments`
--
ALTER TABLE `re_workflow_project_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_workflow_remarks`
--
ALTER TABLE `re_workflow_remarks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `re_workflow_strategy`
--
ALTER TABLE `re_workflow_strategy`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `re_workflow_task_assignments`
--
ALTER TABLE `re_workflow_task_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `re_amount_remaining`
--
ALTER TABLE `re_amount_remaining`
  ADD CONSTRAINT `re_amount_remaining_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `re_revenue_engine_client_details` (`id`);

--
-- Constraints for table `re_assign_quotation`
--
ALTER TABLE `re_assign_quotation`
  ADD CONSTRAINT `re_fk_aq_client` FOREIGN KEY (`client_id`) REFERENCES `re_revenue_engine_client_details` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `re_fk_aq_user` FOREIGN KEY (`user_id`) REFERENCES `re_revenue_engine_employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `re_fk_assign_team` FOREIGN KEY (`team_id`) REFERENCES `re_teams` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `re_categories`
--
ALTER TABLE `re_categories`
  ADD CONSTRAINT `re_categories_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `re_services` (`service_id`) ON DELETE CASCADE;

--
-- Constraints for table `re_client_requirement_links`
--
ALTER TABLE `re_client_requirement_links`
  ADD CONSTRAINT `re_client_requirement_links_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `re_revenue_engine_client_details` (`id`);

--
-- Constraints for table `re_editing_types`
--
ALTER TABLE `re_editing_types`
  ADD CONSTRAINT `re_editing_types_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `re_services` (`service_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `re_editing_types_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `re_categories` (`category_id`) ON DELETE CASCADE;

--
-- Constraints for table `re_invoice`
--
ALTER TABLE `re_invoice`
  ADD CONSTRAINT `re_fk_invoice_proforma_id` FOREIGN KEY (`proforma_id`) REFERENCES `re_proposal_proforma` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `re_fk_invoice_proposal_id` FOREIGN KEY (`proposal_id`) REFERENCES `re_proposals` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `re_plan_client_notes`
--
ALTER TABLE `re_plan_client_notes`
  ADD CONSTRAINT `re_plan_client_notes_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `re_revenue_engine_client_details` (`id`);

--
-- Constraints for table `re_proposals`
--
ALTER TABLE `re_proposals`
  ADD CONSTRAINT `re_fk_proposal_client` FOREIGN KEY (`client_id`) REFERENCES `re_revenue_engine_client_details` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `re_proposal_payment_records`
--
ALTER TABLE `re_proposal_payment_records`
  ADD CONSTRAINT `re_proposal_payment_records_ibfk_1` FOREIGN KEY (`proforma_id`) REFERENCES `re_proposal_proforma` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `re_proposal_payment_records_ibfk_2` FOREIGN KEY (`proposal_id`) REFERENCES `re_proposals` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `re_proposal_proforma`
--
ALTER TABLE `re_proposal_proforma`
  ADD CONSTRAINT `re_proposal_proforma_ibfk_1` FOREIGN KEY (`proposal_id`) REFERENCES `re_proposals` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `re_requirement_submissions`
--
ALTER TABLE `re_requirement_submissions`
  ADD CONSTRAINT `re_fk_submissions_link` FOREIGN KEY (`link_id`) REFERENCES `re_client_requirement_links` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `re_requirement_submissions_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `re_revenue_engine_client_details` (`id`);

--
-- Constraints for table `re_requirement_submission_items`
--
ALTER TABLE `re_requirement_submission_items`
  ADD CONSTRAINT `re_requirement_submission_items_ibfk_1` FOREIGN KEY (`submission_id`) REFERENCES `re_requirement_submissions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `re_team_members`
--
ALTER TABLE `re_team_members`
  ADD CONSTRAINT `re_team_members_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `re_teams` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `re_team_members_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `re_revenue_engine_employees` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
