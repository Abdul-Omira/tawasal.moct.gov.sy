# Security Setup Guide

## Environment Variables Security

### ⚠️ CRITICAL SECURITY NOTICE
**NEVER commit sensitive credentials to version control!**

### Proper Environment Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your actual credentials:**
   ```bash
   nano .env  # or use your preferred editor
   ```

3. **Verify `.env` is in `.gitignore`:**
   - The `.env` file is already included in `.gitignore`
   - This prevents accidental commits of sensitive data

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MINISTRY_SMTP_HOST` | SMTP server hostname | `mail.moct.gov.sy` |
| `MINISTRY_SMTP_PORT` | SMTP server port | `465` |
| `MINISTRY_SMTP_USER` | SMTP username | `tawasal@moct.gov.sy` |
| `MINISTRY_SMTP_PASSWORD` | SMTP password | `your-secure-password` |
| `JWT_SECRET` | JWT signing secret | `your-jwt-secret` |
| `CAPTCHA_SECRET` | Captcha verification secret | `your-captcha-secret` |
| `APP_URL` | Application URL | `http://localhost:3000` |
| `MINISTER_EMAIL` | Minister's email address | `minister@moct.gov.sy` |

### Security Best Practices

1. **Use strong, unique passwords**
2. **Rotate credentials regularly**
3. **Never share credentials in plain text**
4. **Use different credentials for different environments**
5. **Monitor access logs regularly**

### Production Deployment

For production deployment, set environment variables through your hosting platform:

- **PM2**: Use `pm2 start ecosystem.config.js --env production`
- **Docker**: Use `-e` flags or docker-compose environment files
- **Cloud platforms**: Use their environment variable management systems

### Troubleshooting

If emails are not working:

1. Check that `.env` file exists and has correct values
2. Verify SMTP credentials are correct
3. Test SMTP connection: `nc -z mail.moct.gov.sy 465`
4. Check application logs for error messages

### Emergency Response

If credentials are compromised:

1. **Immediately** change the compromised credentials
2. Review access logs for unauthorized usage
3. Update all environment files
4. Notify the security team
