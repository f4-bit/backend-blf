---------------------------------------------------
-- 1️⃣  ÍNDICES RECOMENDADOS
---------------------------------------------------

CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_appointments_donor ON appointments(donor_id);
CREATE INDEX idx_appointments_campaign_slot ON appointments(campaign_id, slot_datetime);
CREATE INDEX idx_donations_campaign ON donations(campaign_id);
CREATE INDEX idx_donations_blood_type ON donations(blood_type);
CREATE INDEX idx_inventory_blood_type ON inventory(blood_type);
CREATE INDEX idx_notifications_status ON notifications(status);
GO


---------------------------------------------------
-- 2️⃣  TRIGGERS updated_at PARA OTRAS TABLAS
---------------------------------------------------

CREATE TRIGGER trg_donors_update_timestamp
ON donors
AFTER UPDATE
AS
BEGIN
    UPDATE donors
    SET updated_at = SYSDATETIME()
    WHERE id IN (SELECT id FROM Inserted);
END
GO

CREATE TRIGGER trg_campaigns_update_timestamp
ON campaigns
AFTER UPDATE
AS
BEGIN
    UPDATE campaigns
    SET updated_at = SYSDATETIME()
    WHERE id IN (SELECT id FROM Inserted);
END
GO

CREATE TRIGGER trg_appointments_update_timestamp
ON appointments
AFTER UPDATE
AS
BEGIN
    UPDATE appointments
    SET updated_at = SYSDATETIME()
    WHERE id IN (SELECT id FROM Inserted);
END
GO

CREATE TRIGGER trg_donations_update_timestamp
ON donations
AFTER UPDATE
AS
BEGIN
    UPDATE donations
    SET updated_at = SYSDATETIME()
    WHERE id IN (SELECT id FROM Inserted);
END
GO

CREATE TRIGGER trg_inventory_update_timestamp
ON inventory
AFTER UPDATE
AS
BEGIN
    UPDATE inventory
    SET last_updated = SYSDATETIME()
    WHERE id IN (SELECT id FROM Inserted);
END
GO


---------------------------------------------------
-- 3️⃣  TABLA DE REFRESH TOKENS (para JWT refresh)
---------------------------------------------------

CREATE TABLE refresh_tokens (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
    token NVARCHAR(500) NOT NULL,
    expires_at DATETIME2 NOT NULL,
    revoked BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT SYSDATETIME()
);
CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);
GO


---------------------------------------------------
-- 4️⃣  TRIGGER: ACTUALIZA INVENTARIO TRAS DONACIÓN
---------------------------------------------------

CREATE TRIGGER trg_update_inventory_after_donation
ON donations
AFTER INSERT
AS
BEGIN
    -- Actualiza el inventario si ya existe el tipo de sangre,
    -- o inserta un nuevo registro si no existe.
    MERGE inventory AS inv
    USING (SELECT blood_type FROM inserted WHERE blood_type IS NOT NULL) AS newdon
    ON inv.blood_type = newdon.blood_type
    WHEN MATCHED THEN
        UPDATE SET inv.units_available = inv.units_available + 1,
                   inv.last_updated = SYSDATETIME()
    WHEN NOT MATCHED THEN
        INSERT (id, blood_type, units_available, last_updated)
        VALUES (NEWID(), newdon.blood_type, 1, SYSDATETIME());
END
GO


---------------------------------------------------
-- 5️⃣  STORED PROCEDURE: REGISTRA CITA (ejemplo)
---------------------------------------------------

CREATE PROCEDURE sp_create_appointment
    @donor_id UNIQUEIDENTIFIER,
    @campaign_id UNIQUEIDENTIFIER,
    @slot_datetime DATETIME2
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO appointments (donor_id, campaign_id, slot_datetime, status)
    VALUES (@donor_id, @campaign_id, @slot_datetime, 'scheduled');
END
GO


---------------------------------------------------
-- 6️⃣  STORED PROCEDURE: COMPLETA DONACIÓN (ejemplo)
---------------------------------------------------

CREATE PROCEDURE sp_complete_donation
    @appointment_id UNIQUEIDENTIFIER,
    @donor_id UNIQUEIDENTIFIER,
    @campaign_id UNIQUEIDENTIFIER,
    @blood_type NVARCHAR(5),
    @volume_ml INT,
    @collector_id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO donations (appointment_id, donor_id, campaign_id, blood_type, volume_ml, collector_id)
    VALUES (@appointment_id, @donor_id, @campaign_id, @blood_type, @volume_ml, @collector_id);

    UPDATE inventory
    SET units_available = units_available + 1,
        last_updated = SYSDATETIME()
    WHERE blood_type = @blood_type;
END
GO


---------------------------------------------------
-- 7️⃣  CONSTRAINTS EXTRA DE VALIDACIÓN
---------------------------------------------------

ALTER TABLE campaigns
ADD CONSTRAINT chk_capacity_nonnegative CHECK (capacity_total >= 0 AND capacity_available >= 0);

ALTER TABLE donations
ADD CONSTRAINT chk_donation_volume CHECK (volume_ml BETWEEN 200 AND 600);
GO
