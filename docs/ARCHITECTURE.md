# 📘 Technical Architecture

## Overview
The system uses **Node.js + Express** with a modular MVC-like folder structure. SQL Server serves as the relational database.

## Components
- Controllers: business logic
- Routes: endpoint layer
- Middlewares: authentication, blacklisting
- Utils: helpers (jwt generation, bcrypt, etc.)
- Scripts: automation and DB seeding

## Request Lifecycle
```
Client → Route → Middleware (auth) → Controller → DB → Response
```

## JWT Flow
```
Login → Access Token (15m) + Refresh Token (7d)
        ↓
Protected Endpoint → Validate Access Token
        ↓
Logout → Access token added to blacklist
```

## High‑Level Architecture Diagram (textual)
```
┌──────────┐      ┌───────────────┐      ┌────────────┐
│  Client  │ ---> │   Express     │ ---> │ SQL Server │
└──────────┘      └───────────────┘      └────────────┘
        ↖── JWT ───↗
```