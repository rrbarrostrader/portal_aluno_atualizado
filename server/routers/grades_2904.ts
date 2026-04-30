import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { grades, attendance, enrollments, subjects } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const recordGradeSchema = z.object({
  enrollmentId: z.number().int().positive(),
  subjectId: z.number().int().positive(),
  semester: z.number().int().positive(),
  firstBimester: z.number().min(0).max(10).optional(),
  secondBimester: z.number().min(0).max(10).optional(),
  thirdBimester: z.number().min(0).max(10).optional(),
  fourthBimester: z.number().min(0).max(10).optional(),
  semesterGrade: z.number().min(0).max(10).optional(),
  finalExam: z.number().min(0).max(10).optional(),
  finalGrade: z.number().min(0).max(10).optional(),
});

const recordAttendanceSchema = z.object({
  enrollmentId: z.number().int().positive(),
  subjectId: z.number().int().positive(),
  semester: z.number().int().positive(),
  totalClasses: z.number().int().positive(),
  attendedClasses: z.number().int().nonnegative(),
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

export const gradesRouter = router({
  /**
   * Obter notas de um aluno
   */
  getStudentGrades: protectedProcedure
    .input(z.object({ enrollmentId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados indisponível",
        });
      }

      // Verifica se o aluno tem permissão para ver estas notas
      if (ctx.user?.role === "user") {
        const enrollment = await db
          .select()
          .from(enrollments)
          .where(eq(enrollments.id, input.enrollmentId))
          .limit(1);

        if (enrollment.length === 0 || enrollment[0].userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Você não tem permissão para acessar estas notas",
          });
        }
      }

      const studentGrades = await db
        .select({
          id: grades.id,
          subjectId: grades.subjectId,
          subjectName: subjects.name,
          semester: grades.semester,
          firstBimester: grades.firstBimester,
          secondBimester: grades.secondBimester,
          thirdBimester: grades.thirdBimester,
          fourthBimester: grades.fourthBimester,
          semesterGrade: grades.semesterGrade,
          finalExam: grades.finalExam,
          finalGrade: grades.finalGrade,
          status: grades.status,
        })
        .from(grades)
        .innerJoin(subjects, eq(grades.subjectId, subjects.id))
        .where(eq(grades.enrollmentId, input.enrollmentId));

      return studentGrades;
    }),

  /**
   * Registrar notas (admin)
   */
  recordGrade: adminProcedure.input(recordGradeSchema).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível",
      });
    }

    try {
      // Verifica se já existe registro de notas
      const existingGrade = await db
        .select()
        .from(grades)
        .where(
          and(
            eq(grades.enrollmentId, input.enrollmentId),
            eq(grades.subjectId, input.subjectId),
            eq(grades.semester, input.semester)
          )
        )
        .limit(1);

      // Calcula a média final se todos os bimestres estão preenchidos
      let finalGrade = input.finalGrade;
      if (
        input.firstBimester !== undefined &&
        input.secondBimester !== undefined &&
        input.thirdBimester !== undefined &&
        input.fourthBimester !== undefined &&
        !finalGrade
      ) {
        finalGrade = (input.firstBimester + input.secondBimester + input.thirdBimester + input.fourthBimester) / 4;
      }

      const gradeData = {
        enrollmentId: input.enrollmentId,
        subjectId: input.subjectId,
        semester: input.semester,
        firstBimester: input.firstBimester ? input.firstBimester.toString() : undefined,
        secondBimester: input.secondBimester ? input.secondBimester.toString() : undefined,
        thirdBimester: input.thirdBimester ? input.thirdBimester.toString() : undefined,
        fourthBimester: input.fourthBimester ? input.fourthBimester.toString() : undefined,
        semesterGrade: input.semesterGrade ? input.semesterGrade.toString() : undefined,
        finalExam: input.finalExam ? input.finalExam.toString() : undefined,
        finalGrade: finalGrade ? finalGrade.toString() : undefined,
        status: finalGrade && finalGrade >= 6 ? ("approved" as const) : ("pending" as const),
        recordedBy: ctx.user.id,
      };

      if (existingGrade.length > 0) {
        // Atualiza o registro existente
        await db
          .update(grades)
          .set(gradeData)
          .where(eq(grades.id, existingGrade[0].id));
      } else {
        // Cria um novo registro
        await db.insert(grades).values([gradeData]);
      }

      return {
        success: true,
        message: "Notas registradas com sucesso",
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao registrar notas",
      });
    }
  }),

  /**
   * Obter frequência de um aluno
   */
  getStudentAttendance: protectedProcedure
    .input(z.object({ enrollmentId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados indisponível",
        });
      }

      // Verifica se o aluno tem permissão
      if (ctx.user?.role === "user") {
        const enrollment = await db
          .select()
          .from(enrollments)
          .where(eq(enrollments.id, input.enrollmentId))
          .limit(1);

        if (enrollment.length === 0 || enrollment[0].userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Você não tem permissão para acessar esta frequência",
          });
        }
      }

      const studentAttendance = await db
        .select({
          id: attendance.id,
          subjectId: attendance.subjectId,
          subjectName: subjects.name,
          semester: attendance.semester,
          totalClasses: attendance.totalClasses,
          attendedClasses: attendance.attendedClasses,
          attendancePercentage: attendance.attendancePercentage,
          status: attendance.status,
        })
        .from(attendance)
        .innerJoin(subjects, eq(attendance.subjectId, subjects.id))
        .where(eq(attendance.enrollmentId, input.enrollmentId));

      return studentAttendance;
    }),

  /**
   * Registrar frequência (admin)
   */
  recordAttendance: adminProcedure.input(recordAttendanceSchema).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível",
      });
    }

    try {
      if (input.attendedClasses > input.totalClasses) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Aulas presentes não pode ser maior que total de aulas",
        });
      }

      const attendancePercentage = (input.attendedClasses / input.totalClasses) * 100;
      let status: "good" | "warning" | "critical" = "good";

      if (attendancePercentage < 75) {
        status = "critical";
      } else if (attendancePercentage < 85) {
        status = "warning";
      }

      const existingAttendance = await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.enrollmentId, input.enrollmentId),
            eq(attendance.subjectId, input.subjectId),
            eq(attendance.semester, input.semester)
          )
        )
        .limit(1);

      const attendanceData = {
        enrollmentId: input.enrollmentId,
        subjectId: input.subjectId,
        semester: input.semester,
        totalClasses: input.totalClasses,
        attendedClasses: input.attendedClasses,
        attendancePercentage: attendancePercentage.toString(),
        status,
        recordedBy: ctx.user.id,
      };

      if (existingAttendance.length > 0) {
        await db
          .update(attendance)
          .set(attendanceData)
          .where(eq(attendance.id, existingAttendance[0].id));
      } else {
        await db.insert(attendance).values([attendanceData]);
      }

      return {
        success: true,
        message: "Frequência registrada com sucesso",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao registrar frequência",
      });
    }
  }),
});
