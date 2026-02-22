USE [Broker_Kapil]
GO
/****** Object:  StoredProcedure [dbo].[ReminderData]    Script Date: 06-02-2026 18:32:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[ReminderData]  
    @Filter INT = 0,        -- 0,1,2,3,4 filter logic  
    @FromDate DATE = '2025-01-01',  
    @ToDate DATE = '2025-09-05'  
AS  
BEGIN  
    SET NOCOUNT ON;  

    DECLARE @Today DATE = GETDATE();  

    --------------------------------------------------
    -- ✅ BASE YEAR FIX (JANUARY USES LAST YEAR)
    --------------------------------------------------
    DECLARE @BaseYear INT;
    SET @BaseYear = CASE 
                        WHEN MONTH(@Today) = 1 THEN YEAR(@Today) - 1
                        ELSE YEAR(@Today)
                    END;

    -- Drop temp if exists  
    IF OBJECT_ID('tempdb..#FinalResult') IS NOT NULL     
        DROP TABLE #FinalResult;  

    CREATE TABLE #FinalResult (  
        Id INT,  
        ContractNo NVARCHAR(50),  
        ContractDate DATE,  
        F_MonthMaster INT,  
        MonthName NVARCHAR(200),  
        ShipmentFromDate DATE,  
        ShipmentToDate DATE,  
        LiftedFromDate DATE,  
        LiftedToDate DATE,  
        Qty DECIMAL(18,2),  
        Rate DECIMAL(18,2),  
        AdvPayment DECIMAL(18,2),  
        TotalLifted DECIMAL(18,2),  
        PendingQty DECIMAL(18,2),  
        ReminderStart DATE,  
        ReminderEnd DATE,  
        SellerLedger NVARCHAR(200),  
        BuyerLedger NVARCHAR(200),  
        ItemTypeName NVARCHAR(200),  
        VesselName NVARCHAR(300)  
    );  

    DECLARE   
        @Id INT,  
        @ContractNo NVARCHAR(50),  
        @ContractDate DATE,  
        @F_MonthMaster INT,  
        @MonthName NVARCHAR(200),  
        @ShipmentFromDate DATE,  
        @ShipmentToDate DATE,  
        @LiftedFromDate DATE,  
        @LiftedToDate DATE,  
        @Qty DECIMAL(18,2),  
        @Rate DECIMAL(18,2),  
        @AdvPayment DECIMAL(18,2),  
        @AdvDate DATE,  
        @SellerLedger NVARCHAR(200),  
        @BuyerLedger NVARCHAR(200),  
        @ItemTypeName NVARCHAR(200),  
        @ReminderStart DATE,  
        @ReminderEnd DATE,  
        @TotalLifted DECIMAL(18,2),  
        @PendingQty DECIMAL(18,2),  
        @VesselName NVARCHAR(300);  

    DECLARE ContractCursor CURSOR FOR  
    SELECT  
        TBL.Id,  
        TBL.ContractNo,  
        TBL.Date,  
        TBL.F_MonthMaster,  
        CASE 
            WHEN TBL.F_YearMaster IS NOT NULL THEN M.Alias + ' ' + Y.Alias
            ELSE M.Alias
        END AS MonthName,  
        TBL.ShipmentFromDate,  
        TBL.ShipmentToDate,  
        TBL.LiftedFromDate,  
        TBL.LiftedToDate,  
        TBL.Qty,  
        TBL.Rate,  
        TRY_CAST(TBL.AdvPayment AS DECIMAL(18,2)) AS AdvPayment,  
        TBL.AdvDate,  
        SellerLedger.Name AS SellerLedger,  
        BuyerLedger.Name AS BuyerLedger,  
        IM.Name AS ItemTypeName,  
        TBL.Vessel  
    FROM ContractH TBL  
    LEFT JOIN MonthMaster M ON M.Id = TBL.F_MonthMaster  
    LEFT JOIN YearMaster Y ON Y.Id = TBL.F_YearMaster  
    LEFT JOIN LedgerMaster SellerLedger ON SellerLedger.Id = TBL.F_SellerLedger  
    LEFT JOIN LedgerMaster BuyerLedger ON BuyerLedger.Id = TBL.F_BuyerLedger  
    LEFT JOIN ItemMaster IM ON IM.Id = TBL.F_ItemType  
    WHERE  
        (@FromDate IS NULL OR CONVERT(DATE, TBL.Date) >= @FromDate)  
        AND (@ToDate IS NULL OR CONVERT(DATE, TBL.Date) <= @ToDate);  

    OPEN ContractCursor;  

    FETCH NEXT FROM ContractCursor INTO  
        @Id, @ContractNo, @ContractDate, @F_MonthMaster, @MonthName,  
        @ShipmentFromDate, @ShipmentToDate,  
        @LiftedFromDate, @LiftedToDate, @Qty, @Rate, @AdvPayment, @AdvDate,  
        @SellerLedger, @BuyerLedger, @ItemTypeName, @VesselName;  

    WHILE @@FETCH_STATUS = 0  
    BEGIN  
        SELECT @TotalLifted = SUM(TRY_CAST(L.Lifted AS DECIMAL(18,2)))  
        FROM Lifting L WHERE L.F_ContractH = @Id;  

        SET @TotalLifted = ISNULL(@TotalLifted, 0);  
        SET @PendingQty = @Qty - @TotalLifted;  

        --------------------------------------------------
        -- ✅ CORRECTED REMINDER DATE LOGIC
        --------------------------------------------------
        IF @F_MonthMaster IS NOT NULL  
        BEGIN  
            SET @ReminderStart = DATEFROMPARTS(
                                    @BaseYear + CASE WHEN @F_MonthMaster = 12 THEN 1 ELSE 0 END,
                                    CASE WHEN @F_MonthMaster = 12 THEN 1 ELSE @F_MonthMaster + 1 END,
                                    7
                                 );

            SET @ReminderEnd = DATEFROMPARTS(
                                    @BaseYear + CASE WHEN @F_MonthMaster >= 11 THEN 1 ELSE 0 END,
                                    CASE 
                                        WHEN @F_MonthMaster = 11 THEN 1
                                        WHEN @F_MonthMaster = 12 THEN 2
                                        ELSE @F_MonthMaster + 2
                                    END,
                                    7
                               );
        END  
        ELSE  
        BEGIN  
            SET @ReminderStart = DATEADD(DAY, 7, @ShipmentToDate);  
            SET @ReminderEnd   = DATEADD(MONTH, 1, DATEADD(DAY, 7, @ShipmentToDate));  
        END  

        --------------------------------------------------
        -- FILTER 4 : ADVANCE PAYMENT PENDING
        --------------------------------------------------
        IF @Filter = 4  
        BEGIN  
            IF (@AdvPayment > 0 AND @AdvDate IS NULL AND @ContractDate >= DATEADD(DAY, -40, @Today))  
            BEGIN  
                INSERT INTO #FinalResult  
                SELECT  
                    @Id, @ContractNo, @ContractDate, @F_MonthMaster, @MonthName,  
                    @ShipmentFromDate, @ShipmentToDate,  
                    @LiftedFromDate, @LiftedToDate, @Qty, @Rate, ISNULL(@AdvPayment,0),  
                    @TotalLifted, @PendingQty, @ReminderStart, @ReminderEnd,  
                    @SellerLedger, @BuyerLedger, @ItemTypeName, @VesselName;  
            END  
        END  
        ELSE  
        BEGIN  
            IF (  
                (@Today >= @ReminderStart AND @Today < @ReminderEnd)  
                OR (@LiftedFromDate IS NOT NULL AND @Today >= @LiftedFromDate AND @Today <= DATEADD(DAY,5,@LiftedToDate))  
            )  
            BEGIN  
                IF (  
                    (@LiftedFromDate IS NOT NULL AND @LiftedToDate IS NOT NULL AND @TotalLifted <> @Qty)  
                    OR (@LiftedFromDate IS NULL OR @LiftedToDate IS NULL)  
                )  
                BEGIN  
                    IF (  
                        ISNULL(@AdvPayment,0) = 0  
                        OR (ISNULL(@AdvPayment,0) > 0 AND @AdvDate IS NULL)  
                        OR (@VesselName IS NULL)  
                    )  
                    BEGIN  
                        IF (  
                            @Filter = 0  
                            OR (@Filter = 1 AND ISNULL(@F_MonthMaster,0) > 0)  
                            OR (@Filter = 2 AND @ShipmentFromDate IS NOT NULL AND @ShipmentToDate IS NOT NULL)  
                            OR (@Filter = 3 AND @LiftedFromDate IS NOT NULL AND @LiftedToDate IS NOT NULL)  
                        )  
                        BEGIN  
                            INSERT INTO #FinalResult  
                            SELECT  
                                @Id, @ContractNo, @ContractDate, @F_MonthMaster, @MonthName,  
                                @ShipmentFromDate, @ShipmentToDate,  
                                @LiftedFromDate, @LiftedToDate, @Qty, @Rate, ISNULL(@AdvPayment,0),  
                                @TotalLifted, @PendingQty, @ReminderStart, @ReminderEnd,  
                                @SellerLedger, @BuyerLedger, @ItemTypeName, @VesselName;  
                        END  
                    END  
                END  
            END  
        END  

        FETCH NEXT FROM ContractCursor INTO  
            @Id, @ContractNo, @ContractDate, @F_MonthMaster, @MonthName,  
            @ShipmentFromDate, @ShipmentToDate,  
            @LiftedFromDate, @LiftedToDate, @Qty, @Rate, @AdvPayment, @AdvDate,  
            @SellerLedger, @BuyerLedger, @ItemTypeName, @VesselName;  
    END  

    CLOSE ContractCursor;  
    DEALLOCATE ContractCursor;  

    -- Final Output  
    SELECT *  
    FROM #FinalResult  
    WHERE TotalLifted = 0  
      AND VesselName IS NULL  
    ORDER BY ISNULL(AdvPayment,0) ASC, SellerLedger ASC, ContractDate DESC;  

END
