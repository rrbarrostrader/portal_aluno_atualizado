import { z } from "zod";
import { publicProcedure, router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { announcements } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

const createAnnouncementSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres").max(255),
  content: z.string().min(3, "O conteúdo deve ter pelo menos 3 caracteres"),
  type: z.enum(["general", "academic", "financial", "administrative"]).optional(),
  targetRole: z.enum(["all", "students", "admins"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  published: z.boolean().optional(),
});

const updateAnnouncementSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(3).max(255).optional(),
  content: z.string().min(3).optional(),
  type: z.enum(["general", "academic", "financial", "administrative"]).optional(),
  targetRole: z.enum(["all", "students", "admins"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  published: z.boolean().optional(),
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
   * Listar todos os avisos publicados (Para o Estudante)
   */
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });

    try {
      return await db.select().from(announcements)
        .where(eq(announcements.published, true))
        .orderBy(desc(announcements.publishedAt));
    } catch (error) {
      console.error("Erro ao listar avisos:", error);
      return [];
    }
  }),

  /**
   * Listar todos os avisos (Para o Admin)
   */
  listAll: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });

    try {
      return await db.select().from(announcements).orderBy(desc(announcements.id));
    } catch (error) {
      console.error("Erro ao listar todos os avisos:", error);
      return [];
    }
  }),

  /**
   * Criar novo aviso (Admin)
   */
  create: adminProcedure
    .input(createAnnouncementSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });

      try {
        const [inserted] = await db.insert(announcements).values({
          title: input.title,
          content: input.content,
          type: input.type || 'general',
          targetRole: input.targetRole || 'all',
          priority: input.priority || 'medium',
          published: input.published || false,
          publishedAt: input.published ? new Date() : null,
          createdBy: ctx.user.id,
        }).returning({ id: announcements.id });

        return { 
          id: inserted?.id || 0, 
          message: "Aviso criado com sucesso!" 
        };
      } catch (error) {
        console.error("Erro na criação do aviso:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao salvar no banco de dados" });
      }
    }),

  /**
   * Atualizar aviso existente (Admin)
   */
  update: adminProcedure
    .input(updateAnnouncementSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });

      const { id, ...data } = input;
      try {
        await db.update(announcements)
          .set({ 
            ...data, 
            updatedAt: new Date(),
            publishedAt: data.published ? new Date() : null 
          })
          .where(eq(announcements.id, id));
        return { message: "Aviso atualizado com sucesso!" };
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao atualizar aviso" });
      }
    }),

  /**
   * Deletar aviso (Admin)
   */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });

      try {
        await db.delete(announcements).where(eq(announcements.id, input.id));
        return { message: "Aviso deletado com sucesso!" };
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao deletar aviso" });
      }
    }),

  /**
   * Publicar/Despublicar aviso rápido (Admin)
   */
  togglePublish: adminProcedure
    .input(z.object({ id: z.number(), published: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });

      try {
        await db.update(announcements)
          .set({ 
            published: input.published, 
            publishedAt: input.published ? new Date() : null,
            updatedAt: new Date() 
          })
          .where(eq(announcements.id, input.id));
        return { message: input.published ? "Aviso publicado!" : "Aviso despublicado!" };
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao alterar status de publicação" });
      }
    }),
});
