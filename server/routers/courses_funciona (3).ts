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

const updateCourseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

const deleteCourseSchema = z.object({
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

  /**
   * Atualizar curso (admin)
   */
  update: adminProcedure.input(updateCourseSchema).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível",
      });
    }

    try {
      const updateData: Record<string, any> = {};

      if (input.name) updateData.name = input.name;
      if (input.description) updateData.description = input.description;
      if (input.status) updateData.status = input.status;

      if (Object.keys(updateData).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nenhum campo para atualizar",
        });
      }

      await db
        .update(courses)
        .set(updateData)
        .where(eq(courses.id, input.id));

      return {
        success: true,
        message: "Curso atualizado com sucesso",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao atualizar curso",
      });
    }
  }),

  /**
   * Deletar curso (admin)
   */
  delete: adminProcedure.input(deleteCourseSchema).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível",
      });
    }

    try {
      // Verifica se há disciplinas vinculadas
      const linkedSubjects = await db
        .select()
        .from(subjects)
        .where(eq(subjects.courseId, input.id))
        .limit(1);

      if (linkedSubjects.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é possível deletar um curso com disciplinas vinculadas",
        });
      }

      await db
        .delete(courses)
        .where(eq(courses.id, input.id));

      return {
        success: true,
        message: "Curso deletado com sucesso",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao deletar curso",
      });
    }
  }),

  /**
   * Inicializar com todos os 18 cursos padrão
   */
  seedDefaultCourses: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível",
      });
    }

    try {
      const defaultCourses = [
        // Graduação
        { name: "Administração", code: "ADM-001", type: "graduation" as const, description: "Curso de Administração" },
        { name: "Pedagogia", code: "PED-001", type: "graduation" as const, description: "Curso de Pedagogia" },
        { name: "História", code: "HIS-001", type: "graduation" as const, description: "Curso de História" },
        { name: "Matemática", code: "MAT-001", type: "graduation" as const, description: "Curso de Matemática" },
        { name: "Geografia", code: "GEO-001", type: "graduation" as const, description: "Curso de Geografia" },
        { name: "Língua Portuguesa", code: "LPO-001", type: "graduation" as const, description: "Curso de Língua Portuguesa" },
        { name: "Inglês", code: "ING-001", type: "graduation" as const, description: "Curso de Inglês" },
        { name: "Espanhol", code: "ESP-001", type: "graduation" as const, description: "Curso de Espanhol" },
        // Pós-graduação
        { name: "Educação Física", code: "EDF-001", type: "postgraduate" as const, description: "Pós-graduação em Educação Física" },
        { name: "Psicopedagogia", code: "PSI-001", type: "postgraduate" as const, description: "Pós-graduação em Psicopedagogia" },
        { name: "ABA", code: "ABA-001", type: "postgraduate" as const, description: "Pós-graduação em ABA" },
        { name: "AEE", code: "AEE-001", type: "postgraduate" as const, description: "Pós-graduação em AEE" },
        { name: "Educação Infantil", code: "EDI-001", type: "postgraduate" as const, description: "Pós-graduação em Educação Infantil" },
        { name: "Gestão Escolar", code: "GES-001", type: "postgraduate" as const, description: "Pós-graduação em Gestão Escolar" },
        { name: "Nutrição Esportiva", code: "NUT-001", type: "postgraduate" as const, description: "Pós-graduação em Nutrição Esportiva" },
        // Técnicos
        { name: "Enfermagem (Técnico)", code: "ENF-001", type: "technical" as const, description: "Curso Técnico em Enfermagem" },
        { name: "Técnico em Estética", code: "EST-001", type: "technical" as const, description: "Curso Técnico em Estética" },
        { name: "Teologia", code: "TEO-001", type: "technical" as const, description: "Curso de Teologia" },
      ];

      let createdCount = 0;
      let skippedCount = 0;

      for (const courseData of defaultCourses) {
        const existing = await db
          .select()
          .from(courses)
          .where(eq(courses.code, courseData.code))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(courses).values({
            ...courseData,
            status: "active",
          });
          createdCount++;
        } else {
          skippedCount++;
        }
      }

      return {
        success: true,
        message: `Cursos carregados: ${createdCount} criados, ${skippedCount} já existiam`,
        created: createdCount,
        skipped: skippedCount,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao carregar cursos padrão",
      });
    }
  }),
});
