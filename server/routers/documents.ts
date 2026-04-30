import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { enrollments, courses, grades, attendance } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { generateDeclarationPDF, generateReportPDF } from "../services/pdf";
import { sendDeclarationNotification } from "../services/email";

export const documentsRouter = router({
  /**
   * Gerar Declaração de Matrícula em PDF
   */
  generateDeclaration: protectedProcedure
    .input(z.object({ enrollmentId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados indisponível",
        });
      }

      try {
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
              message: "Você não tem permissão para gerar este documento",
            });
          }
        }

        // Obtém dados da matrícula
        const enrollmentData = await db
          .select()
          .from(enrollments)
          .innerJoin(courses, eq(enrollments.courseId, courses.id))
          .where(eq(enrollments.id, input.enrollmentId))
          .limit(1);

        if (enrollmentData.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Matrícula não encontrada",
          });
        }

        const enrollment_data = enrollmentData[0];

        // Obtém dados do aluno
        const { users } = await import("../../drizzle/schema");
        const studentData = await db
          .select()
          .from(users)
          .where(eq(users.id, enrollment_data.enrollments.userId))
          .limit(1);

        if (studentData.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Aluno não encontrado",
          });
        }

        // Gera o PDF
        const pdfBuffer = await generateDeclarationPDF({
          studentName: studentData[0].name || "Aluno",
          registrationNumber: enrollment_data.enrollments.registrationNumber || "N/A",
          courseName: enrollment_data.courses.name,
          enrollmentDate: enrollment_data.enrollments.enrollmentDate,
          currentSemester: enrollment_data.enrollments.currentSemester,
          status: enrollment_data.enrollments.status,
        });

        // Envia notificação por e-mail
        if (studentData[0].email) {
          await sendDeclarationNotification(
            studentData[0].email,
            studentData[0].name || "Aluno",
            enrollment_data.courses.name
          );
        }

        return {
          success: true,
          pdf: pdfBuffer.toString("base64"),
          filename: `declaracao_matricula_${studentData[0].id}.pdf`,
        };


      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao gerar declaração",
        });
      }
    }),

  /**
   * Gerar Relatório Acadêmico em PDF
   */
  generateReport: protectedProcedure
    .input(z.object({ enrollmentId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados indisponível",
        });
      }

      try {
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
              message: "Você não tem permissão para gerar este relatório",
            });
          }
        }

        // Obtém dados da matrícula
        const enrollmentData = await db
          .select({
            id: enrollments.id,
            userId: enrollments.userId,
            currentSemester: enrollments.currentSemester,
            courseName: courses.name,
          })
          .from(enrollments)
          .innerJoin(courses, eq(enrollments.courseId, courses.id))
          .where(eq(enrollments.id, input.enrollmentId))
          .limit(1);

        if (enrollmentData.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Matrícula não encontrada",
          });
        }

        // Obtém dados do aluno
        const { users } = await import("../../drizzle/schema");
        const studentData = await db
          .select()
          .from(users)
          .where(eq(users.id, enrollmentData[0].userId))
          .limit(1);

        if (studentData.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Aluno não encontrado",
          });
        }

        // Obtém notas
        const studentGrades = await db
          .select()
          .from(grades)
          .where(eq(grades.enrollmentId, input.enrollmentId));

        // Obtém frequência
        const studentAttendance = await db
          .select()
          .from(attendance)
          .where(eq(attendance.enrollmentId, input.enrollmentId));

        // Calcula médias
        const averageGrade =
          studentGrades.length > 0
            ? studentGrades.reduce((sum, g) => sum + (parseFloat(g.finalGrade?.toString() || "0") || 0), 0) /
              studentGrades.length
            : 0;

        const generalAttendance =
          studentAttendance.length > 0
            ? studentAttendance.reduce((sum, a) => sum + parseFloat(a.attendancePercentage?.toString() || "0"), 0) /
              studentAttendance.length
            : 0;

        // Gera o PDF
        const pdfBuffer = await generateReportPDF({
          studentName: studentData[0].name || "Aluno",
          courseName: enrollmentData[0].courseName,
          period: `${enrollmentData[0].currentSemester}º Semestre`,
          grades: studentGrades.map((g) => ({
            subjectName: "Disciplina", // Será preenchido com JOIN
            grade: parseFloat(g.finalGrade?.toString() || "0"),
            status: g.status,
          })),
          attendance: studentAttendance.map((a) => ({
            subjectName: "Disciplina", // Será preenchido com JOIN
            percentage: parseFloat(a.attendancePercentage?.toString() || "0"),
            status: a.status,
          })),
          averageGrade,
          generalAttendance,
        });

        return {
          success: true,
          pdf: pdfBuffer.toString("base64"),
          filename: `relatorio_academico_${studentData[0].id}.pdf`,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao gerar relatório",
        });
      }
    }),
});
