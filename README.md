# Khair Charity Platform

A full-stack Next.js application for managing charitable donations with separate interfaces for donors and administrators. The platform facilitates both monetary donations and date fruit donations, with comprehensive analytics and management capabilities.

## 🌟 Features

### For Donors
- Easy-to-use donation forms with customizable amounts
- Mobile-responsive interface
- Phone number validation
- Support for multiple donation types (Monetary/Dates)
- Real-time form validation
- Anonymous donation option
- Rate limiting and honeypot fields for spam protection

### For Administrators
- Comprehensive dashboard for organization management
- Detailed analytics and reporting
- Export functionality for donations data (Excel/CSV)
- User management system
- Image upload capabilities
- Date donations tracking system
- Real-time statistics and visualizations

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes, AWS Services
- **Database**: Amazon DynamoDB
- **Storage**: AWS S3, Vercel Blob Storage
- **Authentication**: Custom JWT implementation
- **Email**: AWS SES
- **Styling**: TailwindCSS with custom configurations
- **Charts**: Chart.js, Recharts

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Start the development server: `npm run dev`

## 🔐 Security Features

- JWT-based authentication
- Phone number validation
- Rate limiting
- Secure file uploads
- Environment variable protection