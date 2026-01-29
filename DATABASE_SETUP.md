# Database Setup

This project uses **SQLite** for local development.

## Setup Steps

1. Install dependencies:
```bash
npm install
# or
pnpm install
```

2. Setup Environment Variables:
   - Copy `.env.example` to `.env` (if it exists) or create `.env`
   - Ensure your `.env` contains:
     ```
     DATABASE_URL="file:./dev.db"
     JWT_SECRET="your-secret-key"
     ```

3. Generate Prisma Client:
```bash
npx prisma generate
```

4. Push Database Schema:
```bash
npx prisma db push
```
This will create the `dev.db` file in the project root.

5. Start the dev server:
```bash
npm run dev
```

## Useful Commands

- View database in Prisma Studio:
```bash
npx prisma studio
```
