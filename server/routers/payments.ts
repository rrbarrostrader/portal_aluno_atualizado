import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { db } from "../db";
import { payments, users, enrollments } from "../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const paymentsRouter = router({
  // Listar todos os pagamentos com dados do aluno
  listAll: publicProcedure.query(async () => {
    try {
      // Usando SQL puro para garantir compatibilidade com a tabela manual
      const result = await db.execute(sql`
        SELECT 
          p.id,
          u.name as "userName",
          u.email as "userEmail",
          p.description as "title",
          p.amount,
          p.interestamount as "interestAmount",
          p.penaltyamount as "penaltyAmount",
          (p.amount + p.interestamount + p.penaltyamount) as "totalAmount",
          p.duedate as "dueDate",
          p.status,
          p.paymentmethod as "paymentMethod"
        FROM payments p
        INNER JOIN users u ON p.userid = u.id
        ORDER BY p.duedate DESC
      `);
      return result.rows;
    } catch (error) {
      console.error("Erro ao listar pagamentos:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Falha ao listar pagamentos",
      });
    }
  }),

  // Criar um novo lançamento financeiro
  create: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        amount: z.number(),
        dueDate: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Buscar a matrícula ativa do aluno para vincular ao pagamento
        const enrollment = await db.query.enrollments.findFirst({
          where: eq(enrollments.userId, input.userId),
        });

        if (!enrollment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Aluno não possui matrícula ativa para este lançamento.",
          });
        }

        // Inserção usando SQL puro para evitar erros de parâmetros do ORM
        await db.execute(sql`
          INSERT INTO payments (
            userid, 
            enrollmentid, 
            amount, 
            duedate, 
            description, 
            status,
            interestamount,
            penaltyamount,
            createdat,
            updatedat
          ) VALUES (
            ${input.userId}, 
            ${enrollment.id}, 
            ${input.amount}, 
            ${input.dueDate}, 
            ${input.description}, 
            'pending',
            0,
            0,
            NOW(),
            NOW()
          )
        `);

        return { success: true };
      } catch (error) {
        console.error("Erro ao criar pagamento:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Falha ao registrar lançamento financeiro",
        });
      }
    }),

  // Excluir um lançamento
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(payments).where(eq(payments.id, input.id));
      return { success: true };
    }),
});
