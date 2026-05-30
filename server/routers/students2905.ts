import { z } from "zod";
import { count } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users, enrollments, courses, grades, subjects } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const createStudentSchema = z.object({
  email: z.string().email(),
  name: z.string().min(3),
  role: z.enum(["user", "admin", "teacher"]),
  courseId: z.number().int().positive().optional(),
  registrationNumber: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

const updateStudentSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(3).optional(),
  email: z.string().email().optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  role: z.enum(["user", "admin", "teacher"]).optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

const deleteStudentSchema = z.object({
  id: z.number().int().positive(),
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
    if (!db) return [];
    return await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
        cpf: users.cpf,
        rg: users.rg,
        birthDate: users.birthDate,
        address: users.address,
        phone: users.phone,
        firstLoginCompleted: users.firstLoginCompleted,
        createdAt: users.createdAt,
        registrationNumber: enrollments.registrationNumber,
        enrollmentId: enrollments.id,
        courseId: enrollments.courseId,
        courseName: courses.name,
        courseType: courses.type,
      })
      .from(users)
      .leftJoin(enrollments, eq(users.id, enrollments.userId))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .orderBy(users.name);
  }),

  /**
   * Obter matrículas do aluno logado (Aluno)
   */
  getMyEnrollments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return await db
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
  }),

  /**
   * Obter notas do aluno logado por matrícula e semestre (Aluno)
   */
  getMyGrades: protectedProcedure
    .input(z.object({ enrollmentId: z.number().int().positive(), semester: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const enrollment = await db
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.id, input.enrollmentId), eq(enrollments.userId, ctx.user.id)))
        .limit(1);

      if (enrollment.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      // Busca TODAS as disciplinas do semestre
      const allSubjects = await db
        .select()
        .from(subjects)
        .where(and(
          eq(subjects.courseId, enrollment[0].courseId),
          eq(subjects.semester, input.semester)
        ))
        .orderBy(subjects.id);

      // Busca as notas e mapeia com os nomes de colunas do banco
      const studentGrades = await Promise.all(
        allSubjects.map(async (subject) => {
          const gradeRecord = await db
            .select()
            .from(grades)
            .where(and(
              eq(grades.enrollmentId, input.enrollmentId),
              eq(grades.subjectId, subject.id),
              eq(grades.semester, input.semester)
            ))
            .limit(1);

          return {
            subjectId: subject.id,
            subjectName: subject.name,
            subjectCode: subject.code,
            // CORREÇÃO: Usando a nomenclatura que o Drizzle/Postgres entrega no frontend
            firstBimester: gradeRecord[0]?.firstBimester || null,
            secondBimester: gradeRecord[0]?.secondBimester || null,
            thirdBimester: gradeRecord[0]?.thirdBimester || null,
            fourthBimester: gradeRecord[0]?.fourthBimester || null,
            status: gradeRecord[0]?.status || "pending",
          };
        })
      );

      return studentGrades;
    }),

  /**
   * Obter todas as notas do aluno (para cálculo de estatísticas)
   */
  getAllMyGrades: protectedProcedure
    .input(z.object({ enrollmentId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const enrollment = await db
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.id, input.enrollmentId), eq(enrollments.userId, ctx.user.id)))
        .limit(1);

      if (enrollment.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      return await db
        .select({
          id: grades.id,
          subjectId: subjects.id,
          subjectName: subjects.name,
          semester: grades.semester,
          firstBimester: grades.firstBimester,
          secondBimester: grades.secondBimester,
          thirdBimester: grades.thirdBimester,
          fourthBimester: grades.fourthBimester,
          status: grades.status,
        })
        .from(subjects)
        .innerJoin(grades, and(
          eq(subjects.id, grades.subjectId),
          eq(grades.enrollmentId, input.enrollmentId)
        ))
        .where(eq(subjects.courseId, enrollment[0].courseId))
        .orderBy(grades.semester);
    }),
});
