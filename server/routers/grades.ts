import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { grades } from "../../drizzle/schema";
import { sql, eq, and, inArray } from "drizzle-orm";
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
          inArray(grades.enrollmentId, input.enrollmentIds)
        )
      );
    }),

  // NOVA QUERY: Busca todas as notas de múltiplos alunos para todas as disciplinas
  getAllCourseGrades: publicProcedure
    .input(z.object({
      enrollmentIds: z.array(z.number())
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db || input.enrollmentIds.length === 0) return [];
      return await db.select().from(grades).where(
        inArray(grades.enrollmentId, input.enrollmentIds)
      );
    }),

  recordGrade: publicProcedure
    .input(z.object({
      enrollmentId: z.number(),
      subjectId: z.number(),
      semester: z.number(),
      firstBimester: z.number().nullable(),
      secondBimester: z.number().nullable(),
      thirdBimester: z.number().nullable(),
      fourthBimester: z.number().nullable(),
      finalGrade: z.number().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      console.log("Executando gravação de nota no banco real:", input);

      const query = sql`
        INSERT INTO grades (
          enrollmentid, subjectid, semester, 
          firstbimester, secondbimester, thirdbimester, fourthbimester,
          updatedat
        ) 
        VALUES (
          ${input.enrollmentId}, ${input.subjectId}, ${input.semester},
          ${input.firstBimester}, ${input.secondBimester}, ${input.thirdBimester}, ${input.fourthBimester},
          NOW()
        )
        ON CONFLICT (enrollmentid, subjectid, semester) 
        DO UPDATE SET 
          firstbimester = EXCLUDED.firstbimester,
          secondbimester = EXCLUDED.secondbimester,
          thirdbimester = EXCLUDED.thirdbimester,
          fourthbimester = EXCLUDED.fourthbimester,
          updatedat = NOW()
      `;

      try {
        const result = await db.execute(query);
        return result;
      } catch (e: any) {
        console.error("ERRO NO BANCO:", e);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: `Erro do Postgres: ${e.message}`
        });
      }
    }),
});
