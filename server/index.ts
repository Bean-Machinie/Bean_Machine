import 'dotenv/config';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import path from 'node:path';
import crypto from 'node:crypto';
import { z } from 'zod';

type DbUser = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  email_verified_at: string | null;
  verification_token: string | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'dev-secret-change-me';
const COOKIE_NAME = 'session';
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const DATABASE_FILE = process.env.DATABASE_FILE ?? path.join(process.cwd(), 'auth.db');

// Initialise a simple SQLite database to persist users locally.
const db = new Database(DATABASE_FILE);
db.pragma('journal_mode = WAL');
db.prepare(
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    email_verified_at TEXT,
    verification_token TEXT
  )`
).run();

type Mailer = {
  transporter: nodemailer.Transporter;
  canPreview: boolean;
};

// Create an Ethereal test account on boot so verification emails can be inspected locally.
const transporterPromise: Promise<Mailer> = nodemailer
  .createTestAccount()
  .then((account) => {
    console.log('📬 Using Ethereal test inbox for emails. Log in at https://ethereal.email/ with the credentials below:');
    console.log(`    User: ${account.user}`);
    console.log(`    Pass: ${account.pass}`);

    const transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass,
      },
    });

    return { transporter, canPreview: true } satisfies Mailer;
  })
  .catch((error: unknown) => {
    console.warn(
      '⚠️  Could not reach Ethereal. Falling back to JSON transport so verification links are still logged.',
      error
    );

    return {
      transporter: nodemailer.createTransport({ jsonTransport: true }),
      canPreview: false,
    } satisfies Mailer;
  });

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const registerSchema = z.object({
  email: z.string().email('Please provide a valid email.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .max(72, 'Password must be 72 characters or fewer.'),
});

const verifySchema = z.object({
  token: z.string().min(1, 'Verification token is required.'),
});

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email.'),
  password: z.string().min(1, 'Password is required.'),
});

function createJwt(user: { id: string; email: string }) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    SESSION_SECRET,
    { expiresIn: TOKEN_EXPIRY_MS / 1000 }
  );
}

function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_EXPIRY_MS,
    path: '/',
  });
}

function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function findUserByEmail(email: string): DbUser | undefined {
  const statement = db.prepare('SELECT * FROM users WHERE email = ?');
  return statement.get(normalizeEmail(email)) as DbUser | undefined;
}

function findUserById(id: string): DbUser | undefined {
  const statement = db.prepare('SELECT * FROM users WHERE id = ?');
  return statement.get(id) as DbUser | undefined;
}

function findUserByToken(token: string): DbUser | undefined {
  const statement = db.prepare('SELECT * FROM users WHERE verification_token = ?');
  return statement.get(token) as DbUser | undefined;
}

async function sendVerificationEmail(email: string, token: string) {
  const { transporter, canPreview } = await transporterPromise;
  const verifyUrl = `${CLIENT_ORIGIN}/verify?token=${token}`;

  const info = await transporter.sendMail({
    from: 'Bean Machine Auth <no-reply@example.com>',
    to: email,
    subject: 'Verify your email',
    text: `Thanks for signing up! Confirm your email by visiting ${verifyUrl}`,
    html: `<p>Thanks for signing up!</p><p>Please confirm your email by clicking the link below:</p><p><a href="${verifyUrl}">Verify email</a></p>`,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`✅ Verification email preview for ${email}: ${previewUrl}`);
  } else if (!canPreview) {
    console.log('✉️ Verification email payload (JSON transport):', info);
    console.log(`🔗 Direct verification link: ${verifyUrl}`);
  }
}

// Hydrate req.user when a valid session cookie is present.
function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, SESSION_SECRET) as { sub: string; email: string };
    const user = findUserById(payload.sub);
    if (!user || !user.email_verified_at) {
      clearAuthCookie(res);
      return next();
    }

    req.user = { id: user.id, email: user.email };
  } catch {
    clearAuthCookie(res);
  }

  return next();
}

// Guard endpoints that require a logged-in user.
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  return next();
}

app.use(authenticate);

app.post('/api/auth/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input.' });
  }

  const { email, password } = parsed.data;
  const normalizedEmail = normalizeEmail(email);

  const existing = findUserByEmail(normalizedEmail);
  if (existing) {
    return res.status(409).json({ message: 'An account with that email already exists.' });
  }

  const id = crypto.randomUUID();
  const verificationToken = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();

  try {
    db.prepare(
      `INSERT INTO users (id, email, password_hash, created_at, email_verified_at, verification_token)
       VALUES (?, ?, ?, ?, NULL, ?)`
    ).run(id, normalizedEmail, passwordHash, now, verificationToken);
  } catch (error: unknown) {
    console.error('Failed to insert user', error);
    return res.status(500).json({ message: 'Could not create account. Please try again.' });
  }

  try {
    await sendVerificationEmail(email, verificationToken);
  } catch (error: unknown) {
    console.error('Failed to send verification email', error);
    return res.status(500).json({ message: 'Could not send verification email. Please try again.' });
  }

  return res.status(201).json({ message: 'Account created. Please check the verification email.' });
});

app.post('/api/auth/verify', (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid token.' });
  }

  const { token } = parsed.data;
  const user = findUserByToken(token);
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired verification token.' });
  }

  db.prepare(
    `UPDATE users
     SET email_verified_at = ?, verification_token = NULL
     WHERE id = ?`
  ).run(new Date().toISOString(), user.id);

  return res.json({ message: 'Email verified successfully. You can now sign in.' });
});

app.post('/api/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input.' });
  }

  const { email, password } = parsed.data;
  const user = findUserByEmail(email);

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  if (!user.email_verified_at) {
    return res.status(403).json({ message: 'Please verify your email before signing in.' });
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = createJwt({ id: user.id, email: user.email });
  setAuthCookie(res, token);

  return res.json({ user: { id: user.id, email: user.email } });
});

app.post('/api/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  return res.json({ message: 'Signed out.' });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Not found.' });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error', err);
  res.status(500).json({ message: 'An unexpected error occurred.' });
});

app.listen(PORT, () => {
  console.log(`🚀 API ready at http://localhost:${PORT}`);
  console.log('Sign up from the client and open the logged preview URL to verify the account.');
});
