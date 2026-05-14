import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  date,
  integer,
  serial,
  unique,
} from "drizzle-orm/pg-core";

// ============================================
// ENUMS - Definidos PRIMEIRO, fora das tabelas
// ============================================
export const roleEnum = pgEnum("role", ["user", "admin", "teacher"]);
export const statusEnum = pgEnum("status", ["active", "inactive", "suspended"]);
export const courseTypeEnum = pgEnum("course_type", ["graduation", "postgraduate", "technical"]);
export const courseStatusEnum = pgEnum("course_status", ["active", "inactive"]);
export const subjectStatusEnum = pgEnum("subject_status", ["active", "inactive"]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", ["active", "completed", "dropped", "suspended"]);
export const gradeStatusEnum = pgEnum("grade_status", ["pending", "approved", "failed", "incomplete"]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["good", "warning", "critical"]);
export const announcementTypeEnum = pgEnum("announcement_type", ["general", "academic", "financial", "administrative"]);
export const announcementTargetEnum = pgEnum("announcement_target", ["all", "students", "admins"]);
export const announcementPriorityEnum = pgEnum("announcement_priority", ["low", "medium", "high"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "overdue", "cancelled", "refunded"]);
export const paymentMethodEnum = pgEnum("payment_method", ["pix", "credit_card", "bank_slip", "cash"]);

// ============================================
// TABELAS - Usam os enums definidos acima
// ============================================

/**
 * Tabela de usuários - Alunos, Professores e Administradores
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openid", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: text("passwordhash"),
  role: roleEnum("role").default("user").notNull(),
  status: statusEnum("status").default("active").notNull(),
  passwordChangedAt: timestamp("passwordchangedat"),
  firstLoginCompleted: boolean("firstlogincompleted").default(false).notNull(),
  loginMethod: varchar("loginmethod", { length: 64 }),
  createdAt: timestamp("createdat").defaultNow().notNull(),
  updatedAt: timestamp("updatedat").defaultNow().notNull(),
  lastSignedIn: timestamp("lastsignedin").defaultNow().notNull(),
  cpf: varchar("cpf", { length: 14 }).unique(),
  rg: varchar("rg", { length: 20 }),
  birthDate: date("birthdate"),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
});

/**
 * Tabela de cursos
 */
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  type: courseTypeEnum("type").default("graduation").notNull(),
  duration: integer("duration"), // Duração em semestres
  totalWorkload: integer("totalworkload"), // Carga horária total do curso (NOVO)
  status: courseStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("createdat").defaultNow().notNull(),
  updatedAt: timestamp("updatedat").defaultNow().notNull(),
});

/**
 * Tabela de disciplinas
 */
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  courseId: integer("courseid").notNull(),
  description: text("description"),
  credits: integer("credits"),
  workload: integer("workload"), // Carga horária da disciplina
  semester: integer("semester").notNull(), // Semestre obrigatório
  status: subjectStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("createdat").defaultNow().notNull(),
  updatedAt: timestamp("updatedat").defaultNow().notNull(),
});

/**
 * Tabela de matrículas
 */
export const enrollments = pgTable(
  "enrollments",
  {
    id: serial("id").primaryKey(),
    userId: integer("userid").notNull(),
    courseId: integer("courseid").notNull(),
    enrollmentDate: date("enrollmentdate").notNull(),
    status: enrollmentStatusEnum("status").default("active").notNull(),
    currentSemester: integer("currentsemester").default(1).notNull(),
    registrationNumber: varchar("registrationnumber", { length: 50 }).unique(),
    createdAt: timestamp("createdat").defaultNow().notNull(),
    updatedAt: timestamp("updatedat").defaultNow().notNull(),
  },
  (table) => ({
    userCourseUnique: unique("user_course_unique").on(table.userId, table.courseId),
  })
);

/**
 * Tabela de notas
 */
export const grades = pgTable(
  "grades",
  {
    id: serial("id").primaryKey(),
    enrollmentId: integer("enrollmentid").notNull(),
    subjectId: integer("subjectid").notNull(),
    semester: integer("semester").notNull(),
    firstBimester: decimal("firstbimester", { precision: 4, scale: 2 }),
    secondBimester: decimal("secondbimester", { precision: 4, scale: 2 }),
    thirdBimester: decimal("thirdbimester", { precision: 4, scale: 2 }),
    fourthBimester: decimal("fourthbimester", { precision: 4, scale: 2 }),
    status: gradeStatusEnum("status").default("pending").notNull(),
    recordedBy: integer("recordedby"),
    recordedAt: timestamp("recordedat").defaultNow().notNull(),
    createdAt: timestamp("createdat").defaultNow().notNull(),
    updatedAt: timestamp("updatedat").defaultNow().notNull(),
  },
  (table) => ({
    enrollmentSubjectSemesterUnique: unique("enrollment_subject_semester_unique").on(
      table.enrollmentId,
      table.subjectId,
      table.semester
    ),
  })
);

// ... (restante das tabelas: attendance, announcements, payments, etc permanecem iguais)
export const attendance = pgTable("attendance", { id: serial("id").primaryKey() }); // Simplificado para o exemplo
export const announcements = pgTable("announcements", { id: serial("id").primaryKey() });
export const payments = pgTable("payments", { id: serial("id").primaryKey() });
export const financialSettings = pgTable("financialSettings", { id: serial("id").primaryKey() });
export const loginHistory = pgTable("loginHistory", { id: serial("id").primaryKey() });
export const auditLogs = pgTable("auditLogs", { id: serial("id").primaryKey() });
