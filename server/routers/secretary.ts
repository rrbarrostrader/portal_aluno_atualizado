import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { enrollments, courses, users, grades, subjects } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const secretaryRouter = router({
  getDeclarationData: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.user.id;
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });

    const result = await db.execute(sql`
      SELECT 
        u.name as studentname,
        e.registrationnumber as registrationnumber,
        c.name as coursename,
        e.currentsemester as currentsemester,
        e.status as status
      FROM enrollments e
      INNER JOIN users u ON e.userid = u.id
      INNER JOIN courses c ON e.courseid = c.id
      WHERE e.userid = ${studentId}
      LIMIT 1
    `);

    if (!result || result.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Matrícula não encontrada." });
    }

    const data = result[0] as any;
    const now = new Date();
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const dataExtenso = `${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}`;
    const anoAtual = now.getFullYear();
    const semestreAtual = now.getMonth() < 6 ? 1 : 2;

    return {
      nome_aluno: data.studentname || "N/A",
      situacao_matricula: data.status === 'active' ? 'REGULARMENTE MATRICULADO(A)' : 'COM MATRÍCULA TRANCADA',
      periodo_letivo: `${anoAtual}.${semestreAtual}`,
      registro_academico: data.registrationnumber || "N/A",
      serie_periodo: data.currentsemester,
      nome_do_curso: data.coursename,
      turno_aluno: "Noturno",
      data_fim_periodo: semestreAtual === 1 ? `30/06/${anoAtual}` : `31/12/${anoAtual}`,
      data_emissao_extenso: dataExtenso,
    };
  }),

  getTranscriptData: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.user.id;
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });

    const enrollmentRes = await db.execute(sql`
      SELECT id, registrationnumber FROM enrollments WHERE userid = ${studentId} LIMIT 1
    `);

    if (!enrollmentRes || enrollmentRes.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Matrícula não encontrada" });
    }

    const enrollment = enrollmentRes[0] as any;

    // REMOVIDO finalgrade pois a coluna não existe no banco de dados do usuário
    const allGrades = await db.execute(sql`
      SELECT 
        s.name as subjectname,
        g.semester as semester,
        g.firstbimester as firstbimester,
        g.secondbimester as secondbimester,
        g.thirdbimester as thirdbimester,
        g.fourthbimester as fourthbimester,
        g.status as status
      FROM grades g
      INNER JOIN subjects s ON g.subjectid = s.id
      WHERE g.enrollmentid = ${enrollment.id}
      ORDER BY g.semester ASC, s.name ASC
    `);

    return {
      studentName: ctx.user.name,
      registrationNumber: enrollment.registrationnumber,
      grades: allGrades as any[],
    };
  }),

  getProgramContentData: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.user.id;
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });

    const enrollmentRes = await db.execute(sql`
      SELECT courseid FROM enrollments WHERE userid = ${studentId} LIMIT 1
    `);

    if (!enrollmentRes || enrollmentRes.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Matrícula não encontrada" });
    }

    const courseId = (enrollmentRes[0] as any).courseid;

    const courseRes = await db.execute(sql`SELECT name FROM courses WHERE id = ${courseId} LIMIT 1`);
    const courseName = courseRes.length > 0 ? (courseRes[0] as any).name : "Curso";

    const subjectsList = await db.execute(sql`
      SELECT name, description, workload 
      FROM subjects 
      WHERE courseid = ${courseId}
      ORDER BY semester ASC, name ASC
    `);

    return {
      courseName: courseName,
      subjects: subjectsList as any[],
    };
  }),
});
