import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users, courses, enrollments, subjects, grades } from "../../drizzle/schema";
import { eq, count } from "drizzle-orm";

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

export const dashboardRouter = router({
  /**
   * Obter estatísticas gerais do sistema
   */
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível",
      });
    }

    try {
      // Contar alunos ativos
      const totalStudents = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.role, "user"));

      // Contar cursos ativos
      const totalCourses = await db
        .select({ count: count() })
        .from(courses)
        .where(eq(courses.status, "active"));

      // Contar disciplinas ativas
      const totalSubjects = await db
        .select({ count: count() })
        .from(subjects)
        .where(eq(subjects.status, "active"));

      // Contar matrículas ativas
      const totalEnrollments = await db
        .select({ count: count() })
        .from(enrollments)
        .where(eq(enrollments.status, "active"));

      // Alunos por curso
      const studentsByCourse = await db
        .select({
          courseId: enrollments.courseId,
          courseName: courses.name,
          courseType: courses.type,
          studentCount: count(enrollments.userId),
        })
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(eq(enrollments.status, "active"))
        .groupBy(enrollments.courseId, courses.name, courses.type);

      // Distribuição por tipo de curso
      const courseDistribution = await db
        .select({
          type: courses.type,
          count: count(courses.id),
        })
        .from(courses)
        .where(eq(courses.status, "active"))
        .groupBy(courses.type);

      return {
        totalStudents: totalStudents[0]?.count || 0,
        totalCourses: totalCourses[0]?.count || 0,
        totalSubjects: totalSubjects[0]?.count || 0,
        totalEnrollments: totalEnrollments[0]?.count || 0,
        studentsByCourse: studentsByCourse || [],
        courseDistribution: courseDistribution || [],
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao buscar estatísticas",
      });
    }
  }),

  /**
   * Obter resumo de alunos por status
   */
  getStudentsSummary: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível",
      });
    }

    try {
      const summary = await db
        .select({
          status: users.status,
          count: count(users.id),
        })
        .from(users)
        .where(eq(users.role, "user"))
        .groupBy(users.status);

      return summary || [];
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao buscar resumo de alunos",
      });
    }
  }),

  /**
   * Obter últimos alunos cadastrados
   */
  getRecentStudents: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível",
      });
    }

    try {
      const recentStudents = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
          status: users.status,
        })
        .from(users)
        .where(eq(users.role, "user"))
        .orderBy(users.createdAt)
        .limit(5);

      return recentStudents || [];
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao buscar alunos recentes",
      });
    }
  }),
});
