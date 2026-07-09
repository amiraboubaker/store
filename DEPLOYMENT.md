# Production Deployment Guide

## Prerequisites

- VPS with Ubuntu 22.04+ (or equivalent)
- Docker Engine 24+ and Docker Compose v2+
- Domain name pointing to your VPS IP
- SSH access to the VPS

## 1. VPS Initial Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo systemctl enable --now docker

# Install Docker Compose (if not included)
sudo apt install docker-compose-plugin -y

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

## 2. Application Deployment

```bash
# Create application directory
sudo mkdir -p /opt/couture-store
sudo chown $USER:$USER /opt/couture-store
cd /opt/couture-store

# Clone repository
git clone https://github.com/YOUR_USERNAME/store.git .
git checkout main

# Create environment file from template
cp .env.example .env

# Generate secure secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output to JWT_SECRET and JWT_REFRESH_SECRET in .env

# Edit .env with your production values
nano .env
```

## 3. Database Setup

```bash
# Initialize MySQL volume
docker compose up -d db

# Wait for MySQL to be ready (30 seconds)
sleep 30

# Verify MySQL is running
docker compose exec db mysqladmin ping -h localhost -u root -p$DB_ROOT_PASSWORD

# Run database migrations (Sequelize sync)
docker compose run --rm app node src/index.js

# Stop containers
docker compose down
```

## 4. Production Deployment

```bash
# Build and start all services
docker compose up -d --build

# Verify all services are running
docker compose ps

# Check application logs
docker compose logs -f app
docker compose logs -f nginx
docker compose logs -f db
```

## 5. SSL/HTTPS with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate (standalone mode since nginx runs in Docker)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates to project directory
sudo mkdir -p /opt/couture-store/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/couture-store/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/couture-store/ssl/
sudo chown -R $USER:$USER /opt/couture-store/ssl

# Update nginx/conf.d/default.conf to enable HTTPS
# (Uncomment the SSL server block and update certificate paths)

# Renew certificates automatically
sudo certbot renew --dry-run
```

## 6. CI/CD Pipeline Setup

### GitHub Secrets Configuration

Add the following secrets to your GitHub repository (Settings > Secrets and variables > Actions):

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | VPS IP address or domain |
| `VPS_USER` | SSH username (e.g., ubuntu) |
| `VPS_SSH_KEY` | Private SSH key for VPS access |
| `VPS_PORT` | SSH port (default: 22) |

### Enable GitHub Container Registry

The workflow uses `GITHUB_TOKEN` automatically. No additional secrets needed for package registry.

## 7. Monitoring and Logging

### Application Logs

```bash
# View real-time logs
docker compose logs -f app

# Logs are automatically rotated (10MB max, 3 files)
# Configure in docker-compose.yml under logging options
```

### Database Backups

```bash
# Create backup script
cat > /opt/couture-store/backup.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker compose exec db mysqldump -u root -p$DB_ROOT_PASSWORD $DB_NAME | gzip > /opt/couture-store/backups/db_$TIMESTAMP.sql.gz
find /opt/couture-store/backups -name "*.sql.gz" -mtime +7 -delete
EOF

chmod +x /opt/couture-store/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; "0 2 * * * /opt/couture-store/backup.sh") | crontab -

# Create backups directory
mkdir -p /opt/couture-store/backups
```

### Health Checks

```bash
# Application health endpoint
curl https://yourdomain.com/health

# Database health
docker compose exec db mysqladmin ping -h localhost -u root -p$DB_ROOT_PASSWORD
```

## 8. Security Hardening

```bash
# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Disable password authentication for SSH
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
# Set: PubkeyAuthentication yes
sudo systemctl restart sshd

# Enable automatic security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 9. Scaling and Updates

```bash
# Update application
cd /opt/couture-store
git pull origin main
docker compose up -d --build

# Scale application instances (requires load balancer configuration)
docker compose up -d --scale app=3

# Zero-downtime deployment
docker compose up -d --build --no-deps app
docker compose exec app node src/index.js || true
docker compose up -d --force-recreate app
```

## 10. Troubleshooting

```bash
# Check container status
docker compose ps

# View logs for specific service
docker compose logs -f app
docker compose logs -f nginx
docker compose logs -f db

# Restart services
docker compose restart

# Rebuild after code changes
docker compose up -d --build

# Access application container shell
docker compose exec app sh

# Access database
docker compose exec db mysql -u root -p$DB_ROOT_PASSWORD $DB_NAME
```

## Important Notes

- **Never commit `.env` to version control** - it contains secrets
- **Always use strong passwords** for database and JWT secrets (32+ characters)
- **Enable HTTPS** in production (Let's Encrypt is free)
- **Regular backups** of the database are essential
- **Monitor logs** for errors and security events
- **Keep Docker and system packages updated**
