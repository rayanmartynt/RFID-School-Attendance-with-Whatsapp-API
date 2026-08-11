# Deployment Guide

This guide covers deploying the Smart School Attendance Management System to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Database Deployment](#database-deployment)
- [Arduino Deployment](#arduino-deployment)
- [SSL/HTTPS Configuration](#sslhttps-configuration)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

## Prerequisites

- Domain name
- SSL certificate (Let's Encrypt recommended)
- Cloud hosting account (AWS, DigitalOcean, Heroku, etc.)
- PostgreSQL database hosting
- WhatsApp Business Cloud API account

## Backend Deployment

### Option 1: Heroku

1. **Create Heroku App**
   ```bash
   heroku create your-app-name
   ```

2. **Add PostgreSQL Add-on**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set DB_HOST=$(heroku config:get DATABASE_URL)
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set WHATSAPP_PHONE_NUMBER_ID=your_phone_id
   heroku config:set WHATSAPP_ACCESS_TOKEN=your_access_token
   heroku config:set FRONTEND_URL=https://your-frontend-domain.com
   ```

4. **Deploy Backend**
   ```bash
   git push heroku main
   ```

5. **Run Database Migrations**
   ```bash
   heroku pg:psql < database/schema.sql
   heroku pg:psql < database/seed_data.sql
   ```

### Option 2: DigitalOcean/AWS EC2

1. **Provision Server**
   - Ubuntu 20.04 or later
   - At least 2GB RAM, 1 CPU
   - 20GB storage

2. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm postgresql nginx
   ```

3. **Setup PostgreSQL**
   ```bash
   sudo -u postgres createdb school_attendance
   sudo -u postgres psql -d school_attendance -f database/schema.sql
   ```

4. **Deploy Backend Code**
   ```bash
   git clone <your-repo>
   cd backend
   npm install --production
   ```

5. **Setup PM2 Process Manager**
   ```bash
   npm install -g pm2
   pm2 start server.js --name attendance-backend
   pm2 startup
   pm2 save
   ```

6. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Frontend Deployment

### Option 1: Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel
   ```

3. **Set Environment Variables**
   - `VITE_API_URL`: Your backend API URL
   - `VITE_SOCKET_URL`: Your backend WebSocket URL

### Option 2: Netlify

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Netlify**
   - Drag and drop the `dist` folder to Netlify dashboard
   - Or use Netlify CLI:
     ```bash
     npm install -g netlify-cli
     netlify deploy --prod
     ```

3. **Configure Environment Variables**
   - Add in Netlify dashboard: `VITE_API_URL`, `VITE_SOCKET_URL`

### Option 3: Serve with Nginx

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Copy to Server**
   ```bash
   scp -r dist/* user@server:/var/www/attendance-frontend
   ```

3. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-frontend-domain.com;

       root /var/www/attendance-frontend;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

## Database Deployment

### Managed PostgreSQL Services

#### AWS RDS
1. Create RDS PostgreSQL instance
2. Configure security group to allow backend server access
3. Get connection endpoint
4. Update backend `.env` with database credentials
5. Run migrations

#### DigitalOcean Managed Database
1. Create PostgreSQL cluster
2. Add trusted sources (backend server IP)
3. Get connection string
4. Update backend configuration
5. Run migrations

### Database Backup

#### Automated Backups (AWS RDS)
- Enable automated backups in RDS console
- Set retention period (7-35 days)
- Enable point-in-time recovery

#### Manual Backup
```bash
pg_dump -U postgres -h your-db-host school_attendance > backup.sql
```

#### Restore Backup
```bash
psql -U postgres -h your-db-host school_attendance < backup.sql
```

## Arduino Deployment

### 1. Configure Each Device

For each Arduino device:
1. Update `DEVICE_ID` in firmware
2. Update `API_KEY` from database
3. Configure WiFi credentials
4. Update server host

### 2. Upload Firmware

```bash
# Using Arduino IDE
1. Connect Arduino via USB
2. Select "Arduino UNO R4 WiFi" board
3. Select correct COM port
4. Upload firmware
```

### 3. Physical Installation

1. Mount Arduino enclosure at gate location
2. Connect RC522 reader to mounting position
3. Install LCD display for user feedback
4. Connect LEDs and buzzer
5. Ensure power supply (USB or external)
6. Test with RFID cards

### 4. Register Device in System

1. Login to admin dashboard
2. Go to Devices page
3. Add new device with matching `DEVICE_ID` and `API_KEY`
4. Set device location and type
5. Verify device shows as "Online"

## SSL/HTTPS Configuration

### Let's Encrypt with Certbot

1. **Install Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Obtain Certificate**
   ```bash
   sudo certbot --nginx -d your-domain.com -d api.your-domain.com
   ```

3. **Auto-renewal**
   ```bash
   sudo certbot renew --dry-run
   ```

### Update Backend for HTTPS

Ensure backend uses HTTPS:
```javascript
// In server.js
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/path/to/private.key'),
  cert: fs.readFileSync('/path/to/certificate.crt')
};

https.createServer(options, app).listen(443);
```

### Update Arduino for HTTPS

Arduino firmware already supports HTTPS via `WiFiSSLClient`. Ensure:
- Server has valid SSL certificate
- Server host matches certificate domain
- Certificate is not self-signed (or handle appropriately)

## Monitoring and Maintenance

### Application Monitoring

#### Backend Monitoring
- Use PM2 monitoring:
  ```bash
  pm2 monit
  ```
- Check logs:
  ```bash
  pm2 logs attendance-backend
  ```

#### Database Monitoring
- Monitor connection pool usage
- Check slow queries
- Monitor disk space
- Set up alerts for database issues

### Log Management

#### Centralized Logging
- Use Winston for backend logging
- Configure log rotation
- Send logs to external service (e.g., Loggly, Papertrail)

#### Log Rotation
```javascript
// In logger.js
const winston = require('winston');
require('winston-daily-rotate-file');

const transport = new winston.transports.DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d'
});
```

### Health Checks

#### Backend Health Check
```bash
curl https://your-domain.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Database Health Check
```bash
psql -U postgres -h your-db-host -c "SELECT 1"
```

### Backup Strategy

1. **Daily Database Backups**
   - Automated at 2 AM
   - Retain for 30 days
   - Store in separate location

2. **Weekly Full System Backup**
   - Backup code, configuration, and database
   - Retain for 3 months
   - Test restore process

3. **Disaster Recovery Plan**
   - Document recovery procedures
   - Test recovery quarterly
   - Maintain offsite backups

### Security Maintenance

1. **Regular Updates**
   - Keep Node.js dependencies updated
   - Apply security patches
   - Update SSL certificates

2. **Security Audits**
   - Review access logs monthly
   - Check for unauthorized access
   - Audit user permissions

3. **Password Security**
   - Rotate database passwords quarterly
   - Update JWT secrets annually
   - Review API key access

### Performance Optimization

#### Backend Optimization
- Enable database query caching
- Implement Redis for session storage
- Optimize database indexes
- Use CDN for static assets

#### Database Optimization
- Analyze slow queries
- Add appropriate indexes
- Partition large tables
- Archive old attendance records

## Troubleshooting Production Issues

### Backend Not Starting
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs attendance-backend --lines 100

# Restart
pm2 restart attendance-backend
```

### Database Connection Issues
```bash
# Test database connection
psql -U postgres -h your-db-host -d school_attendance

# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### SSL Certificate Issues
```bash
# Check certificate expiry
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Reload Nginx
sudo systemctl reload nginx
```

### Arduino Device Offline
1. Check WiFi connectivity at device location
2. Verify device API key matches database
3. Check server accessibility from device network
4. Review Arduino Serial Monitor for errors
5. Verify device last_seen timestamp in dashboard

## Scaling Considerations

### When to Scale
- Backend response time > 500ms
- Database CPU > 70%
- More than 1000 concurrent users
- Arduino devices > 20

### Scaling Strategies

#### Backend Scaling
- Add more application servers behind load balancer
- Use Redis for shared session storage
- Implement horizontal scaling with PM2 cluster mode

#### Database Scaling
- Upgrade to larger instance
- Add read replicas for reporting
- Implement database sharding for large datasets

#### Frontend Scaling
- Use CDN for static assets
- Implement caching headers
- Consider server-side rendering for SEO

## Cost Estimation

### Monthly Costs (Approximate)

- Backend Server (2GB RAM): $20-40
- PostgreSQL Database: $15-50
- Frontend Hosting (Vercel/Netlify): Free-20
- SSL Certificate: Free (Let's Encrypt)
- Domain Name: $10-15/year
- Arduino Hardware: $30-50 per device

**Total Monthly**: $50-110 + Arduino hardware costs

## Support and Maintenance

### Recommended Maintenance Schedule

- **Daily**: Monitor error logs, check device status
- **Weekly**: Review attendance reports, check database size
- **Monthly**: Security updates, backup verification
- **Quarterly**: Performance review, capacity planning
- **Annually**: Security audit, disaster recovery test

### Emergency Contacts

- System Administrator
- Database Administrator
- Network Administrator
- Hardware Technician
