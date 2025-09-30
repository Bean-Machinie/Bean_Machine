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
import fs from 'node:fs';
import { promises as fsPromises } from 'node:fs';
import multer from 'multer';
import { z } from 'zod';

type DbUser = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  email_verified_at: string | null;
  verification_token: string | null;
};

type DbUserProfile = {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  social_website: string | null;
  social_discord: string | null;
  social_twitter: string | null;
  updated_at: string;
};

type DbProject = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  favorite: number;
};

type DbProjectItem = {
  id: string;
  project_id: string;
  name: string;
  type: string;
  variant: string;
  custom_details: string | null;
  created_at: string;
};

type DbProjectAsset = {
  id: string;
  project_id: string;
  name: string;
  url: string;
  created_at: string;
};

type ApiSocialLinks = {
  website?: string;
  discord?: string;
  twitter?: string;
};

type ApiProfile = {
  id: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  social: ApiSocialLinks;
};

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: ApiProfile;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'dev-secret-change-me';
const COOKIE_NAME = 'session';
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const DATABASE_FILE = process.env.DATABASE_FILE ?? path.join(process.cwd(), 'auth.db');
const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');
const AVATAR_UPLOAD_DIR = path.join(UPLOAD_ROOT, 'avatars');

fs.mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });

// Initialise a simple SQLite database to persist users locally.
const db = new Database(DATABASE_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
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
db.prepare(
  `CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    social_website TEXT,
    social_discord TEXT,
    social_twitter TEXT,
    updated_at TEXT NOT NULL
  )`
).run();
db.prepare(
  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    favorite INTEGER NOT NULL DEFAULT 0 CHECK(favorite IN (0, 1))
  )`
).run();
db.prepare(
  `CREATE TABLE IF NOT EXISTS project_items (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    variant TEXT NOT NULL,
    custom_details TEXT,
    created_at TEXT NOT NULL
  )`
).run();
db.prepare(
  `CREATE TABLE IF NOT EXISTS project_assets (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`
).run();

const selectProjectsByUserStatement = db.prepare(
  `SELECT * FROM projects WHERE user_id = ? ORDER BY datetime(updated_at) DESC`,
);

const selectProfileByUserIdStatement = db.prepare(
  `SELECT * FROM user_profiles WHERE user_id = ?`,
);

const insertProfileStatement = db.prepare(
  `INSERT INTO user_profiles (user_id, display_name, bio, avatar_url, social_website, social_discord, social_twitter, updated_at)
   VALUES (?, NULL, NULL, NULL, NULL, NULL, NULL, ?)`,
);

const updateProfileStatement = db.prepare(
  `UPDATE user_profiles
   SET display_name = ?,
       bio = ?,
       avatar_url = ?,
       social_website = ?,
       social_discord = ?,
       social_twitter = ?,
       updated_at = ?
   WHERE user_id = ?`,
);

const selectProjectByIdStatement = db.prepare(
  `SELECT * FROM projects WHERE id = ? AND user_id = ?`,
);

const selectItemsForProjectStatement = db.prepare(
  `SELECT * FROM project_items WHERE project_id = ? ORDER BY datetime(created_at) ASC`,
);

const selectAssetsForProjectStatement = db.prepare(
  `SELECT * FROM project_assets WHERE project_id = ? ORDER BY datetime(created_at) ASC`,
);

const insertProjectStatement = db.prepare(
  `INSERT INTO projects (id, user_id, name, created_at, updated_at, favorite)
   VALUES (?, ?, ?, ?, ?, 0)`,
);

const updateProjectStatement = db.prepare(
  `UPDATE projects
     SET name = COALESCE(?, name),
         favorite = COALESCE(?, favorite),
         updated_at = ?
   WHERE id = ? AND user_id = ?`,
);

const insertProjectItemStatement = db.prepare(
  `INSERT INTO project_items (id, project_id, name, type, variant, custom_details, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
);

const insertProjectAssetStatement = db.prepare(
  `INSERT INTO project_assets (id, project_id, name, url, created_at)
   VALUES (?, ?, ?, ?, ?)`,
);

const touchProjectStatement = db.prepare(
  `UPDATE projects SET updated_at = ? WHERE id = ? AND user_id = ?`,
);

type ApiProjectItem = {
  id: string;
  name: string;
  type: string;
  variant: string;
  customDetails?: string;
};

type ApiProjectAsset = {
  id: string;
  name: string;
  url: string;
};

type ApiProject = {
  id: string;
  name: string;
  items: ApiProjectItem[];
  assets: ApiProjectAsset[];
  updatedAt: string;
  favorite: boolean;
};

function mapItem(row: DbProjectItem): ApiProjectItem {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    variant: row.variant,
    customDetails: row.custom_details ?? undefined,
  } satisfies ApiProjectItem;
}

function mapAsset(row: DbProjectAsset): ApiProjectAsset {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
  } satisfies ApiProjectAsset;
}

function serializeProject(project: DbProject): ApiProject {
  const items = selectItemsForProjectStatement.all(project.id) as DbProjectItem[];
  const assets = selectAssetsForProjectStatement.all(project.id) as DbProjectAsset[];

  return {
    id: project.id,
    name: project.name,
    items: items.map(mapItem),
    assets: assets.map(mapAsset),
    updatedAt: project.updated_at,
    favorite: Boolean(project.favorite),
  } satisfies ApiProject;
}

function listProjects(userId: string): ApiProject[] {
  const projects = selectProjectsByUserStatement.all(userId) as DbProject[];
  return projects.map(serializeProject);
}

function loadProject(projectId: string, userId: string): ApiProject | undefined {
  const project = selectProjectByIdStatement.get(projectId, userId) as DbProject | undefined;
  if (!project) {
    return undefined;
  }

  return serializeProject(project);
}

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
app.use('/uploads', express.static(UPLOAD_ROOT));

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

const socialLinksSchema = z
  .object({
    website: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^https?:\/\//.test(value), 'Please enter a valid URL (include http:// or https://).'),
    discord: z.string().trim().max(120, 'Discord username must be 120 characters or fewer.').optional(),
    twitter: z.string().trim().max(80, 'Handle must be 80 characters or fewer.').optional(),
  })
  .partial();

const profileUpdateSchema = z
  .object({
    displayName: z.string().trim().max(80, 'Display name must be 80 characters or fewer.').optional(),
    bio: z.string().trim().max(500, 'Bio must be 500 characters or fewer.').optional(),
    avatarUrl: z.string().trim().optional(),
    social: socialLinksSchema.optional(),
  })
  .refine(
    (data) => data.displayName !== undefined || data.bio !== undefined || data.avatarUrl !== undefined || data.social !== undefined,
    { message: 'Provide at least one field to update.' }
  );

const projectItemTypeSchema = z.enum(['board', 'cardDeck', 'questPoster', 'custom']);

const projectItemInputSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required.'),
  type: projectItemTypeSchema,
  variant: z.string().trim().min(1, 'Variant is required.'),
  customDetails: z.string().optional(),
});

const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required.'),
  initialItem: projectItemInputSchema.optional(),
});

const updateProjectSchema = z
  .object({
    name: z.string().trim().min(1, 'Project name is required.').optional(),
    favorite: z.boolean().optional(),
  })
  .refine((data) => data.name !== undefined || data.favorite !== undefined, {
    message: 'Provide at least one field to update.',
  });

const addAssetsSchema = z.object({
  assets: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Asset name is required.'),
        url: z.string().trim().min(1, 'Asset URL is required.'),
      }),
    )
    .min(1, 'Provide at least one asset to add.'),
});

const removeAssetsSchema = z.object({
  assetIds: z.array(z.string().min(1)).min(1, 'Provide at least one asset to remove.'),
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

const AVATAR_FILE_SIZE_LIMIT = 4 * 1024 * 1024; // 4 MB

function normalizeOptionalString(value: string | null | undefined) {
  if (value === undefined || value === null) {
    return value ?? undefined;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function resolveAvatarExtension(mime: string, originalName: string) {
  switch (mime) {
    case 'image/png':
      return '.png';
    case 'image/jpeg':
      return '.jpg';
    case 'image/gif':
      return '.gif';
    case 'image/webp':
      return '.webp';
    default: {
      const ext = path.extname(originalName);
      return ext || '.img';
    }
  }
}

function buildAvatarPublicPath(filename: string) {
  return `/uploads/avatars/${filename}`;
}

async function deleteAvatarFile(avatarUrl: string | null | undefined) {
  if (!avatarUrl) {
    return;
  }

  const relativePath = avatarUrl.startsWith('/') ? avatarUrl.slice(1) : avatarUrl;
  const absolutePath = path.resolve(process.cwd(), relativePath);

  if (!absolutePath.startsWith(UPLOAD_ROOT)) {
    return;
  }

  try {
    await fsPromises.unlink(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn('Failed to remove previous avatar file', error);
    }
  }
}

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, AVATAR_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const extension = resolveAvatarExtension(file.mimetype, file.originalname);
    const uniqueName = `${req.user!.id}-${Date.now()}${extension}`;
    cb(null, uniqueName);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: AVATAR_FILE_SIZE_LIMIT },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed.'));
    }

    cb(null, true);
  },
});

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

function ensureProfileForUser(userId: string): DbUserProfile {
  const existing = selectProfileByUserIdStatement.get(userId) as DbUserProfile | undefined;
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  insertProfileStatement.run(userId, now);

  return {
    user_id: userId,
    display_name: null,
    bio: null,
    avatar_url: null,
    social_website: null,
    social_discord: null,
    social_twitter: null,
    updated_at: now,
  } satisfies DbUserProfile;
}

function mapProfile(user: DbUser, profile: DbUserProfile): ApiProfile {
  return {
    id: user.id,
    email: user.email,
    displayName: profile.display_name,
    bio: profile.bio,
    avatarUrl: profile.avatar_url,
    social: {
      ...(profile.social_website ? { website: profile.social_website } : {}),
      ...(profile.social_discord ? { discord: profile.social_discord } : {}),
      ...(profile.social_twitter ? { twitter: profile.social_twitter } : {}),
    },
  } satisfies ApiProfile;
}

function loadProfile(userId: string): ApiProfile | null {
  const user = findUserById(userId);
  if (!user) {
    return null;
  }

  const profile = ensureProfileForUser(user.id);
  return mapProfile(user, profile);
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

    const profile = loadProfile(user.id);
    if (!profile) {
      clearAuthCookie(res);
      return next();
    }

    req.user = profile;
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
    insertProfileStatement.run(id, now);
  } catch (error: unknown) {
    console.error('Failed to create user profile', error);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return res.status(500).json({ message: 'Could not create account profile. Please try again.' });
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

  const profile = loadProfile(user.id);
  if (!profile) {
    return res.status(500).json({ message: 'Could not load user profile.' });
  }

  return res.json({ user: profile });
});

app.post('/api/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  return res.json({ message: 'Signed out.' });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

app.get('/api/profile', requireAuth, (req, res) => {
  const profile = loadProfile(req.user!.id);
  if (!profile) {
    return res.status(404).json({ message: 'Profile not found.' });
  }

  req.user = profile;
  return res.json({ profile });
});

app.patch('/api/profile', requireAuth, (req, res) => {
  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input.' });
  }

  const userId = req.user!.id;
  const user = findUserById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const existingProfile = ensureProfileForUser(userId);
  const now = new Date().toISOString();

  const updatedProfile: DbUserProfile = {
    ...existingProfile,
    updated_at: now,
  };

  const { displayName, bio, avatarUrl, social } = parsed.data;

  if (displayName !== undefined) {
    updatedProfile.display_name = normalizeOptionalString(displayName) ?? null;
  }

  if (bio !== undefined) {
    updatedProfile.bio = normalizeOptionalString(bio) ?? null;
  }

  if (avatarUrl !== undefined) {
    updatedProfile.avatar_url = normalizeOptionalString(avatarUrl) ?? null;
  }

  if (social) {
    if (social.website !== undefined) {
      updatedProfile.social_website = normalizeOptionalString(social.website ?? null) ?? null;
    }
    if (social.discord !== undefined) {
      updatedProfile.social_discord = normalizeOptionalString(social.discord ?? null) ?? null;
    }
    if (social.twitter !== undefined) {
      updatedProfile.social_twitter = normalizeOptionalString(social.twitter ?? null) ?? null;
    }
  }

  updateProfileStatement.run(
    updatedProfile.display_name,
    updatedProfile.bio,
    updatedProfile.avatar_url,
    updatedProfile.social_website,
    updatedProfile.social_discord,
    updatedProfile.social_twitter,
    updatedProfile.updated_at,
    userId,
  );

  const apiProfile = mapProfile(user, updatedProfile);
  req.user = apiProfile;

  return res.json({ profile: apiProfile });
});

app.post('/api/profile/avatar', requireAuth, (req, res) => {
  avatarUpload.single('avatar')(req, res, async (error) => {
    if (error) {
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Avatar images must be 4MB or smaller.' });
      }

      return res.status(400).json({ message: (error as Error).message || 'Could not upload avatar.' });
    }

    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) {
      return res.status(400).json({ message: 'Please attach an image named "avatar".' });
    }

    const userId = req.user!.id;
    const user = findUserById(userId);
    if (!user) {
      await deleteAvatarFile(buildAvatarPublicPath(file.filename));
      return res.status(404).json({ message: 'User not found.' });
    }

    const existingProfile = ensureProfileForUser(userId);
    await deleteAvatarFile(existingProfile.avatar_url);

    const publicPath = buildAvatarPublicPath(file.filename);
    const now = new Date().toISOString();

    updateProfileStatement.run(
      existingProfile.display_name,
      existingProfile.bio,
      publicPath,
      existingProfile.social_website,
      existingProfile.social_discord,
      existingProfile.social_twitter,
      now,
      userId,
    );

    const updatedProfile: DbUserProfile = {
      ...existingProfile,
      avatar_url: publicPath,
      updated_at: now,
    };

    const apiProfile = mapProfile(user, updatedProfile);
    req.user = apiProfile;

    return res.json({ avatarUrl: publicPath, profile: apiProfile });
  });
});

app.get('/api/projects', requireAuth, (req, res) => {
  const userId = req.user!.id;
  try {
    const projects = listProjects(userId);
    return res.json({ projects });
  } catch (error: unknown) {
    console.error('Failed to list projects', error);
    return res.status(500).json({ message: 'Unable to fetch projects. Please try again.' });
  }
});

app.post('/api/projects', requireAuth, (req, res) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input.' });
  }

  const { name, initialItem } = parsed.data;
  const userId = req.user!.id;
  const projectId = crypto.randomUUID();
  const now = new Date().toISOString();

  const transaction = db.transaction(() => {
    insertProjectStatement.run(projectId, userId, name.trim(), now, now);

    if (initialItem) {
      const itemId = crypto.randomUUID();
      insertProjectItemStatement.run(
        itemId,
        projectId,
        initialItem.name.trim(),
        initialItem.type,
        initialItem.variant.trim(),
        initialItem.customDetails?.trim() || null,
        now,
      );
    }
  });

  try {
    transaction();
  } catch (error: unknown) {
    console.error('Failed to create project', error);
    return res.status(500).json({ message: 'Could not create project. Please try again.' });
  }

  const project = loadProject(projectId, userId);
  if (!project) {
    return res.status(500).json({ message: 'Project could not be loaded after creation.' });
  }

  return res.status(201).json({ project });
});

app.patch('/api/projects/:projectId', requireAuth, (req, res) => {
  const parsed = updateProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input.' });
  }

  const { projectId } = req.params;
  const userId = req.user!.id;
  const existing = selectProjectByIdStatement.get(projectId, userId) as DbProject | undefined;

  if (!existing) {
    return res.status(404).json({ message: 'Project not found.' });
  }

  const now = new Date().toISOString();
  const favoriteValue = parsed.data.favorite === undefined ? null : parsed.data.favorite ? 1 : 0;

  try {
    updateProjectStatement.run(parsed.data.name?.trim() ?? null, favoriteValue, now, projectId, userId);
  } catch (error: unknown) {
    console.error('Failed to update project', error);
    return res.status(500).json({ message: 'Could not update project. Please try again.' });
  }

  const project = loadProject(projectId, userId);
  if (!project) {
    return res.status(500).json({ message: 'Project could not be loaded after update.' });
  }

  return res.json({ project });
});

app.post('/api/projects/:projectId/items', requireAuth, (req, res) => {
  const parsed = projectItemInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input.' });
  }

  const { projectId } = req.params;
  const userId = req.user!.id;
  const existing = selectProjectByIdStatement.get(projectId, userId) as DbProject | undefined;

  if (!existing) {
    return res.status(404).json({ message: 'Project not found.' });
  }

  const itemId = crypto.randomUUID();
  const now = new Date().toISOString();

  const transaction = db.transaction(() => {
    insertProjectItemStatement.run(
      itemId,
      projectId,
      parsed.data.name.trim(),
      parsed.data.type,
      parsed.data.variant.trim(),
      parsed.data.customDetails?.trim() || null,
      now,
    );
    touchProjectStatement.run(now, projectId, userId);
  });

  try {
    transaction();
  } catch (error: unknown) {
    console.error('Failed to add project item', error);
    return res.status(500).json({ message: 'Could not add item to project. Please try again.' });
  }

  const project = loadProject(projectId, userId);
  if (!project) {
    return res.status(500).json({ message: 'Project could not be loaded after adding the item.' });
  }

  const item = project.items.find((candidate) => candidate.id === itemId);

  return res.status(201).json({ item, project });
});

app.post('/api/projects/:projectId/assets', requireAuth, (req, res) => {
  const parsed = addAssetsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input.' });
  }

  const { projectId } = req.params;
  const userId = req.user!.id;
  const existing = selectProjectByIdStatement.get(projectId, userId) as DbProject | undefined;

  if (!existing) {
    return res.status(404).json({ message: 'Project not found.' });
  }

  const createdAssets: ApiProjectAsset[] = [];
  const now = new Date().toISOString();

  const transaction = db.transaction(() => {
    for (const asset of parsed.data.assets) {
      const assetId = crypto.randomUUID();
      const trimmedName = asset.name.trim();
      const trimmedUrl = asset.url.trim();
      insertProjectAssetStatement.run(assetId, projectId, trimmedName, trimmedUrl, now);
      createdAssets.push({ id: assetId, name: trimmedName, url: trimmedUrl });
    }

    touchProjectStatement.run(now, projectId, userId);
  });

  try {
    transaction();
  } catch (error: unknown) {
    console.error('Failed to add project assets', error);
    return res.status(500).json({ message: 'Could not add assets. Please try again.' });
  }

  const project = loadProject(projectId, userId);
  if (!project) {
    return res.status(500).json({ message: 'Project could not be loaded after adding assets.' });
  }

  return res.status(201).json({ assets: createdAssets, project });
});

app.delete('/api/projects/:projectId/assets', requireAuth, (req, res) => {
  const parsed = removeAssetsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input.' });
  }

  const { projectId } = req.params;
  const userId = req.user!.id;
  const existing = selectProjectByIdStatement.get(projectId, userId) as DbProject | undefined;

  if (!existing) {
    return res.status(404).json({ message: 'Project not found.' });
  }

  const placeholders = parsed.data.assetIds.map(() => '?').join(', ');
  const now = new Date().toISOString();

  const transaction = db.transaction(() => {
    const deleteStatement = db.prepare(
      `DELETE FROM project_assets WHERE project_id = ? AND id IN (${placeholders})`,
    );
    const result = deleteStatement.run(projectId, ...parsed.data.assetIds);
    if (result.changes > 0) {
      touchProjectStatement.run(now, projectId, userId);
    }
  });

  try {
    transaction();
  } catch (error: unknown) {
    console.error('Failed to remove project assets', error);
    return res.status(500).json({ message: 'Could not remove assets. Please try again.' });
  }

  const project = loadProject(projectId, userId);
  if (!project) {
    return res.status(500).json({ message: 'Project could not be loaded after removing assets.' });
  }

  return res.json({ project });
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Not found.' });
});

app.use((err: unknown, _req: Request, res: Response) => {
  console.error('Unhandled error', err);
  res.status(500).json({ message: 'An unexpected error occurred.' });
});

app.listen(PORT, () => {
  console.log(`🚀 API ready at http://localhost:${PORT}`);
  console.log('Sign up from the client and open the logged preview URL to verify the account.');
});
