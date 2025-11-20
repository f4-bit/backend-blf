# 📘 Deployment Guide
**Recommended location:** `/docs/DEPLOY_GUIDE.md`

## Recommended Infrastructure
- Node.js LTS
- SQL Server (Azure SQL or local)
- PM2 or Docker (optional)

## Production Environment Variables
Use strong keys:
```
JWT_ACCESS_SECRET=prod_access_key
JWT_REFRESH_SECRET=prod_refresh_key
```

## Steps
1. Install dependencies
2. Set environment variables
3. Run migrations or SQL scripts
4. Start server with PM2:
```
pm install pm2 -g
pm2 start server.js
```

## Security Notes
- Use HTTPS (TLS)
- Never expose refresh tokens in URLs
- Rotate secrets periodically
