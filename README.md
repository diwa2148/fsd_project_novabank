# NovaBank — Mini Banking Simulation System

An educational banking simulation using React, Vite, Express, MongoDB, and Mongoose. It does not connect to real banks or payment networks.

## Requirements and setup

- Node.js 20+
- MongoDB Atlas or MongoDB configured as a replica set (transactions require replica-set support)

1. Copy .env.example to .env.
2. Set MONGODB_URI and a random JWT_SECRET of at least 32 characters.
3. Install dependencies with npm install.
4. If upgrading a database created by the earlier NovaBank build, run npm run db:migrate:cents once. It converts existing decimal balances and transaction values to integer cents and preserves their displayed amounts.
5. Run npm run dev. The UI is at http://localhost:5173; the API is at http://localhost:4000.

## Administrator

Create an account, then promote it with:

    npm run admin:promote -- user@example.com

For a single-account demonstration, set ALLOWED_REGISTRATION_EMAIL in .env. Leave it blank to permit normal registration.

## Functionality

- Registration with checking or savings account selection and a unique account number
- Hashed passwords, JWT authentication and revocable logout sessions, protected APIs, profile editing, and password changes
- Account details and current balance
- Backend-validated deposits, withdrawals, and account-number transfers
- Indian Rupee (INR) display and integer-paise accounting, overdraft protection, idempotency keys, and atomic MongoDB transfer transactions
- Search, type/date filters, pagination, transaction receipts printable to PDF, and CSV account statements
- Smart Spending Insights from completed monthly deposits and withdrawals, category charts, comparisons, and informational savings suggestions
- Quick Transfer Recipients with recipient validation each time a transfer is submitted
- Admin customer/account search, transaction monitoring, deposit and withdrawal volume statistics, and confirmed, audited admin initiated transactions
- Responsive interface with light and dark themes

## Verification

Run npm run build to build the frontend. To verify banking operations, use two registered users on a replica-set database: deposit, withdraw, test an overdraft, transfer by the recipient account number, then verify both balances and transaction records. Transfers to invalid and own account numbers must fail.
