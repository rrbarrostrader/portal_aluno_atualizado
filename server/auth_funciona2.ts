import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "../drizzle/schema";

const SALT_ROUNDS = 10;

/**
 * Gera uma senha temporária aleatória e segura
 * Formato: Inclui maiúsculas, minúsculas, números e caracteres especiais
 */
export function generatePassword(): string {
  const chars = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    special: '!@#$%&*',
  };

  let password = '';
  
  // Garante pelo menos um de cada tipo
  password += chars.uppercase[Math.floor(Math.random() * chars.uppercase.length)];
  password += chars.lowercase[Math.floor(Math.random() * chars.lowercase.length)];
  password += chars.numbers[Math.floor(Math.random() * chars.numbers.length)];
  password += chars.special[Math.floor(Math.random() * chars.special.length)];

  // Preenche o resto com caracteres aleatórios
  const allChars = chars.uppercase + chars.lowercase + chars.numbers + chars.special;
  for (let i = password.length; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Embaralha a senha
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Hash uma senha com bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifica se a senha fornecida corresponde ao hash armazenado
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Autentica um usuário com email e senha
 */
export async function authenticateUser(email: string, password: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.select().from(users).where(eq(users.email, email));

    if (result.length === 0) {
      throw new Error("Invalid email or password");
    }

    const user = result[0];

    if (!user.passwordHash) {
      throw new Error("User has no password set");
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    if (user.status !== "active") {
      throw new Error("User account is not active");
    }

    return user;
  } catch (error) {
    console.error("[Auth] Authentication error:", error);
    throw error;
  }
}

/**
 * Cria o usuário admin padrão se não existir
 */
export async function initializeDefaultAdmin() {
  const db = await getDb();
  if (!db) {
    console.warn("[Auth] Database not available for admin initialization");
    return;
  }

  const adminEmail = "admin@iabfapgema.com.br";
  const defaultPassword = "IAB_@2026_START";

  try {
    // Verifica se o admin já existe
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail));

    if (existingAdmin.length > 0) {
      console.log("[Auth] Admin user already exists");
      return;
    }

    // Cria o usuário admin
    const passwordHash = await hashPassword(defaultPassword);

    await db.insert(users).values({
      openId: "admin-default-id",
      email: adminEmail,
      name: "Administrador IAB FAPEGMA",
      passwordHash,
      role: "admin",
      status: "active",
      firstLoginCompleted: false,
      loginMethod: "email",
    });

    console.log("[Auth] Default admin user created successfully");
    console.log(`[Auth] Email: ${adminEmail}`);
    console.log(`[Auth] Temporary Password: ${defaultPassword}`);
  } catch (error) {
    console.error("[Auth] Failed to initialize default admin:", error);
  }
}

/**
 * Atualiza a senha de um usuário
 */
export async function updateUserPassword(userId: number, newPassword: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const passwordHash = await hashPassword(newPassword);

  await db
    .update(users)
    .set({
      passwordHash,
      passwordChangedAt: new Date(),
      firstLoginCompleted: true,
    })
    .where(eq(users.id, userId));
}
