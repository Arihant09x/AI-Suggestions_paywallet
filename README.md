# 🚀 **PayWallet**

Welcome to **PayWallet** — your modern, secure, and AI-powered digital wallet for instant money transfers, QR payments, and effortless financial management.

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Setup & Installation](#setup--installation)
- [Running the Application](#running-the-application)
- [API Routes](#api-routes)
- [Frontend Pages](#frontend-pages)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## 📝 About

**PayWallet** is a full-stack digital wallet application designed to provide users with a seamless, secure, and intelligent payment experience. It supports instant transfers, QR code payments, AI-driven suggestions, and comprehensive transaction management.

---

## ✨ Features

- ⚡ **Instant Transfers**: Send money instantly using phone numbers or usernames.
- 🔒 **Secure & Safe**: Bank-level security with encrypted transactions and authentication.
- 🤖 **AI Smart Suggestions**: Personalized payment suggestions powered by AI.
- 📱 **QR Payments**: Generate and scan QR codes for quick payments.
- 💼 **Easy Management**: Track transactions and wallet balance effortlessly.
- 🌍 **Global Reach**: Trusted by 10,000+ users worldwide.

---

## 🛠️ Tech Stack

### Backend

- **Node.js** & **Express** — REST API server
- **MongoDB** & **Mongoose** — Database and ODM
- **JWT** — Authentication
- **Cors** — Cross-Origin Resource Sharing
- **Dotenv** — Environment variable management

### Frontend

- **Next.js** (React + TypeScript) — Frontend framework
- **Tailwind CSS** — Styling and responsive design
- **Radix UI** — Accessible UI components
- **Lucide Icons** — Iconography
- **React Hook Form** & **Zod** — Form handling and validation
- **QR Code Libraries** — QR code generation and scanning

---

## 🏗️ Architecture

```
paytm/
├── backend/                  # Backend API server
│   ├── index.js             # Entry point, server setup, DB connection
│   ├── routes/              # API route handlers (user, account, etc.)
│   ├── Middleware/          # Express middleware (e.g., userAuth)
│   └── Model/               # Mongoose models and DB config
│
├── frontend/                 # Next.js frontend app
│   ├── app/                 # Pages and layouts (React Server Components)
│   ├── components/          # Reusable UI components
│   ├── contexts/            # React context providers (e.g., AuthContext)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   ├── services/            # API and notification services
│   ├── public/              # Static assets (images, icons)
│   └── styles/              # Global and component styles
│
├── Dockerfile               # Docker configuration for containerization
├── README.md                # This file
└── .env                     # Environment variables (not committed)
```

---

## ⚙️ Setup & Installation

### Prerequisites

- Node.js (v16+ recommended)
- MongoDB instance (local or cloud)
- npm or yarn package manager

### Backend Setup

```bash
cd backend
npm install
# Create a .env file with:
# MONGO_URi=your_mongodb_connection_string
# PORT=5000 (optional)
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
# Create a .env file if needed for API URLs or keys
npm run dev
```

---

## ▶️ Running the Application

- Backend server runs on `http://localhost:5000` (default)
- Frontend runs on `http://localhost:3000`

Open your browser and navigate to `http://localhost:3000` to access PayWallet.

---

## 🔗 API Routes (Backend)

All API routes are prefixed with `/api/v1`.

- `/user` — User authentication and profile management
- `/account` — Account-related operations
- Other routes as defined in `backend/routes/`

---

## 🖥️ Frontend Pages

- `/` — Landing page with features and testimonials
- `/login` — User login page
- `/signup` — User registration page
- `/dashboard` — User dashboard (protected)
- `/add-money` — Add money to wallet
- `/generate-qr` — Generate QR code for payments
- `/pay-via-qr` — Scan and pay via QR code
- `/profile` — User profile management
- `/transactions` — Transaction history
- `/transfer` — Money transfer page

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit pull requests for improvements or bug fixes.

---

## 📄 License

This project is licensed under the ISC License.

---

## 📞 Contact

For support or inquiries, please contact the project maintainer.

---

Thank you for choosing **PayWallet**! 🎉
