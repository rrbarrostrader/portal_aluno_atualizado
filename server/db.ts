import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser,
  users,
  courses,
  subjects,
  enrollments,
  grades,
  attendance,
  announcements,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    // Garantir que o email do admin padrão seja incluído se o openId for o do admin
    if (user.openId === "admin-default-id" && !values.email) {
      values.email = "admin@iabfapgema.com.br";
      updateSet.email = "admin@iabfapgema.com.br";
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId || user.openId === "admin-default-id") {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  try {
    const result = await db.select().from(users).where(eq(users.openId, openId));
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get user by openId:", error);
    return undefined;
  }
}

/**
 * Queries para Usuários
 */
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get user by id:", error);
    return undefined;
  }
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get user by email:", error);
    return undefined;
  }
}

export async function getAllStudents() {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(users).where(eq(users.role, 'user'));
  } catch (error) {
    console.error("[Database] Failed to get all students:", error);
    return [];
  }
}

/**
 * Queries para Cursos
 */
export async function getCourseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    const result = await db.select().from(courses).where(eq(courses.id, id));
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get course by id:", error);
    return undefined;
  }
}

export async function getAllCourses() {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(courses);
  } catch (error) {
    console.error("[Database] Failed to get all courses:", error);
    return [];
  }
}

/**
 * Queries para Disciplinas
 */
export async function getSubjectsByCourse(courseId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(subjects).where(eq(subjects.courseId, courseId));
  } catch (error) {
    console.error("[Database] Failed to get subjects by course:", error);
    return [];
  }
}

/**
 * Queries para Matrículas
 */
export async function getEnrollmentsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(enrollments).where(eq(enrollments.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to get enrollments by user:", error);
    return [];
  }
}

/**
 * Queries para Notas
 */
export async function getGradesByEnrollment(enrollmentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(grades).where(eq(grades.enrollmentId, enrollmentId));
  } catch (error) {
    console.error("[Database] Failed to get grades by enrollment:", error);
    return [];
  }
}

/**
 * Queries para Frequência
 */
export async function getAttendanceByEnrollment(enrollmentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(attendance).where(eq(attendance.enrollmentId, enrollmentId));
  } catch (error) {
    console.error("[Database] Failed to get attendance by enrollment:", error);
    return [];
  }
}

/**
 * Queries para Avisos
 */
export async function getPublishedAnnouncements() {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(announcements).where(eq(announcements.published, true));
  } catch (error) {
    console.error("[Database] Failed to get announcements:", error);
    return [];
  }
}
