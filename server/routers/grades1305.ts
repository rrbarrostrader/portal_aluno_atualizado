import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { grades, enrollments, subjects } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Middleware para verificar se é professor ou admin
const teacherProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== "teacher" && ctx.user?.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acesso restrito a professores e administradores",
    });
  }
  return next({ ctx });
});

export const gradesRouter = router({
  // Registrar ou atualizar nota
  recordGrade: teacherProcedure
    .input(
      z.object({
        enrollmentId: z.number(),
        subjectId: z.number(),
        semester: z.number(),
        firstBimester: z.number().nullable().optional(),
        secondBimester: z.number().nullable().optional(),
        thirdBimester: z.number().nullable().optional(),
        fourthBimester: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Banco de dados indisponível",
          });
        }

        // Validar que enrollmentId existe
        const enrollment = await db
          .select()
          .from(enrollments)
          .where(eq(enrollments.id, input.enrollmentId))
          .limit(1);

        if (enrollment.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Matrícula não encontrada",
          });
        }

        // Validar que subjectId existe
        const subject = await db
          .select()
          .from(subjects)
          .where(eq(subjects.id, input.subjectId))
          .limit(1);

        if (subject.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Disciplina não encontrada",
          });
        }

        // Converter números para strings de decimal (formato esperado pelo PostgreSQL)
        const convertToDecimal = (value: number | null | undefined) => {
          if (value === null || value === undefined) return null;
          return String(value);
        };

        const gradesData = {
          firstBimester: convertToDecimal(input.firstBimester),
          secondBimester: convertToDecimal(input.secondBimester),
          thirdBimester: convertToDecimal(input.thirdBimester),
          fourthBimester: convertToDecimal(input.fourthBimester),
        };

        // Verificar se já existe nota para este aluno, disciplina e semestre
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

        if (existingGrade.length > 0) {
          // Atualizar nota existente - apenas os campos que foram alterados
          const updateData: any = {
            updatedAt: new Date(),
          };

          // Adicionar apenas os campos que têm valores
          if (gradesData.firstBimester !== null) updateData.firstBimester = gradesData.firstBimester;
          if (gradesData.secondBimester !== null) updateData.secondBimester = gradesData.secondBimester;
          if (gradesData.thirdBimester !== null) updateData.thirdBimester = gradesData.thirdBimester;
          if (gradesData.fourthBimester !== null) updateData.fourthBimester = gradesData.fourthBimester;

          const result = await db
            .update(grades)
            .set(updateData)
            .where(eq(grades.id, existingGrade[0].id))
            .returning();

          return {
            success: true,
            message: "Nota atualizada com sucesso",
            data: result[0]
          };
        } else {
          // Inserir nova nota
          const result = await db
            .insert(grades)
            .values({
              enrollmentId: input.enrollmentId,
              subjectId: input.subjectId,
              semester: input.semester,
              firstBimester: gradesData.firstBimester,
              secondBimester: gradesData.secondBimester,
              thirdBimester: gradesData.thirdBimester,
              fourthBimester: gradesData.fourthBimester,
              status: "pending",
              recordedBy: ctx.user.id,
            })
            .returning();

          return {
            success: true,
            message: "Nota registrada com sucesso",
            data: result[0]
          };
        }
      } catch (error: any) {
        console.error("Erro ao registrar nota:", error);
        
        // Se já é um TRPCError, relançar
        if (error.code) {
          throw error;
        }
        
        // Retornar mensagem de erro mais descritiva
        if (error.message?.includes("23505")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe uma nota para este aluno, disciplina e semestre",
          });
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Falha ao registrar nota: ${error.message}`,
        });
      }
    }),

  // Buscar notas por disciplina e semestre
  getGradesBySubjectAndSemester: protectedProcedure
    .input(
      z.object({
        subjectId: z.number(),
        semester: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Banco de dados indisponível",
          });
        }

        const result = await db
          .select()
          .from(grades)
          .where(
            and(
              eq(grades.subjectId, input.subjectId),
              eq(grades.semester, input.semester)
            )
          );

        return result;
      } catch (error: any) {
        console.error("Erro ao buscar notas:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao buscar notas",
        });
      }
    }),

  // Buscar notas do aluno
  getMyGrades: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.number(),
        semester: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Banco de dados indisponível",
          });
        }

        // Se o semestre não for fornecido, buscamos todos para esta matrícula
        const conditions = [eq(grades.enrollmentId, input.enrollmentId)];
        
        if (input.semester) {
          conditions.push(eq(grades.semester, input.semester));
        }

        const result = await db
          .select()
          .from(grades)
          .where(and(...conditions));

        return result;
      } catch (error: any) {
        console.error("Erro ao buscar notas do aluno:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao buscar notas",
        });
      }
    }),

  // Calcular média do aluno
  calculateStudentAverage: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.number(),
        semester: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Banco de dados indisponível",
          });
        }

        const studentGrades = await db
          .select()
          .from(grades)
          .where(
            and(
              eq(grades.enrollmentId, input.enrollmentId),
              eq(grades.semester, input.semester)
            )
          );

        if (studentGrades.length === 0) {
          return { average: 0, totalSubjects: 0 };
        }

        let totalAverage = 0;
        let count = 0;

        for (const grade of studentGrades) {
          const bimesterGrades = [
            grade.firstBimester,
            grade.secondBimester,
            grade.thirdBimester,
            grade.fourthBimester,
          ].filter((g) => g !== null && g !== undefined);

          if (bimesterGrades.length > 0) {
            const avg =
              bimesterGrades.reduce((a, b) => Number(a) + Number(b), 0) /
              bimesterGrades.length;
            totalAverage += avg;
            count++;
          }
        }

        return {
          average: count > 0 ? totalAverage / count : 0,
          totalSubjects: studentGrades.length,
        };
      } catch (error: any) {
        console.error("Erro ao calcular média:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao calcular média",
        });
      }
    }),
});
