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
     DATABASE_URL="file:./prisma/dev.db"
     JWT_SECRET="your-secret-key"
     ```
   - **IMPORTANT**: Database should be in `./prisma/dev.db` to match where migrations create it

3. Generate Prisma Client:
```bash
npx prisma generate
```

4. Push Database Schema:
```bash
npx prisma db push
```
This will create the `dev.db` file in the `prisma/` folder.

5. Start the dev server:
```bash
npm run dev
```

## Useful Commands

- View database in Prisma Studio:
```bash
npx prisma studio
```

## ⚠️ Common Issue: Foreign Key Constraint Errors

### Problem
You may see errors like:
```
Foreign key constraint violated: `foreign key`
Invalid `prisma.chatConversation.create()` invocation
```

### Why This Happens
1. **Database reset during migration**: When you run `npx prisma migrate dev`, it may reset your database and delete ALL data (including users)
2. **JWT token still valid**: Your browser's JWT token still contains the old userId that no longer exists
3. **Foreign key violation**: When the app tries to create data with that userId, it fails because the user doesn't exist

### Solution
**You must log out and log in again** to create a new user and get a new valid JWT token.

Steps:
1. Click logout in your app
2. Register a new account OR log in with existing credentials
3. The app will create a new user and issue a new JWT token
4. Everything will work normally again

### Prevention
- Always log out after running migrations that reset the database
- Consider using `npx prisma db push` for development (doesn't reset data)
- Use `npx prisma migrate dev` only when you need to create new migration files
