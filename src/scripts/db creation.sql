-- ================================================
-- TIPOS EQUIVALENTES
-- ================================================

-- No existen ENUM, así que usamos CHECK CONSTRAINTS
-- No existe uuid_generate_v4(), usamos NEWID()

-- ================================================
-- TABLA: users
-- ================================================
CREATE TABLE users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(255) NOT NULL,
    role NVARCHAR(20) NOT NULL CHECK (role IN ('donor', 'admin', 'medical_staff')),
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    updated_at DATETIME2 DEFAULT SYSDATETIME(),
    last_login DATETIME2 NULL,
    oauth_provider NVARCHAR(50),
    oauth_id NVARCHAR(255),
    metadata NVARCHAR(MAX)
);

-- ================================================
-- TABLA: donors
-- ================================================
CREATE TABLE donors (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type NVARCHAR(10) NOT NULL,
    document_number NVARCHAR(50) NOT NULL UNIQUE,
    birth_date DATE NOT NULL,
    phone NVARCHAR(20),
    address NVARCHAR(255),
    latitude FLOAT,
    longitude FLOAT,
    blood_type NVARCHAR(5),
    sex NVARCHAR(10),
    last_donation_date DATE,
    eligibility_status NVARCHAR(30) CHECK (eligibility_status IN ('eligible', 'temporarily_ineligible', 'permanently_ineligible', 'unknown')),
    medical_notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    updated_at DATETIME2 DEFAULT SYSDATETIME()
);

-- ================================================
-- TABLA: campaigns
-- ================================================
CREATE TABLE campaigns (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    location NVARCHAR(255) NOT NULL,
    latitude FLOAT,
    longitude FLOAT,
    start_date DATETIME2 NOT NULL,
    end_date DATETIME2 NOT NULL,
    capacity_total INT NOT NULL CHECK (capacity_total >= 0),
    capacity_available INT NOT NULL CHECK (capacity_available >= 0),
    organizer_id UNIQUEIDENTIFIER REFERENCES users(id),
    published BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    updated_at DATETIME2 DEFAULT SYSDATETIME()
);

-- ================================================
-- TABLA: appointments
-- ================================================
CREATE TABLE appointments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    donor_id UNIQUEIDENTIFIER NOT NULL REFERENCES donors(id),
    campaign_id UNIQUEIDENTIFIER NOT NULL REFERENCES campaigns(id),
    slot_datetime DATETIME2 NOT NULL,
    status NVARCHAR(20) CHECK (status IN ('scheduled', 'cancelled', 'completed', 'no_show')) DEFAULT 'scheduled',
    eligibility_checked BIT DEFAULT 0,
    reminder_scheduled_at DATETIME2 NULL,
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    updated_at DATETIME2 DEFAULT SYSDATETIME()
);

-- ================================================
-- TABLA: donations
-- ================================================
CREATE TABLE donations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    appointment_id UNIQUEIDENTIFIER NULL REFERENCES appointments(id),
    donor_id UNIQUEIDENTIFIER NOT NULL REFERENCES donors(id),
    campaign_id UNIQUEIDENTIFIER NULL REFERENCES campaigns(id),
    bag_id NVARCHAR(100) NOT NULL UNIQUE,
    volume_ml INT CHECK (volume_ml > 0),
    blood_type NVARCHAR(5),
    collector_id UNIQUEIDENTIFIER REFERENCES users(id),
    donation_date DATETIME2 DEFAULT SYSDATETIME(),
    outcome NVARCHAR(20) CHECK (outcome IN ('success', 'adverse_event')) DEFAULT 'success',
    observations NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    updated_at DATETIME2 DEFAULT SYSDATETIME()
);

-- ================================================
-- TABLA: inventory
-- ================================================
CREATE TABLE inventory (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    blood_type NVARCHAR(5) NOT NULL,
    units_available DECIMAL(8,2) DEFAULT 0,
    last_updated DATETIME2 DEFAULT SYSDATETIME(),
    location_id UNIQUEIDENTIFIER NULL REFERENCES campaigns(id),
    min_threshold INT DEFAULT 0
);

-- ================================================
-- TABLA: notifications
-- ================================================
CREATE TABLE notifications (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER REFERENCES users(id),
    type NVARCHAR(10) CHECK (type IN ('email', 'push', 'sms')),
    channel_id NVARCHAR(255),
    template_id NVARCHAR(255),
    payload NVARCHAR(MAX),
    status NVARCHAR(10) CHECK (status IN ('queued', 'sent', 'failed')) DEFAULT 'queued',
    scheduled_at DATETIME2 NULL,
    sent_at DATETIME2 NULL
);

-- ================================================
-- TABLA: medical_checks
-- ================================================
CREATE TABLE medical_checks (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    appointment_id UNIQUEIDENTIFIER NOT NULL REFERENCES appointments(id),
    donor_id UNIQUEIDENTIFIER NOT NULL REFERENCES donors(id),
    answers NVARCHAR(MAX),
    vitals NVARCHAR(MAX),
    apto BIT,
    reason_not_apto NVARCHAR(MAX),
    checked_by UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 DEFAULT SYSDATETIME()
);

-- ================================================
-- TABLA: campaign_slots
-- ================================================
CREATE TABLE campaign_slots (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    campaign_id UNIQUEIDENTIFIER NOT NULL REFERENCES campaigns(id),
    start_datetime DATETIME2 NOT NULL,
    end_datetime DATETIME2 NOT NULL,
    capacity INT CHECK (capacity >= 0),
    reserved_count INT DEFAULT 0 CHECK (reserved_count >= 0)
);

-- ================================================
-- TABLA: audit_logs
-- ================================================
CREATE TABLE audit_logs (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    actor_id UNIQUEIDENTIFIER REFERENCES users(id),
    action NVARCHAR(100) NOT NULL,
    target_type NVARCHAR(100),
    target_id UNIQUEIDENTIFIER,
    payload NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT SYSDATETIME()
);

-- ================================================
-- TRIGGER (UPDATE updated_at)
-- ================================================

GO
CREATE TRIGGER trg_update_timestamp
ON users
AFTER UPDATE
AS
BEGIN
    UPDATE users SET updated_at = SYSDATETIME()
    WHERE id IN (SELECT id FROM Inserted);
END
GO
