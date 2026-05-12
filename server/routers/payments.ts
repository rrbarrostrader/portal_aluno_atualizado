import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { payments, users, financialSettings } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

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

/**
 * Função utilitária para calcular juros e multa
 */
function calculateOverdueAmounts(amount: number, dueDate: string, settings: { dailyInterestRate: string, fixedPenaltyRate: string, gracePeriodDays: number }) {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  // Se hoje for antes ou IGUAL ao vencimento, não há juros
  if (today <= due) return { interest: 0, penalty: 0, total: amount };

  const diffTime = Math.abs(today.getTime() - due.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= settings.gracePeriodDays) return { interest: 0, penalty: 0, total: amount };

  const interestRate = parseFloat(settings.dailyInterestRate) / 100;
  const penaltyRate = parseFloat(settings.fixedPenaltyRate) / 100;

  const penalty = amount * penaltyRate;
  const interest = amount * interestRate * diffDays;
  
  return {
    interest: parseFloat(interest.toFixed(2)),
    penalty: parseFloat(penalty.toFixed(2)),
    total: parseFloat((amount + interest + penalty).toFixed(2))
  };
}

export const paymentsRouter = router({
  /**
   * Listar todos os pagamentos com cálculo de juros em tempo real (Admin)
   */
  listAll: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });

    const settings = await db.select().from(financialSettings).limit(1);
    const config = settings[0] || { dailyInterestRate: "0", fixedPenaltyRate: "0", gracePeriodDays: 0 };

    const rawPayments = await db
      .select({
        id: payments.id,
        userName: users.name,
        userEmail: users.email,
        title: payments.title,
        amount: payments.amount,
        interestAmount: payments.interestAmount,
        penaltyAmount: payments.penaltyAmount,
        totalAmount: payments.totalAmount,
        dueDate: payments.dueDate,
        status: payments.status,
        paymentDate: payments.paymentDate,
      })
      .from(payments)
      .innerJoin(users, eq(payments.userId, users.id))
      .orderBy(desc(payments.dueDate));

    // Atualiza os valores em tempo real para os pendentes/vencidos
    return rawPayments.map(p => {
      if (p.status === 'paid' || p.status === 'cancelled') return p;
      
      const overdue = calculateOverdueAmounts(parseFloat(p.amount.toString()), p.dueDate, config);
      return {
        ...p,
        interestAmount: overdue.interest.toString(),
        penaltyAmount: overdue.penalty.toString(),
        totalAmount: overdue.total.toString(),
        isOverdue: overdue.total > parseFloat(p.amount.toString())
      };
    });
  }),

  /**
   * Criar novo pagamento (Admin)
   */
  create: adminProcedure
    .input(z.object({
      userId: z.number(),
      enrollmentId: z.number().optional(),
      title: z.string(),
      amount: z.string(),
      dueDate: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });

      const result = await db.insert(payments).values({
        userId: input.userId,
        enrollmentId: input.enrollmentId,
        title: input.title,
        amount: input.amount,
        totalAmount: input.amount, // Inicialmente igual ao original
        dueDate: input.dueDate,
        status: "pending",
      }).returning();

      return result[0];
    }),

  /**
   * Configurações Financeiras (Admin)
   */
  getSettings: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });
    const result = await db.select().from(financialSettings).limit(1);
    return result[0] || { dailyInterestRate: "0.00", fixedPenaltyRate: "0.00", gracePeriodDays: 0 };
  }),

  updateSettings: adminProcedure
    .input(z.object({
      dailyInterestRate: z.string(),
      fixedPenaltyRate: z.string(),
      gracePeriodDays: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });

      const existing = await db.select().from(financialSettings).limit(1);
      
      if (existing.length > 0) {
        return await db.update(financialSettings).set(input).where(eq(financialSettings.id, existing[0].id)).returning();
      } else {
        return await db.insert(financialSettings).values(input).returning();
      }
    }),

  /**
   * Listar pagamentos do aluno (Aluno)
   */
  getMyPayments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });

    const settings = await db.select().from(financialSettings).limit(1);
    const config = settings[0] || { dailyInterestRate: "0", fixedPenaltyRate: "0", gracePeriodDays: 0 };

    const rawPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, ctx.user.id))
      .orderBy(desc(payments.dueDate));

    return rawPayments.map(p => {
      if (p.status === 'paid' || p.status === 'cancelled') return p;
      
      const overdue = calculateOverdueAmounts(parseFloat(p.amount.toString()), p.dueDate, config);
      const isOverdue = new Date(p.dueDate) < new Date();

      return {
        ...p,
        interestAmount: overdue.interest.toString(),
        penaltyAmount: overdue.penalty.toString(),
        totalAmount: overdue.total.toString(),
        statusDetail: isOverdue ? "Vencido" : "A Vencer"
      };
    });
  }),

  markAsPaid: adminProcedure
    .input(z.object({
      paymentId: z.number(),
      method: z.enum(["pix", "credit_card", "bank_slip", "cash"]),
      finalAmount: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });

      const result = await db
        .update(payments)
        .set({
          status: "paid",
          paymentMethod: input.method,
          paymentDate: new Date(),
          totalAmount: input.finalAmount, // Salva o valor final pago com juros
        })
        .where(eq(payments.id, input.paymentId))
        .returning();

      return result[0];
    }),
});
