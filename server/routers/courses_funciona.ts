import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { courses, subjects } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const createCourseSchema = z.object({
  name: z.string().min(3),
  code: z.string().min(2),
  description: z.string().optional(),
  type: z.enum(["graduation", "postgraduate", "technical"]),
  duration: z.number().int().positive().optional(),
});

const createSubjectSchema = z.object({
  name: z.string().min(3),
  code: z.string().min(2),
  courseId: z.number().int().positive(),
  description: z.string().optional(),
  credits: z.number().int().positive().optional(),
  workload: z.number().int().positive().optional(),
  semester: z.number().int().positive().optional(),
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

export const coursesRouter = router({
  /**
   * Listar todos os cursos
   */
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível",
      });
    }

    return await db.select().from(courses).where(eq(courses.status, "active"));
  }),

  /**
   * Obter detalhes de um curso
   */
  getById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados indisponível",
        });
      }

      const course = await db
        .select()
        .from(courses)
        .where(eq(courses.id, input.id))
        .limit(1);

      if (course.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Curso não encontrado",
        });
      }

      // Obter disciplinas do curso
      const courseSubjects = await db
        .select()
        .from(subjects)
        .where(and(eq(subjects.courseId, input.id), eq(subjects.status, "active")));

      return {
        ...course[0],
        subjects: courseSubjects,
      };
    }),

  /**
   * Criar novo curso (admin)
   */
  create: adminProcedure.input(createCourseSchema).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível",
      });
    }

    try {
      // Verifica se o código já existe
      const existingCourse = await db
        .select()
        .from(courses)
        .where(eq(courses.code, input.code))
        .limit(1);

      if (existingCourse.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Código do curso já existe",
        });
      }

      await db.insert(courses).values({
        name: input.name,
        code: input.code,
        description: input.description,
        type: input.type,
        duration: input.duration,
        status: "active",
      });

      return {
        success: true,
        message: "Curso criado com sucesso",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao criar curso",
      });
    }
  }),

  /**
   * Listar disciplinas de um curso
   */
  listSubjects: publicProcedure
    .input(z.object({ courseId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados indisponível",
        });
      }

      return await db
        .select()
        .from(subjects)
        .where(and(eq(subjects.courseId, input.courseId), eq(subjects.status, "active")));
    }),

  /**
   * Criar nova disciplina (admin)
   */
  createSubject: adminProcedure.input(createSubjectSchema).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível",
      });
    }

    try {
      // Verifica se o curso existe
      const course = await db
        .select()
        .from(courses)
        .where(eq(courses.id, input.courseId))
        .limit(1);

      if (course.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Curso não encontrado",
        });
      }

      await db.insert(subjects).values({
        name: input.name,
        code: input.code,
        courseId: input.courseId,
        description: input.description,
        credits: input.credits,
        workload: input.workload,
        semester: input.semester,
        status: "active",
      });

      return {
        success: true,
        message: "Disciplina criada com sucesso",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao criar disciplina",
      });
    }
  }),
});
