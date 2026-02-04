# Database Setup

This project uses **PostgreSQL** for both development and production.

## Database Providers

You can use any PostgreSQL provider:

| Provider | Free Tier | Best For |
|----------|-----------|----------|
| [Neon](https://neon.tech) | 512 MB | Serverless, Vercel integration |
| [Supabase](https://supabase.com) | 500 MB | Full backend suite |
| [Vercel Postgres](https://vercel.com/storage/postgres) | 256 MB | Vercel deployments |
| Local PostgreSQL | N/A | Local development |

## Setup Steps

1. Install dependencies:
```bash
pnpm install
```

2. Setup Environment Variables:
   - Create a `.env` file with:
     ```
     DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
     JWT_SECRET="your-strong-random-secret-key-min-32-chars"
     GROQ_API_KEY="your-groq-api-key"
     ```
   - Replace with your actual PostgreSQL connection string from your provider

3. Generate Prisma Client:
```bash
npx prisma generate
```

4. Push Database Schema (Development):
```bash
npx prisma db push
```

5. Or Run Migrations (Production):
```bash
npx prisma migrate deploy
```

6. Start the dev server:
```bash
pnpm dev
```

## Useful Commands

- View database in Prisma Studio:
```bash
npx prisma studio
```

- Create a new migration:
```bash
npx prisma migrate dev --name your_migration_name
```

## Connection String Examples

### Neon
```
postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Supabase
```
postgresql://postgres:password@db.abcdefghijklmnop.supabase.co:5432/postgres
```

### Local PostgreSQL
```
postgresql://postgres:password@localhost:5432/oneday
```
