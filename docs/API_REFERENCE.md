---

# 📗 API Reference

## 1. Auth
### POST /auth/register
Registers a new user.

### POST /auth/login
Returns access & refresh tokens.

### POST /auth/refresh
Refreshes the access token.

### POST /auth/logout *(protected)*
Invalidates current token.

---

## 2. Campaigns (Public)
### GET /campaigns
Returns list of active campaigns.

### GET /campaigns/:id
Returns campaign by ID.

---

## 3. Appointments
### POST /appointments *(donor)*
Creates appointment.

### GET /appointments/me *(donor)*
Returns appointments of logged user.

---

## 4. Medical Checks *(medical_staff)*
### POST /medical_checks
Registers a medical evaluation.

---

## 5. Donations *(medical_staff)*
### POST /donations
Registers donation and updates inventory.

---

## 6. Inventory *(admin or medical_staff)*
### GET /inventory
Returns blood inventory by type.

---

## 7. Notifications *(admin)*
### POST /notifications/send
Sends notification to a specific user.

---