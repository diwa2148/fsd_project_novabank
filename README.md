# NovaBank - Mini Banking Simulation System

A banking simulation using React, Vite, Express, MongoDB, and Mongoose. It does not connect to real banks or payment networks.

## Requirements and setup

1. Copy .env.example to .env.
2. Set MONGODB_URI and a random JWT_SECRET of at least 32 characters.
3. Install dependencies with npm install.
4. If upgrading a database created by the earlier NovaBank build, run npm run db:migrate:cents once. It converts existing decimal balances and transaction values to integer cents and preserves their displayed amounts.
5. Run npm run dev. The UI is at http://localhost:5173; the API is at http://localhost:4000.


## while opening the live link:https://fsd-project-novabank.vercel.app/
 For admin portal access:use these credentials
  mail:arjun123@gmail.com
  password:arjun9876
 For user portal access: create account with any mail and password 

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


## Deploy on Vercel

1. Import `diwa2148/fsd_project_novabank` as a Vercel project, using the repository root.
2. Add `MONGODB_URI` with your MongoDB Atlas connection string and `JWT_SECRET` with a random secret of at least 32 characters in the Vercel project’s Environment Variables. Keep `.env` local; never commit it.
3. In MongoDB Atlas, allow connections from the Vercel deployment according to your Atlas network-access policy. The database must support replica-set transactions.
4. Deploy. Vercel builds the Vite client to `dist` and serves the Express API through a Node.js Function under `/api`.
5. If registration should be restricted, set `ALLOWED_REGISTRATION_EMAIL` to a comma-separated allowlist. Leave it unset or blank for open registration. Create an administrator by registering the account and running `npm run admin:promote -- user@example.com` against the deployed database from a trusted local environment.

Vercel’s [Vite deployment guide](https://vercel.com/docs/frameworks/frontend/vite) and [Express deployment guide](https://vercel.com/docs/frameworks/backend/express) cover the platform setup.
