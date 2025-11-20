# 📙 Database Schema

## Main Tables
- **users**
- **campaigns**
- **appointments**
- **medical_checks**
- **donations**
- **inventory**

## Relationship Diagram (textual)
```
users (1) ──── (many) appointments
appointments (1) ──── (1) medical_checks
appointments (1) ──── (1) donations
campaigns (1) ──── (many) appointments
donations (many) ─▶ inventory (blood_type)
```

## Example Columns
### users
- id (UUID)
- email
- password_hash
- role

### appointments
- id
- user_id
- campaign_id
- status

### donations
- id
- appointment_id
- donor_id
- blood_type
- volume_ml
