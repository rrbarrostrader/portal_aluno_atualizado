import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { payments, enrollments, users, financialSettings } from "../../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const paymentsRouter = router({
  // Listar todos os pagamentos (Admin)
  listAll: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    try {
      // Query ultra-compatível com Windows/Postgres
      const result = await db.execute(sql`
        SELECT 
          p.id as id, 
          u.name as username, 
          u.email as useremail,
          p.description as title, 
          p.amount as amount, 
          p.interestamount as interestamount,
          p.penaltyamount as penaltyamount, 
          p.duedate as duedate, 
          p.status as status, 
          p.paymentmethod as paymentmethod
        FROM payments p
        INNER JOIN users u ON p.userid = u.id
        ORDER BY p.duedate DESC
      `);

      const rows = Array.isArray(result) ? result : (result.rows || []);

      return rows.map((row: any) => ({
        id: row.id,
        userName: row.username || row.userName,
        userEmail: row.useremail || row.userEmail,
        title: row.title,
        amount: Number(row.amount || 0),
        interestAmount: Number(row.interestamount || row.interestAmount || 0),
        penaltyAmount: Number(row.penaltyamount || row.penaltyAmount || 0),
        totalAmount: Number(row.amount || 0) + Number(row.interestamount || 0) + Number(row.penaltyamount || 0),
        dueDate: row.duedate || row.dueDate,
        status: row.status,
        paymentMethod: row.paymentmethod || row.paymentMethod
      }));
    } catch (error) {
      console.error("Erro Crítico no Financeiro:", error);
      return [];
    }
  }),

  // Buscar pagamentos do próprio aluno (Portal do Estudante)
  getMyPayments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    try {
      const res = await db.execute(sql`
        SELECT 
          id, description as title, amount, interestamount as interestamount, 
          penaltyamount as penaltyamount, duedate as duedate, 
          status, paymentmethod as paymentmethod
        FROM payments 
        WHERE userid = ${ctx.user.id} 
        ORDER BY duedate DESC
      `);

      const rows = Array.isArray(res) ? res : (res.rows || []);

      return rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        amount: Number(row.amount || 0),
        interestAmount: Number(row.interestamount || 0),
        penaltyAmount: Number(row.penaltyamount || 0),
        totalAmount: Number(row.amount || 0) + Number(row.interestamount || 0) + Number(row.penaltyamount || 0),
        dueDate: row.duedate || row.dueDate,
        status: row.status,
        paymentMethod: row.paymentmethod || row.paymentMethod
      }));
    } catch (error) {
      return [];
    }
  }),

  // Criar novo lançamento
  create: protectedProcedure
    .input(z.object({
      userId: z.number(),
      amount: z.any(),
      dueDate: z.string(),
      description: z.string().optional(),
      title: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      
      const enrollment = await db.select().from(enrollments).where(eq(enrollments.userId, input.userId)).limit(1);
      if (enrollment.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Aluno sem matrícula." });
      
      const finalAmount = Number(input.amount).toString();
      const finalDescription = input.title || input.description || "Mensalidade";
      
      await db.execute(sql`
        INSERT INTO payments (userid, enrollmentid, amount, duedate, description, status, interestamount, penaltyamount, createdat, updatedat)
        VALUES (${input.userId}, ${enrollment[0].id}, ${finalAmount}, ${input.dueDate}, ${finalDescription}, 'pending', 0, 0, NOW(), NOW())
      `);
      return { success: true };
    }),

  getSettings: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { dailyInterestRate: 0.0003, fixedPenaltyRate: 0.02, gracePeriodDays: 0 };
    const settings = await db.select().from(financialSettings).limit(1);
    return settings[0] || { dailyInterestRate: 0.0003, fixedPenaltyRate: 0.02, gracePeriodDays: 0 };
  }),

  updateSettings: protectedProcedure
    .input(z.object({ dailyInterestRate: z.number(), fixedPenaltyRate: z.number(), gracePeriodDays: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      await db.update(financialSettings).set({
        dailyInterestRate: input.dailyInterestRate.toString(),
        fixedPenaltyRate: input.fixedPenaltyRate.toString(),
        gracePeriodDays: input.gracePeriodDays,
        updatedAt: new Date()
      });
      return { success: true };
    }),
});
