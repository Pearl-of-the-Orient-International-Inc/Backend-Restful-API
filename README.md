# Pearl of the Orient REST API

This is my backend API project for Pearl of the Orient. I made this guide for my OJT/Intern team so you can onboard quickly, work in the correct branch flow, and submit tasks in a clean and reviewable way.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Repository Branch Strategy](#repository-branch-strategy)
4. [Prerequisites](#prerequisites)
5. [Initial Setup (Step by Step)](#initial-setup-step-by-step)
6. [Run the Project](#run-the-project)
7. [Project Structure](#project-structure)
8. [API Modules](#api-modules)
9. [Intern Workflow (Task to Merge)](#intern-workflow-task-to-merge)
10. [Database and Prisma Notes](#database-and-prisma-notes)
11. [Coding and Collaboration Rules](#coding-and-collaboration-rules)
12. [Troubleshooting](#troubleshooting)
13. [Contact and Escalation](#contact-and-escalation)

## Project Overview
- I use this repository for the REST API of the Pearl of the Orient system.
- This API currently handles:
- Authentication and session flows
- User management
- Organization chart/office management
- The base API path is: `/api/v1`
- Health/root check endpoint: `GET /api/v1/`

## Tech Stack
- Runtime: Node.js + TypeScript
- Framework: Express.js
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT + cookies/sessions
- Validation: Zod
- Logging: Winston (+ Logtail integration)
- Email: Nodemailer

## Repository Branch Strategy
This is the exact branching flow I want everyone to follow:

1. `main`
- Production-ready and approved code only.
- I merge here only after final checking.

2. `dev`
- Integration/testing branch.
- All intern feature work should be merged here first through Pull Request.
- I review and validate in this branch.

3. `feature/*` (or `fix/*`) branches
- Each intern task must have its own branch.
- Examples:
- `feature/auth-login-error-message`
- `feature/org-office-search`
- `fix/user-delete-null-check`

Do not push task code directly to `main` or `dev`.

## Prerequisites
Install the following first:

- Node.js (LTS recommended)
- npm
- PostgreSQL (local or hosted)
- Git

## Initial Setup (Step by Step)
1. Clone the repository
```bash
git clone <your-repo-url>
cd pearl-of-the-orient-rest-api
```

2. Install dependencies
```bash
npm install
```

3. Create your environment file
```bash
copy .env.example .env
```

4. Update `.env` values
- Required values include:
- `PORT`
- `NODE_ENV`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `SMTP_EMAIL`
- `SMTP_PASSWORD`
- Optional logging values:
- `LOGTAIL_SOURCE_TOKEN`
- `LOGTAIL_INGESTING_HOST`
- Note: if you see `SMTP_USER` and `SMTP_PASS` in `.env.example`, use `SMTP_EMAIL` and `SMTP_PASSWORD` because those are the names currently read by the app config.

5. Run Prisma migrations
```bash
npx prisma migrate dev
```

6. (Optional) Open Prisma Studio
```bash
npx prisma studio
```

## Run the Project
Development mode (hot reload):
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Run built server:
```bash
npm start
```

PM2 production command:
```bash
npm run start:prod
```

## Project Structure
```text
prisma/
  schema.prisma
  migrations/
src/
  config/
  common/
  controllers/v1/
  generated/prisma/
  lib/
  mailers/
  middlewares/
  routes/v1/
  validators/
  server.ts
```

## API Modules
Current route groups:

1. Auth routes (`/api/v1/auth`)
- Register
- Login
- Logout
- Refresh token
- Forgot/reset password
- Verify email / resend verification

2. User routes (`/api/v1/users`)
- Get current user
- Update current user
- Delete current user
- Admin-only user listing and management

3. Organization chart routes (`/api/v1/org`)
- Create office
- Get all offices
- Get office by id
- Update office
- Delete office

## Intern Workflow (Task to Merge)
Use this exact process for every assigned task.

1. Sync latest remote branches
```bash
git fetch origin
```

2. Checkout `dev` and pull
```bash
git checkout dev
git pull origin dev
```

3. Create your task branch from `dev`
```bash
git checkout -b feature/<short-task-name>
```

4. Implement your task
- Keep changes focused on the assigned scope only.
- Avoid unrelated file edits.

5. Verify your changes locally
```bash
npm run dev
```
- Call/test the relevant endpoints before pushing.

6. Commit with clear message
```bash
git add .
git commit -m "feat: add <your task summary>"
```

7. Push your branch
```bash
git push origin feature/<short-task-name>
```

8. Open Pull Request to `dev`
- PR base: `dev`
- PR compare: your feature branch
- Include in PR description:
- Task objective
- What you changed
- API endpoints affected
- Screenshots or sample request/response (if applicable)

9. Wait for my review
- I will test/check in `dev`.
- If revisions are needed, apply fixes in the same branch and push again.

10. Merge path
- `feature/*` -> `dev` (after review)
- `dev` -> `main` (only after my approval for production readiness)

## Database and Prisma Notes
- Schema file: `prisma/schema.prisma`
- Generated Prisma client path in this project: `src/generated/prisma`
- If schema changes are needed:
1. Update `prisma/schema.prisma`
2. Create and apply migration:
```bash
npx prisma migrate dev --name <migration_name>
```
3. Commit both schema and migration files.

## Coding and Collaboration Rules
- Write clean and readable TypeScript.
- Reuse existing patterns in:
- `src/controllers/v1`
- `src/middlewares`
- `src/validators`
- Validate inputs using existing validator approach.
- Keep controllers small and focused.
- Add clear commit messages (`feat`, `fix`, `refactor`, `chore`).
- Never commit secrets (real `.env` values, tokens, passwords).

## Troubleshooting
1. `npm install` issues
- Delete `node_modules` and `package-lock.json`, then run `npm install` again.

2. Database connection error
- Recheck `DATABASE_URL`
- Ensure PostgreSQL server is running
- Ensure database user permissions are correct

3. Prisma migration errors
- Confirm database is reachable
- Check for conflicting migration history in `prisma/migrations`

4. Server does not start
- Verify required env variables are set
- Check for port conflict on configured `PORT`

## Contact and Escalation
- For blockers, message me immediately with:
- Task name
- Branch name
- Error log or screenshot
- What you already tried

I prefer early escalation over silent delays so we can keep delivery smooth.
