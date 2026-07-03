--
-- Database: `sbk`
--

-- --------------------------------------------------------

--
-- Table structure for table `bill_to`
--

CREATE TABLE `bill_to` (
  `id` int(11) NOT NULL,
  `Name` varchar(250) DEFAULT NULL,
  `Company_Name` varchar(255) DEFAULT NULL,
  `Address` varchar(250) NOT NULL,
  `State` varchar(100) NOT NULL,
  `StateCode` int(11) NOT NULL,
  `GSTIN_NO` varchar(16) NOT NULL,
  `phone_no` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bill_to`
--

INSERT INTO `bill_to` (`id`, `Name`, `Company_Name`, `Address`, `State`, `StateCode`, `GSTIN_NO`, `phone_no`) VALUES
(9, ' OM TRADERS						', ' OM TRADERS	', 'KuberdasVakilnoKhancho, JamdarSStreet,BHAVNAGAR - 364001.', 'GUJARAT.', 24, '24APAPR7517L1ZM', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `gst`
--

CREATE TABLE `gst` (
  `id` int(11) NOT NULL,
  `State` varchar(100) NOT NULL,
  `CGST` decimal(5,2) NOT NULL DEFAULT 2.50,
  `SGST` decimal(5,2) NOT NULL DEFAULT 2.50,
  `IGST` decimal(5,2) NOT NULL DEFAULT 5.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `gst`
--

INSERT INTO `gst` (`id`, `State`, `CGST`, `SGST`, `IGST`) VALUES
(1, 'TAMIL NADU', 2.50, 2.50, 0.00),
(2, 'MAHARASHTRA', 0.00, 0.00, 5.00),
(3, 'KERALA', 0.00, 0.00, 5.00),
(4, 'KARNATAKA', 0.00, 0.00, 5.00);

-- --------------------------------------------------------

--
-- Table structure for table `invoice_billing_ledger`
--

CREATE TABLE `invoice_billing_ledger` (
  `id` int(11) NOT NULL,
  `Invoice_No` varchar(50) NOT NULL,
  `Customer_Name` varchar(255) DEFAULT NULL,
  `Company_Name` varchar(255) DEFAULT NULL,
  `Total_Taxable` decimal(10,2) DEFAULT NULL,
  `Net_Total` decimal(10,2) DEFAULT NULL,
  `Bale_No` varchar(50) DEFAULT NULL,
  `LR_No` varchar(50) DEFAULT NULL,
  `Invoice_Date` date DEFAULT NULL,
  `Created_At` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_details`
--

CREATE TABLE `order_details` (
  `id` int(11) NOT NULL,
  `Invoice_No` varchar(50) NOT NULL,
  `Customer_name` varchar(255) NOT NULL,
  `Company_Name` varchar(255) DEFAULT NULL,
  `Address` text DEFAULT NULL,
  `State` varchar(100) NOT NULL,
  `State_Code` varchar(10) NOT NULL,
  `GSTIN_NO` varchar(15) DEFAULT NULL,
  `Phone_no` varchar(20) DEFAULT NULL,
  `Product_Name` varchar(255) NOT NULL,
  `HSN_Code` varchar(50) DEFAULT NULL,
  `QTY` int(11) NOT NULL DEFAULT 1,
  `Size` varchar(50) DEFAULT NULL,
  `Rate` decimal(12,2) NOT NULL DEFAULT 0.00,
  `Amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `Discount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `Taxvalue` decimal(12,2) NOT NULL DEFAULT 0.00,
  `CGST_Rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `SGST_Rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `IGST_Rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `Created_At` timestamp NOT NULL DEFAULT current_timestamp(),
  `Order_Status` varchar(20) DEFAULT 'PENDING'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_details`
--

INSERT INTO `order_details` (`id`, `Invoice_No`, `Customer_name`, `Company_Name`, `Address`, `State`, `State_Code`, `GSTIN_NO`, `Phone_no`, `Product_Name`, `HSN_Code`, `QTY`, `Size`, `Rate`, `Amount`, `Discount`, `Taxvalue`, `CGST_Rate`, `SGST_Rate`, `IGST_Rate`, `Created_At`, `Order_Status`) VALUES
(36, '001', ' OM TRADERS						', ' OM TRADERS	', 'KuberdasVakilnoKhancho, JamdarSStreet,BHAVNAGAR - 364001.', 'GUJARAT.', '24', '24APAPR7517L1ZM', NULL, 'Gold Plus', '5402', 1, '2.00', 23.00, 23.00, 0.00, 1.15, 0.00, 0.00, 5.00, '2026-07-02 07:49:17', 'PENDING'),
(37, '001', ' OM TRADERS						', ' OM TRADERS	', 'KuberdasVakilnoKhancho, JamdarSStreet,BHAVNAGAR - 364001.', 'GUJARAT.', '24', '24APAPR7517L1ZM', NULL, 'BHIVI GOLD', '5402', 1, '2.50', 30.00, 30.00, 0.00, 1.50, 0.00, 0.00, 5.00, '2026-07-02 07:49:17', 'PENDING'),
(38, '001', ' OM TRADERS						', ' OM TRADERS	', 'KuberdasVakilnoKhancho, JamdarSStreet,BHAVNAGAR - 364001.', 'GUJARAT.', '24', '24APAPR7517L1ZM', NULL, 'Santhosh', '5402', 1, '2.15', 25.00, 25.00, 0.00, 1.25, 0.00, 0.00, 5.00, '2026-07-02 07:49:17', 'PENDING');

-- --------------------------------------------------------

--
-- Table structure for table `product_details`
--

CREATE TABLE `product_details` (
  `Products` varchar(100) NOT NULL,
  `HSN_Code` int(11) NOT NULL,
  `QTY` int(11) NOT NULL,
  `Size` decimal(4,2) NOT NULL,
  `Rate` decimal(6,2) NOT NULL,
  `Amount` decimal(12,2) GENERATED ALWAYS AS (`Rate` * `QTY`) STORED,
  `Discount` decimal(5,2) NOT NULL,
  `Taxable_Value` decimal(12,2) GENERATED ALWAYS AS (`Amount` - `Discount`) STORED,
  `CGST` decimal(10,2) DEFAULT 0.00,
  `SGST` decimal(10,2) DEFAULT 0.00,
  `IGST` decimal(10,2) GENERATED ALWAYS AS (`CGST` + `SGST`) VIRTUAL,
  `Lungi_Name` varchar(255) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_details`
--

INSERT INTO `product_details` (`Products`, `HSN_Code`, `QTY`, `Size`, `Rate`, `Discount`, `CGST`, `SGST`, `Lungi_Name`) VALUES
('Gold Plus', 5402, 0, 2.00, 23.00, 0.00, 0.00, 0.00, 'GAMCHA'),
('BHIVI GOLD', 5402, 0, 2.50, 30.00, 0.00, 0.00, 0.00, 'GAMCHA'),
('Santhosh', 5402, 0, 2.15, 25.00, 0.00, 0.00, 0.00, 'GAMCHA');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int(11) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `password` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `username`, `password`) VALUES
(1, 'dhanya', '123'),
(2, 'Ayini', '345');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bill_to`
--
ALTER TABLE `bill_to`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `gst`
--
ALTER TABLE `gst`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `State` (`State`);

--
-- Indexes for table `invoice_billing_ledger`
--
ALTER TABLE `invoice_billing_ledger`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `order_details`
--
ALTER TABLE `order_details`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bill_to`
--
ALTER TABLE `bill_to`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `gst`
--
ALTER TABLE `gst`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `invoice_billing_ledger`
--
ALTER TABLE `invoice_billing_ledger`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `order_details`
--
ALTER TABLE `order_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;
COMMIT;