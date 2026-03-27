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
  openId: varchar("openid", { length: 64 }).notNull().unique(), // Mapeado para 'openid'
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: text("passwordhash"), // Mapeado para 'passwordhash'
  role: roleEnum("role").default("user").notNull(),
  status: statusEnum("status").default("active").notNull(),
  passwordChangedAt: timestamp("passwordchangedat"), // Mapeado para 'passwordchangedat'
  firstLoginCompleted: boolean("firstlogincompleted").default(false).notNull(), // Mapeado para 'firstlogincompleted'
  loginMethod: varchar("loginmethod", { length: 64 }), // Mapeado para 'loginmethod'
  createdAt: timestamp("createdat").defaultNow().notNull(), // Mapeado para 'createdat'
  updatedAt: timestamp("updatedat").defaultNow().notNull(), // Mapeado para 'updatedat'
  lastSignedIn: timestamp("lastsignedin").defaultNow().notNull(), // Mapeado para 'lastsignedin'
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
  createdAt: timestamp("createdat").defaultNow().notNull(),
  updatedAt: timestamp("updatedat").defaultNow().notNull(),
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
  courseId: integer("courseid").notNull(), // Mapeado para 'courseid'
  description: text("description"),
  credits: integer("credits"),
  workload: integer("workload"),
  semester: integer("semester"),
  status: subjectStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("createdat").defaultNow().notNull(),
  updatedAt: timestamp("updatedat").defaultNow().notNull(),
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
    userId: integer("userid").notNull(), // Mapeado para 'userid'
    courseId: integer("courseid").notNull(), // Mapeado para 'courseid'
    enrollmentDate: date("enrollmentdate").notNull(), // Mapeado para 'enrollmentdate'
    status: enrollmentStatusEnum("status").default("active").notNull(),
    currentSemester: integer("currentsemester").default(1).notNull(), // Mapeado para 'currentsemester'
    registrationNumber: varchar("registrationnumber", { length: 50 }).unique(), // Mapeado para 'registrationnumber'
    createdAt: timestamp("createdat").defaultNow().notNull(),
    updatedAt: timestamp("updatedat").defaultNow().notNull(),
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
    enrollmentId: integer("enrollmentid").notNull(), // Mapeado para 'enrollmentid'
    subjectId: integer("subjectid").notNull(), // Mapeado para 'subjectid'
    semester: integer("semester").notNull(),
    firstBimester: decimal("firstbimester", { precision: 4, scale: 2 }), // Mapeado para 'firstbimester'
    secondBimester: decimal("secondbimester", { precision: 4, scale: 2 }), // Mapeado para 'secondbimester'
    thirdBimester: decimal("thirdbimester", { precision: 4, scale: 2 }), // Mapeado para 'thirdbimester'
    fourthBimester: decimal("fourthbimester", { precision: 4, scale: 2 }), // Mapeado para 'fourthbimester'
    semesterGrade: decimal("semestergrade", { precision: 4, scale: 2 }), // Mapeado para 'semestergrade'
    finalExam: decimal("finalexam", { precision: 4, scale: 2 }), // Mapeado para 'finalexam'
    finalGrade: decimal("finalgrade", { precision: 4, scale: 2 }), // Mapeado para 'finalgrade'
    status: gradeStatusEnum("status").default("pending").notNull(),
    recordedBy: integer("recordedby"), // Mapeado para 'recordedby'
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

export type Grade = typeof grades.$inferSelect;
export type InsertGrade = typeof grades.$inferInsert;

/**
 * Tabela de frequência
 */
export const attendance = pgTable(
  "attendance",
  {
    id: serial("id").primaryKey(),
    enrollmentId: integer("enrollmentid").notNull(), // Mapeado para 'enrollmentid'
    subjectId: integer("subjectid").notNull(), // Mapeado para 'subjectid'
    semester: integer("semester").notNull(),
    totalClasses: integer("totalclasses").default(0).notNull(), // Mapeado para 'totalclasses'
    attendedClasses: integer("attendedclasses").default(0).notNull(), // Mapeado para 'attendedclasses'
    attendancePercentage: decimal("attendancepercentage", { precision: 5, scale: 2 }).default("0.00").notNull(), // Mapeado para 'attendancepercentage'
    status: attendanceStatusEnum("status").default("good").notNull(),
    recordedBy: integer("recordedby"), // Mapeado para 'recordedby'
    recordedAt: timestamp("recordedat").defaultNow().notNull(),
    createdAt: timestamp("createdat").defaultNow().notNull(),
    updatedAt: timestamp("updatedat").defaultNow().notNull(),
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
  targetRole: announcementTargetEnum("targetrole").default("all").notNull(), // Mapeado para 'targetrole'
  priority: announcementPriorityEnum("priority").default("medium").notNull(),
  published: boolean("published").default(false).notNull(),
  publishedAt: timestamp("publishedat"), // Mapeado para 'publishedat'
  createdBy: integer("createdby").notNull(), // Mapeado para 'createdby'
  createdAt: timestamp("createdat").defaultNow().notNull(),
  updatedAt: timestamp("updatedat").defaultNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

/**
 * Tabela de histórico de login
 */
export const loginHistory = pgTable("loginHistory", {
  id: serial("id").primaryKey(),
  userId: integer("userid").notNull(), // Mapeado para 'userid'
  loginTime: timestamp("logintime").defaultNow().notNull(), // Mapeado para 'logintime'
  logoutTime: timestamp("logouttime"), // Mapeado para 'logouttime'
  ipAddress: varchar("ipaddress", { length: 45 }), // Mapeado para 'ipaddress'
  userAgent: text("useragent"), // Mapeado para 'useragent'
});

export type LoginHistory = typeof loginHistory.$inferSelect;
export type InsertLoginHistory = typeof loginHistory.$inferInsert;

/**
 * Tabela de logs de auditoria
 */
export const auditLogs = pgTable("auditLogs", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entitytype", { length: 50 }).notNull(), // Mapeado para 'entitytype'
  entityId: integer("entityid"), // Mapeado para 'entityid'
  performedBy: integer("performedby"), // Mapeado para 'performedby'
  changes: text("changes"),
  createdAt: timestamp("createdat").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
