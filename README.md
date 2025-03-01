# TAWASAL.MOCT.GOV.SY
## Syrian Ministry of Communication Platform

Official citizen communication portal for the Syrian Ministry of Communications and Information Technology.

### 🚀 Quick Start (Local Development)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tawasal.moct.gov.sy
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up local database**
   ```bash
   npx tsx setup-local-db.ts
   ```

5. **Start development server**
   ```bash
   npm run dev:local
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - API Health: http://localhost:3000/api/health

### 🔐 Default Login Credentials

- **Admin**: `admin` / `admin123`
- **Employee**: `employee` / `employee123`

### 📁 Project Structure

```
├── client/                 # React frontend application
├── server/                 # Express.js backend server
│   ├── index-local.ts     # Local development server
│   ├── routes-local.ts    # Local development routes
│   └── db-local.ts        # Local SQLite database
├── shared/                 # Shared schemas and types
│   ├── schema.ts          # Production PostgreSQL schema
│   └── schema-local.ts    # Local SQLite schema
├── uploads/               # File uploads directory
├── logs/                  # Application logs
└── production-scripts/    # Production deployment scripts
```

### 🛠️ Available Scripts

- `npm run dev:local` - Start local development server
- `npm run dev:client` - Start Vite development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run db:generate` - Generate database migrations

### 🗄️ Database

The project uses SQLite for local development and PostgreSQL for production.

**Local Development:**
- Database file: `./local-dev.db`
- Setup script: `setup-local-db.ts`

**Production:**
- PostgreSQL database
- Environment variables required

### 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-jwt-secret
COOKIE_SECRET=your-cookie-secret
DATABASE_URL=./local-dev.db
```

### 📝 Features

- **Citizen Communication Forms**: Submit complaints, suggestions, and inquiries
- **Business Submission Forms**: Register business needs and challenges
- **Admin Dashboard**: Manage submissions and communications
- **File Upload Support**: Attach documents and images
- **Security Features**: Rate limiting, input validation, XSS protection
- **RTL Support**: Full Arabic language support
- **Responsive Design**: Mobile-friendly interface

### 🛡️ Security

- Rate limiting on all endpoints
- Input validation and sanitization
- XSS protection
- CSRF protection
- File upload security
- SQL injection prevention

### 🌐 Deployment

Production deployment scripts are available in the `production-scripts/` directory.

### 📄 License

Government of Syria - Ministry of Communications

### 👨‍💻 Author

**Abdulwahab Omira**  
Email: abdulwahab.omira@moct.gov.sy

---

**Syrian Ministry of Communications and Information Technology**  
© 2025 All rights reserved
