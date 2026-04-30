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
export const roleEnum = pgEnum("role", ["user", "admin"]);
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

// ============================================
// TABELAS - Usam os enums definidos acima
// ============================================

/**
 * Tabela de usuários - Alunos e Administradores
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: text("passwordHash"),
  role: roleEnum("role").default("user").notNull(),
  status: statusEnum("status").default("active").notNull(),
  passwordChangedAt: timestamp("passwordChangedAt"),
  firstLoginCompleted: boolean("firstLoginCompleted").default(false).notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de cursos
 */
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  type: courseTypeEnum("type").default("graduation").notNull(),
  duration: integer("duration"),
  status: courseStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

/**
 * Tabela de disciplinas
 */
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  courseId: integer("courseId").notNull(),
  description: text("description"),
  credits: integer("credits"),
  workload: integer("workload"),
  semester: integer("semester"),
  status: subjectStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = typeof subjects.$inferInsert;

/**
 * Tabela de matrículas
 */
export const enrollments = pgTable(
  "enrollments",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    courseId: integer("courseId").notNull(),
    enrollmentDate: date("enrollmentDate").notNull(),
    status: enrollmentStatusEnum("status").default("active").notNull(),
    currentSemester: integer("currentSemester").default(1).notNull(),
    registrationNumber: varchar("registrationNumber", { length: 50 }).unique(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    userCourseUnique: unique("user_course_unique").on(table.userId, table.courseId),
  })
);

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = typeof enrollments.$inferInsert;

/**
 * Tabela de notas
 */
export const grades = pgTable(
  "grades",
  {
    id: serial("id").primaryKey(),
    enrollmentId: integer("enrollmentId").notNull(),
    subjectId: integer("subjectId").notNull(),
    semester: integer("semester").notNull(),
    firstBimester: decimal("firstBimester", { precision: 4, scale: 2 }),
    secondBimester: decimal("secondBimester", { precision: 4, scale: 2 }),
    thirdBimester: decimal("thirdBimester", { precision: 4, scale: 2 }),
    fourthBimester: decimal("fourthBimester", { precision: 4, scale: 2 }),
    semesterGrade: decimal("semesterGrade", { precision: 4, scale: 2 }),
    finalExam: decimal("finalExam", { precision: 4, scale: 2 }),
    finalGrade: decimal("finalGrade", { precision: 4, scale: 2 }),
    status: gradeStatusEnum("status").default("pending").notNull(),
    recordedBy: integer("recordedBy"),
    recordedAt: timestamp("recordedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    enrollmentSubjectSemesterUnique: unique("enrollment_subject_semester_unique").on(
      table.enrollmentId,
      table.subjectId,
      table.semester
    ),
  })
);

export type Grade = typeof grades.$inferSelect;
export type InsertGrade = typeof grades.$inferInsert;

/**
 * Tabela de frequência
 */
export const attendance = pgTable(
  "attendance",
  {
    id: serial("id").primaryKey(),
    enrollmentId: integer("enrollmentId").notNull(),
    subjectId: integer("subjectId").notNull(),
    semester: integer("semester").notNull(),
    totalClasses: integer("totalClasses").default(0).notNull(),
    attendedClasses: integer("attendedClasses").default(0).notNull(),
    attendancePercentage: decimal("attendancePercentage", { precision: 5, scale: 2 }).default("0.00").notNull(),
    status: attendanceStatusEnum("status").default("good").notNull(),
    recordedBy: integer("recordedBy"),
    recordedAt: timestamp("recordedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    enrollmentSubjectSemesterUnique: unique("attendance_enrollment_subject_semester_unique").on(
      table.enrollmentId,
      table.subjectId,
      table.semester
    ),
  })
);

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = typeof attendance.$inferInsert;

/**
 * Tabela de avisos
 */
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: announcementTypeEnum("type").default("general").notNull(),
  targetRole: announcementTargetEnum("targetRole").default("all").notNull(),
  priority: announcementPriorityEnum("priority").default("medium").notNull(),
  published: boolean("published").default(false).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdBy: integer("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

/**
 * Tabela de histórico de login
 */
export const loginHistory = pgTable("loginHistory", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  loginTime: timestamp("loginTime").defaultNow().notNull(),
  logoutTime: timestamp("logoutTime"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
});

export type LoginHistory = typeof loginHistory.$inferSelect;
export type InsertLoginHistory = typeof loginHistory.$inferInsert;

/**
 * Tabela de logs de auditoria
 */
export const auditLogs = pgTable("auditLogs", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: integer("entityId"),
  performedBy: integer("performedBy"),
  changes: text("changes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;