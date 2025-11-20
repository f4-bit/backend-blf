# 🩸 Blood Donation App – Backend API

Backend oficial del sistema de gestión de campañas, donación de sangre, control médico y notificaciones internas.

Implementado en **Node.js + Express**, con base de datos **SQL Server**, autenticación con **JWT Access Tokens**, **Refresh Tokens**, **Logout con Blacklist**, y una arquitectura modular profesional.

---

# 📚 Tabla de Contenido
1. Descripción General  
2. Tecnologías Utilizadas  
3. Arquitectura del Proyecto  
4. Instalación y Configuración  
5. Variables de Entorno  
6. Scripts Útiles  
7. Autenticación (JWT + Refresh Tokens + Logout)  
8. Endpoints Principales  
9. Detalle de Endpoints  
10. Pruebas con Postman  
11. Estatus de Respuestas  
12. Estructura de Base de Datos  
13. Autores  

---

# 📝 Descripción General
Este backend sirve como API para un sistema completo de donación de sangre, permitiendo:
- Gestión de usuarios (donantes, personal médico y administradores)
- Gestión de campañas de donación
- Solicitud de citas
- Registros médicos previos a la donación
- Registro de donaciones
- Gestión de inventario de sangre
- Envío de notificaciones internas

Incluye autenticación robusta con Access Tokens, Refresh Tokens e invalidación mediante logout.

---

# 🛠 Tecnologías Utilizadas
| Área | Tecnología |
|------|------------|
| Runtime | Node.js |
| Framework | Express |
| Base de datos | SQL Server |
| Driver | mssql |
| Autenticación | JWT |
| Hashing | bcrypt |
| IDs | uuid |
| Testing manual | Postman |

---

# 🏗 Arquitectura del Proyecto
Según la estructura real del backend:
```
src/
 ├─ config/
 │   └─ database.js
 ├─ controllers/
 │   ├─ appointment.controller.js
 │   ├─ auth.controller.js
 │   ├─ campaign.controller.js
 │   ├─ donation.controller.js
 │   ├─ inventory.controller.js
 │   ├─ medicalCheck.controller.js
 │   └─ notifications.controller.js
 ├─ middlewares/
 │   ├─ auth.middleware.js
 │   └─ errorHandler.js
 ├─ models/
 ├─ routes/
 │   ├─ appointment.routes.js
 │   ├─ auth.routes.js
 │   ├─ campaign.routes.js
 │   ├─ donation.routes.js
 │   ├─ inventory.routes.js
 │   ├─ medicalCheck.routes.js
 │   └─ notification.routes.js
 ├─ scripts/
 │   ├─ checkDatabase.js
 │   ├─ db_complement.sql
 │   ├─ db_creation.sql
 │   ├─ db_seed.sql
 │   ├─ rehashPasswords.js
 │   └─ seedDatabase.js
 ├─ utils/
 │   ├─ bcrypt.js
 │   ├─ jwt.js
 │   ├─ tokenBlacklist.js
 ├─ app.js
 └─ server.js
```

---

# ⚙ Instalación y Configuración
1. Clonar el repositorio  
2. Instalar dependencias:
```bash
npm install
```
3. Crear archivo `.env` (ver sección siguiente)
4. Ejecutar:
```bash
npm run dev
```

---

# 🔐 Variables de Entorno
```
PORT=3000

DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_SERVER=tu_servidor
DB_DATABASE=blood_donation

JWT_ACCESS_SECRET=clave_access
JWT_REFRESH_SECRET=clave_refresh
```

---

# 🧰 Scripts Útiles
### Verificar información en la BD
```
node src/scripts/checkDatabase.js
```
### Ejecutar seeds realistas
```
node src/scripts/seedDatabase.js
```

---

# 🔑 Autenticación (JWT + Refresh Tokens + Logout)

### ✔ Access Token
- Expira rápido (15 min)
- Se envía en `Authorization: Bearer`

### ✔ Refresh Token
- Expira en 7 días
- Se solicita únicamente en `/auth/refresh`

### ✔ Logout (con Blacklist)
- Añade el access token a una blacklist en memoria
- Cualquier endpoint protegido lo rechazará con:
```
401 — Token invalidated. Please log in again.
```

---

# 🌐 Endpoints Principales
| Módulo | Endpoint | Método | Acceso |
|--------|----------|--------|--------|
| Auth | /auth/register | POST | Público |
| Auth | /auth/login | POST | Público |
| Auth | /auth/refresh | POST | Público |
| Auth | /auth/logout | POST | Protegido |
| Campaigns | /campaigns | GET | Público |
| Campaigns | /campaigns/:id | GET | Público |
| Appointments | /appointments | POST | Donor |
| Appointments | /appointments/me | GET | Donor |
| Medical Checks | /medical_checks | POST | Medical Staff |
| Donations | /donations | POST | Medical Staff |
| Inventory | /inventory | GET | Admin / Medical Staff |
| Notifications | /notifications/send | POST | Admin |

---

# 📑 Detalle de Endpoints

## 🔐 AUTH
### POST /auth/login
```
{
  "email": "test@example.com",
  "password": "123456"
}
```
Retorna access y refresh tokens.

---

## 📢 CAMPAIGNS
### GET /campaigns
Obtiene todas las campañas (público).

### GET /campaigns/:id
Obtiene campaña por ID.

---

## 📅 APPOINTMENTS
### POST /appointments (donor)
Registra cita.

### GET /appointments/me (donor)
Devuelve citas del usuario autenticado.

---

## 🩺 MEDICAL CHECKS
### POST /medical_checks (medical_staff)
Registra evaluación médica.

---

## 🩸 DONATIONS
### POST /donations (medical_staff)
Registra donación, actualiza inventario y cita.

---

## 🗃 INVENTORY
### GET /inventory (admin, medical_staff)
Consulta inventario de unidades por tipo de sangre.

---

## 🔔 NOTIFICATIONS
### POST /notifications/send (admin)
Envía una notificación a un usuario específico.

---

# 🧪 Pruebas con Postman
Se incluye una colección automatizada:  
**BloodDonationApp_Backend_API.postman_collection.json**

Incluye:
- Variables automáticas (access y refresh tokens)
- Roles y rutas organizadas
- Pruebas automatizadas por endpoint
- Flujo completo: Login → Protected → Refresh → Logout → Error

---

# 🔁 Estatus de Respuestas
| Código | Significado |
|--------|-------------|
| 200 | OK |
| 201 | Creado |
| 400 | Error del cliente |
| 401 | No autorizado |
| 403 | Permisos insuficientes |
| 404 | No encontrado |
| 500 | Error interno |

---

# 🗄 Estructura de Base de Datos
Incluye tablas principales:
- users
- campaigns
- appointments
- medical_checks
- donations
- inventory

Detalles en archivos:
```
db_creation.sql
db_seed.sql
db_complement.sql
```

---

# 👥 Autores
- **Santiago Quintero**  
- **Fabián Camilo Quintero Pareja**  
- **Eduardo Alejandro Negrín Pérez**  

---


