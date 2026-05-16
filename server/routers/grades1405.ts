import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { grades } from "../../drizzle/schema";
import { sql, eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const gradesRouter = router({
  getBatchGrades: publicProcedure
    .input(z.object({
      subjectId: z.number(),
      enrollmentIds: z.array(z.number())
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db || input.enrollmentIds.length === 0) return [];
      return await db.select().from(grades).where(
        and(
          eq(grades.subjectId, input.subjectId),
          sql`${grades.enrollmentId} IN ${input.enrollmentIds}`
        )
      );
    }),

  recordGrade: publicProcedure
    .input(z.object({
      enrollmentId: z.number(),
      subjectId: z.number(),
      semester: z.number(), // Validação rigorosa de número
      firstBimester: z.number().nullable(),
      secondBimester: z.number().nullable(),
      thirdBimester: z.number().nullable(),
      fourthBimester: z.number().nullable(),
      finalGrade: z.number().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      const query = sql`
        INSERT INTO grades (
          enrollment_id, subject_id, semester, 
          first_bimester, second_bimester, third_bimester, fourth_bimester, final_grade,
          updated_at
        ) 
        VALUES (
          ${input.enrollmentId}, ${input.subjectId}, ${input.semester},
          ${input.firstBimester}, ${input.secondBimester}, ${input.thirdBimester}, ${input.fourthBimester}, ${input.finalGrade},
          NOW()
        )
        ON CONFLICT (enrollment_id, subject_id, semester) 
        DO UPDATE SET 
          first_bimester = EXCLUDED.first_bimester,
          second_bimester = EXCLUDED.second_bimester,
          third_bimester = EXCLUDED.third_bimester,
          fourth_bimester = EXCLUDED.fourth_bimester,
          final_grade = EXCLUDED.final_grade,
          updated_at = NOW()
      `;

      try {
        return await db.execute(query);
      } catch (e) {
        console.error("ERRO CRÍTICO NO BANCO:", e);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Falha ao gravar no banco. Verifique se o semestre está cadastrado na disciplina." 
        });
      }
    }),
});