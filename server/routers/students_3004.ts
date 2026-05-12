import { z } from "zod";
import { count } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users, enrollments, courses, grades, subjects } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { hashPassword, generatePassword } from "../auth";
import { sendWelcomeEmail } from "../email";

const createStudentSchema = z.object({
  email: z.string().email(),
  name: z.string().min(3),
  courseId: z.number().int().positive(),
  registrationNumber: z.string().optional(),
});

const updateStudentSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(3).optional(),
  email: z.string().email().optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
});

const deleteStudentSchema = z.object({
  id: z.number().int().positive(),
});

const resetPasswordSchema = z.object({
  userId: z.number().int().positive(),
});

// Middleware para verificar se é admin
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Apenas administradores podem acessar este recurso",
    });
  }
  return next({ ctx });
});

export const studentsRouter = router({
  /**
   * Listar todos os alunos com matrícula e curso (Admin)
   */
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível",
      });
    }

    const students = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        status: users.status,
        firstLoginCompleted: users.firstLoginCompleted,
        createdAt: users.createdAt,
        registrationNumber: enrollments.registrationNumber,
        courseId: enrollments.courseId,
        courseName: courses.name,
        courseType: courses.type,
      })
      .from(users)
      .leftJoin(enrollments, eq(users.id, enrollments.userId))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(users.role, "user"))
      .orderBy(users.name);

    return students;
  }),

  /**
   * Obter matrículas do aluno logado (Aluno)
   */
  getMyEnrollments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível",
      });
    }

    const studentEnrollments = await db
      .select({
        id: enrollments.id,
        courseId: enrollments.courseId,
        courseName: courses.name,
        enrollmentDate: enrollments.enrollmentDate,
        status: enrollments.status,
        registrationNumber: enrollments.registrationNumber,
        currentSemester: enrollments.currentSemester,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.userId, ctx.user.id));

    return studentEnrollments;
  }),

  /**
   * Obter notas do aluno logado por matrícula e semestre (Aluno)
   */
  getMyGrades: protectedProcedure
    .input(z.object({ enrollmentId: z.number().int().positive(), semester: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });
      }

      const enrollment = await db
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.id, input.enrollmentId), eq(enrollments.userId, ctx.user.id)))
        .limit(1);

      if (enrollment.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      // Busca disciplinas e notas em uma única query (Left Join) para garantir que todas as disciplinas apareçam
      const result = await db
        .select({
          subjectId: subjects.id,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          courseHours: subjects.courseHours,
          semester: subjects.semester,
          firstBimester: grades.firstBimester,
          secondBimester: grades.secondBimester,
          thirdBimester: grades.thirdBimester,
          fourthBimester: grades.fourthBimester,
          finalExam: grades.finalExam,
          finalGrade: grades.finalGrade,
          status: grades.status,
        })
        .from(subjects)
        .leftJoin(grades, and(
          eq(grades.subjectId, subjects.id),
          eq(grades.enrollmentId, input.enrollmentId)
        ))
        .where(and(
          eq(subjects.courseId, enrollment[0].courseId),
          eq(subjects.semester, input.semester),
          eq(subjects.status, "active")
        ))
        .orderBy(subjects.name);

      return result.map(item => ({
        ...item,
        status: item.status || "pending"
      }));
    }),

  /**
   * Obter semestres que possuem disciplinas cadastradas para o curso (Aluno)
   */
  getCourseSemesters: protectedProcedure
    .input(z.object({ courseId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });

      const result = await db
        .select({ semester: subjects.semester })
        .from(subjects)
        .where(and(eq(subjects.courseId, input.courseId), eq(subjects.status, "active")))
        .groupBy(subjects.semester)
        .orderBy(subjects.semester);

      return result.map(r => r.semester).filter((s): s is number => s !== null);
    }),

  /**
   * Obter todas as notas do aluno (para cálculo de estatísticas)
   */
  getAllMyGrades: protectedProcedure
    .input(z.object({ enrollmentId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados indisponível",
        });
      }

      // Verifica se a matrícula pertence ao aluno
      const enrollment = await db
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.id, input.enrollmentId), eq(enrollments.userId, ctx.user.id)))
        .limit(1);

      if (enrollment.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado a esta matrícula",
        });
      }

      // Busca todas as notas do aluno em todos os semestres
      const allGrades = await db
        .select({
          id: grades.id,
          subjectId: subjects.id,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          semester: grades.semester,
          firstBimester: grades.firstBimester,
          secondBimester: grades.secondBimester,
          thirdBimester: grades.thirdBimester,
          fourthBimester: grades.fourthBimester,
          finalExam: grades.finalExam,
          finalGrade: grades.finalGrade,
          status: grades.status,
        })
        .from(subjects)
        .leftJoin(grades, and(
          eq(subjects.id, grades.subjectId),
          eq(grades.enrollmentId, input.enrollmentId)
        ))
        .where(eq(subjects.courseId, enrollment[0].courseId))
        .orderBy(grades.semester);

      return allGrades;
    }),
});
