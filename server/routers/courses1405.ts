import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { courses, subjects, enrollments, users, grades } from "../../drizzle/schema";
import { eq, and, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const coursesRouter = router({
  // LISTAR CURSOS: Essencial para que apareçam na tela após criar
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
    return await db.select().from(courses).where(eq(courses.status, "active")).orderBy(asc(courses.name));
  }),

  // CRIAR CURSO
  create: publicProcedure
    .input(z.object({ 
      name: z.string().min(3), 
      totalHours: z.number().int().positive() 
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const code = `CRS-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      return await db.insert(courses).values({
        name: input.name,
        totalHours: input.totalHours,
        code,
        status: "active"
      }).returning();
    }),

  // LISTAR DISCIPLINAS: Para listar dentro de cada curso/semestre
  listSubjects: publicProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return await db.select().from(subjects).where(
        and(
          eq(subjects.courseId, input.courseId),
          eq(subjects.status, "active")
        )
      ).orderBy(asc(subjects.semester), asc(subjects.name));
    }),

  // CRIAR DISCIPLINA
  createSubject: publicProcedure
    .input(z.object({
      name: z.string().min(3),
      courseId: z.number(),
      semester: z.number().int().positive(),
      hours: z.number().int().positive(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const code = `SUB-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      return await db.insert(subjects).values({
        name: input.name,
        courseId: input.courseId,
        semester: input.semester,
        hours: input.hours,
        code,
        status: "active"
      }).returning();
    }),

  // DELETAR CURSO: Limpeza completa
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const courseSubjects = await db.select().from(subjects).where(eq(subjects.courseId, input.id));
      for (const subject of courseSubjects) {
        await db.delete(grades).where(eq(grades.subjectId, subject.id));
      }
      await db.delete(subjects).where(eq(subjects.courseId, input.id));
      await db.delete(enrollments).where(eq(enrollments.courseId, input.id));
      await db.delete(courses).where(eq(courses.id, input.id));
      return { success: true };
    }),

  // LISTAR ALUNOS: Para a aba de notas
  listStudentsByCourse: publicProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return await db
        .select({
          id: users.id,
          name: users.name,
          enrollmentId: enrollments.id,
          registrationNumber: enrollments.registrationNumber,
        })
        .from(enrollments)
        .innerJoin(users, eq(enrollments.userId, users.id))
        .where(and(eq(enrollments.courseId, input.courseId), eq(enrollments.status, "active")));
    }),
});