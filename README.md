# RK & Co - Management System

A comprehensive MERN stack management system for tracking oil product purchases, sales, and financial operations. Built with a focus on mobile responsiveness and beautiful UI using Tailwind CSS.

## Features

- 🔐 **Role-Based Access Control (RBAC)**
  - Admin: Full access, can manage users
  - Manager: Can manage purchases and sales
  - Accountant: Financial access
  - Viewer: Read-only access

- 📦 **Product Management**
  - Track four products: Petrol, Hi-Octane, Diesel, Mobile Oil
  - Monitor purchases from suppliers
  - Track sales to customers

- 💰 **Financial Tracking**
  - Track payment status (Paid, Unpaid, Partially Paid)
  - Deposit slip attachment for purchases
  - Real-time balance sheet generation
  - Net receivable and payable calculations

- 📊 **Dashboard & Analytics**
  - Overview of total purchases and sales
  - Transaction counts
  - Financial summaries
  - Quick action buttons

- 📱 **Mobile-First Design**
  - Fully responsive interface
  - Optimized for mobile devices
  - Beautiful Tailwind CSS styling

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT Authentication
- Express Validator

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide React Icons

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "rk management system"
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Configuration**

   Create `server/.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/rkco
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   CLIENT_URL=http://localhost:5173
   ```

   Create `client/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

5. **Start MongoDB**
   Make sure MongoDB is running on your system.

6. **Run the Application**

   Start backend (from `server` directory):
   ```bash
   npm run dev
   ```

   Start frontend (from `client` directory):
   ```bash
   npm run dev
   ```

7. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## Initial Setup

1. **Create Admin User**
   - The first user needs to be created via the API or directly in MongoDB
   - Use the `/api/auth/register` endpoint or create manually in the database
   - Set role to "admin" for full access

2. **Login**
   - Use the login page to access the dashboard
   - Admin users can create other users from the Users page

## Project Structure

```
rk management system/
├── server/
│   ├── src/
│   │   ├── config/        # Database and environment config
│   │   ├── middleware/    # Auth and error handling
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── client/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts (Auth)
│   │   ├── pages/          # Page components
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PATCH /api/users/:id/toggle` - Toggle user active status

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (Admin/Manager)

### Ledger
- `GET /api/ledger/purchases` - Get all purchases
- `POST /api/ledger/purchases` - Create purchase
- `GET /api/ledger/sales` - Get all sales
- `POST /api/ledger/sales` - Create sale
- `GET /api/ledger/balance` - Get balance sheet data

## User Roles

- **Admin**: Full system access, can manage users
- **Manager**: Can manage purchases, sales, and products
- **Accountant**: Can view and manage financial data
- **Viewer**: Read-only access to all data

## Features in Detail

### Purchase Tracking
- Record purchases from suppliers
- Track product type, quantity (liters), and rate
- Payment status tracking (Paid/Unpaid/Partial)
- Deposit slip URL attachment
- View all purchase history

### Sales Tracking
- Record sales to customers
- Track product type, quantity (liters), and rate
- Payment status tracking (Paid/Unpaid/Partial)
- View all sales history

### Balance Sheet
- Total purchases and sales
- Net receivable (from customers)
- Net payable (to suppliers)
- Gross profit calculation
- Net cash flow analysis

## Development

### Backend Scripts
- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server

### Frontend Scripts
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Security Notes

- Change `JWT_SECRET` in production
- Use strong passwords
- Keep MongoDB secure
- Use HTTPS in production
- Regularly update dependencies

## License

This project is proprietary software for RK & Co.

## Support

For issues or questions, please contact the development team.





