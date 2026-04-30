import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { announcements } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

const createAnnouncementSchema = z.object({
  title: z.string().min(5).max(255),
  content: z.string().min(10),
  type: z.enum(["general", "academic", "financial", "administrative"]).optional(),
  targetRole: z.enum(["all", "students", "admins"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  published: z.boolean().optional(),
});

const updateAnnouncementSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(5).max(255).optional(),
  content: z.string().min(10).optional(),
  type: z.enum(["general", "academic", "financial", "administrative"]).optional(),
  targetRole: z.enum(["all", "students", "admins"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  published: z.boolean().optional(),
});

const deleteAnnouncementSchema = z.object({
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

export const announcementsRouter = router({
  /**
   * Listar todos os avisos publicados (Público)
   */
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível",
      });
    }

    return await db
      .select()
      .from(announcements)
      .where(eq(announcements.published, true))
      .orderBy(desc(announcements.publishedAt));
  }),

  /**
   * Listar avisos por tipo (Público)
   */
  listByType: publicProcedure
    .input(z.object({ type: z.enum(["general", "academic", "financial", "administrative"]) }))
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
        .from(announcements)
        .where(and(eq(announcements.published, true), eq(announcements.type, input.type)))
        .orderBy(desc(announcements.publishedAt));
    }),

  /**
   * Listar avisos por prioridade (Público)
   */
  listByPriority: publicProcedure
    .input(z.object({ priority: z.enum(["low", "medium", "high"]) }))
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
        .from(announcements)
        .where(and(eq(announcements.published, true), eq(announcements.priority, input.priority)))
        .orderBy(desc(announcements.publishedAt));
    }),

  /**
   * Obter detalhes de um aviso (Público)
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

      const announcement = await db
        .select()
        .from(announcements)
        .where(eq(announcements.id, input.id))
        .limit(1);

      if (announcement.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aviso não encontrado",
        });
      }

      return announcement[0];
    }),

  /**
   * Listar todos os avisos (Admin - incluindo não publicados)
   */
  listAll: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível",
      });
    }

    return await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt));
  }),

  /**
   * Criar novo aviso (Admin)
   */
  create: adminProcedure
    .input(createAnnouncementSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados indisponível",
        });
      }

      try {
        const result = await db
          .insert(announcements)
          .values({
            title: input.title,
            content: input.content,
            type: input.type || "general",
            targetRole: input.targetRole || "all",
            priority: input.priority || "medium",
            published: input.published || false,
            publishedAt: input.published ? new Date() : null,
            createdBy: ctx.user.id,
          })
          .returning({ insertedId: announcements.id });

        return {
          id: result[0].insertedId,
          message: "Aviso criado com sucesso!",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao criar aviso",
        });
      }
    }),

  /**
   * Atualizar aviso (Admin)
   */
  update: adminProcedure
    .input(updateAnnouncementSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados indisponível",
        });
      }

      try {
        const existingAnnouncement = await db
          .select()
          .from(announcements)
          .where(eq(announcements.id, input.id))
          .limit(1);

        if (existingAnnouncement.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Aviso não encontrado",
          });
        }

        const updateData: any = {};
        if (input.title !== undefined) updateData.title = input.title;
        if (input.content !== undefined) updateData.content = input.content;
        if (input.type !== undefined) updateData.type = input.type;
        if (input.targetRole !== undefined) updateData.targetRole = input.targetRole;
        if (input.priority !== undefined) updateData.priority = input.priority;
        if (input.published !== undefined) {
          updateData.published = input.published;
          if (input.published && !existingAnnouncement[0].publishedAt) {
            updateData.publishedAt = new Date();
          }
        }
        updateData.updatedAt = new Date();

        await db
          .update(announcements)
          .set(updateData)
          .where(eq(announcements.id, input.id));

        return { message: "Aviso atualizado com sucesso!" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao atualizar aviso",
        });
      }
    }),

  /**
   * Deletar aviso (Admin)
   */
  delete: adminProcedure
    .input(deleteAnnouncementSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados indisponível",
        });
      }

      try {
        const existingAnnouncement = await db
          .select()
          .from(announcements)
          .where(eq(announcements.id, input.id))
          .limit(1);

        if (existingAnnouncement.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Aviso não encontrado",
          });
        }

        await db.delete(announcements).where(eq(announcements.id, input.id));

        return { message: "Aviso deletado com sucesso!" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao deletar aviso",
        });
      }
    }),

  /**
   * Publicar/Despublicar aviso (Admin)
   */
  togglePublish: adminProcedure
    .input(z.object({ id: z.number().int().positive(), published: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados indisponível",
        });
      }

      try {
        await db
          .update(announcements)
          .set({
            published: input.published,
            publishedAt: input.published ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(eq(announcements.id, input.id));

        return { message: input.published ? "Aviso publicado!" : "Aviso despublicado!" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao publicar/despublicar aviso",
        });
      }
    }),
});
