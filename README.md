# 🚀 Udyam Registration Portal - Full Stack Application

A comprehensive, production-ready Udyam Registration Portal that replicates the official Government of India MSME portal with enhanced features, real-time validation, and modern web technologies.

![Udyam Portal](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Tech Stack](https://img.shields.io/badge/Tech%20Stack-Full%20Stack-blue)

## Demo
https://github.com/user-attachments/assets/af241a91-affd-4926-9ba9-03a129f69cd2

## 🌟 Overview

The Udyam Registration Portal is a full-stack web application that provides a seamless, user-friendly interface for MSME (Micro, Small and Medium Enterprises) registration. Built with modern web technologies, it offers:

- **Pixel-perfect UI replication** of the official Udyam portal
- **Real-time form validation** with comprehensive error handling
- **Responsive design** for all devices and screen sizes
- **Secure backend API** with rate limiting and validation
- **Database integration** for data persistence
- **Web scraping capabilities** for form schema extraction

## ✨ Features

### 🎨 Frontend Features
- **Government Portal Design**: Authentic replication of the official Udyam portal
- **Responsive Layout**: Mobile-first design with Tailwind CSS
- **Dynamic Form Sections**: Conditional rendering based on user actions
- **Real-time Validation**: Instant feedback for form inputs
- **OTP Integration**: Secure OTP verification system
- **PAN Verification**: Comprehensive PAN card validation
- **Accessibility**: WCAG compliant design patterns

### 🔧 Backend Features
- **RESTful API**: Comprehensive endpoints for all operations
- **Data Validation**: Zod schema validation with custom rules
- **Rate Limiting**: Protection against abuse and spam
- **Database Integration**: Prisma ORM with SQLite/PostgreSQL support
- **Error Handling**: Structured error responses and logging
- **Security**: CORS configuration and input sanitization

### 🕷️ Scraper Features
- **Automated Data Extraction**: Puppeteer-based web scraping
- **Schema Generation**: Dynamic form schema extraction
- **Multi-step Support**: Handles complex multi-page forms
- **Data Validation**: Extracts validation rules and patterns

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Image Optimization**: Next.js Image Component

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database ORM**: Prisma
- **Validation**: Zod
- **Rate Limiting**: express-rate-limit
- **CORS**: cors middleware

### Database
- **Primary**: PostgreSQL (Production)
- **Development**: SQLite
- **ORM**: Prisma Client
- **Migrations**: Prisma Migrate

### Scraper
- **Browser Automation**: Puppeteer
- **HTML Parsing**: Cheerio
- **HTTP Client**: Axios
- **Language**: TypeScript

### Development Tools
- **Package Manager**: npm (Workspaces)
- **Build Tool**: TypeScript Compiler
- **Process Manager**: Concurrently
- **Testing**: Jest + Supertest

## 📁 Project Structure

```
openbiz/
├── frontend/                
│   ├── src/
│   │   ├── app/             
│   │   │   ├── page.tsx     
│   │   │   ├── layout.tsx   
│   │   │   └── api/         
│   │   └── globals.css      
│   ├── public/              
│   │   └── embleml.png      
│   ├── package.json         
│   └── tailwind.config.js   
├── backend/                  
│   ├── src/
│   │   ├── server.ts        
│   │   ├── services/        
│   │   │   └── validation.service.ts
│   │   └── prisma/          
│   ├── test/                
│   ├── package.json         
│   └── API_DOCUMENTATION.md 
├── scraper/                  
│   ├── src/
│   │   ├── scrape.ts        
│   │   └── scrape-step2.ts  
│   └── package.json         
├── schema/                   
├── docker-compose.yml        
├── package.json              
└── README.md                 
```

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Git**: For version control
- **Docker**: For containerized development (optional)
- **PostgreSQL**: For production database (optional)

### System Requirements
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: 2GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Vishnups08/Udyam-Registration-Portal.git
cd Udyam-Registration-Portal
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm install --workspaces
```

### 3. Environment Setup
```bash
# Backend environment variables
cd backend
cp .env.example .env
# Edit .env with your configuration
```

### 4. Database Setup
```bash
# For SQLite (Development)
cd backend
npx prisma generate
npx prisma db push

# For PostgreSQL (Production)
npx prisma migrate deploy
```

## ⚡ Quick Start

### Development Mode
```bash
# Start both frontend and backend
npm run dev

# Frontend: http://localhost:3000
# Backend: http://localhost:4000
```

### Individual Services
```bash
# Frontend only
npm --workspace frontend run dev

# Backend only
npm --workspace backend run dev

# Scraper
npm run scrape
```

### Production Build
```bash
# Build all services
npm run build

# Start production servers
npm --workspace frontend run start
npm --workspace backend run start
```

## 🛠️ Development

### Workspace Commands
```bash
# Root level commands
npm run dev          # Start development servers
npm run build        # Build all services
npm run scrape       # Run web scraper

# Service-specific commands
npm --workspace frontend run dev
npm --workspace backend run dev
npm --workspace scraper run scrape
```

### Code Structure

#### Frontend Components
- **Main Form**: `frontend/src/app/page.tsx`
- **Layout**: `frontend/src/app/layout.tsx`
- **API Routes**: `frontend/src/app/api/*/route.ts`

#### Backend Services
- **Server**: `backend/src/server.ts`
- **Validation**: `backend/src/services/validation.service.ts`
- **Database**: `backend/prisma/schema.prisma`

#### Scraper Scripts
- **Step 1**: `scraper/src/scrape.ts`
- **Step 2**: `scraper/src/scrape-step2.ts`

### Adding New Features
1. **Frontend**: Add components in `frontend/src/app/`
2. **Backend**: Add routes in `backend/src/server.ts`
3. **Database**: Update schema in `backend/prisma/schema.prisma`
4. **Validation**: Extend schemas in `backend/src/services/validation.service.ts`

## 📚 API Documentation

### Base URL
- **Development**: `http://localhost:4000`
- **Production**: Configure via environment variables

### Endpoints

#### Health Check
```http
GET /health
```

#### Form Schema
```http
GET /schema
```

#### Validation Endpoints
```http
POST /validate/aadhaar
POST /validate/pan
POST /validate/otp
POST /validate/pincode
```

#### Form Submission
```http
POST /submit
```

### Request/Response Examples

#### Aadhaar Validation
```json
POST /validate/aadhaar
{
  "aadhaarNumber": "123456789012"
}

Response:
{
  "valid": true,
  "message": "Aadhaar number is valid"
}
```

#### Form Submission
```json
POST /submit
{
  "aadhaarNumber": "123456789012",
  "entrepreneurName": "John Doe",
  "consent": true,
  "otp": "123456",
  "otpVerified": true,
  "organisationType": "Proprietorship",
  "panNumber": "ABCDE1234F",
  "panHolderName": "John Doe",
  "dob": "1990-01-01",
  "panConsent": true,
  "pincode": "110001",
  "state": "Delhi",
  "city": "New Delhi"
}
```

For complete API documentation, see [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md).

## 🗄️ Database

### Schema Overview
The application uses Prisma ORM with the following main models:

#### UdyamSubmission
```prisma
model UdyamSubmission {
  id                Int      @id @default(autoincrement())
  aadhaarNumber     String
  entrepreneurName  String
  consent           Boolean
  otp               String
  otpVerified       Boolean
  organisationType  String
  panNumber         String
  panHolderName     String
  dob               String
  panConsent        Boolean
  pincode           String
  state             String
  city              String
  status            String   @default("pending")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("udyam_submissions")
}
```

### Database Operations
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Create migration
npx prisma migrate dev --name feature_name

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

## 🧪 Testing

### Running Tests
```bash
# Backend tests
npm --workspace backend run test

# Frontend tests (if configured)
npm --workspace frontend run test
```

### Test Coverage
- **Unit Tests**: Validation service, API endpoints
- **Integration Tests**: Database operations, API responses
- **Test Framework**: Jest with Supertest

### Test Structure
```
backend/test/
├── validation.test.ts    # Validation service tests
└── server.test.ts        # API endpoint tests
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build

# Production build
docker-compose -f docker-compose.prod.yml up --build
```

### Environment Variables
```bash
# Backend (.env)
DATABASE_URL="postgresql://user:password@localhost:5432/udyam"
PORT=4000
NODE_ENV=production

# Frontend (.env.local)
NEXT_PUBLIC_BACKEND_URL="https://api.yourdomain.com"
```

### Production Considerations
- **Database**: Use PostgreSQL in production
- **Environment**: Set NODE_ENV=production
- **SSL**: Enable HTTPS for production
- **Monitoring**: Add logging and health checks
- **Backup**: Implement database backup strategy

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Code quality rules
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message format

### Testing Requirements
- **Unit Tests**: Required for new features
- **Integration Tests**: Required for API changes
- **Test Coverage**: Maintain >80% coverage

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
