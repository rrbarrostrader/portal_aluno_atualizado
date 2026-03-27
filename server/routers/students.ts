import { z } from "zod";
import { count } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users, enrollments, courses, grades, subjects } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { hashPassword, generatePassword } from "../auth";
import { sendWelcomeEmail } from "../email";

const createStudentSchema = z.object({
  email: z.string().email(),
  name: z.string().min(3),
  courseId: z.number().int().positive(),
  registrationNumber: z.string().optional(),
});

const updateStudentSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(3).optional(),
  email: z.string().email().optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
});

const deleteStudentSchema = z.object({
  id: z.number().int().positive(),
});

const resetPasswordSchema = z.object({
  userId: z.number().int().positive(),
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

export const studentsRouter = router({
  /**
   * Listar todos os alunos com matrícula e curso (Admin)
   */
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível",
      });
    }

    const students = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        status: users.status,
        firstLoginCompleted: users.firstLoginCompleted,
        createdAt: users.createdAt,
        registrationNumber: enrollments.registrationNumber,
        courseId: enrollments.courseId,
        courseName: courses.name,
        courseType: courses.type,
      })
      .from(users)
      .leftJoin(enrollments, eq(users.id, enrollments.userId))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(users.role, "user"))
      .orderBy(users.name);

    return students;
  }),

  /**
   * Obter matrículas do aluno logado (Aluno)
   */
  getMyEnrollments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível",
      });
    }

    const studentEnrollments = await db
      .select({
        id: enrollments.id,
        courseId: enrollments.courseId,
        courseName: courses.name,
        enrollmentDate: enrollments.enrollmentDate,
        status: enrollments.status,
        registrationNumber: enrollments.registrationNumber,
        currentSemester: enrollments.currentSemester,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.userId, ctx.user.id));

    return studentEnrollments;
  }),

  /**
   * Obter notas do aluno logado por matrícula e semestre (Aluno)
   */
  getMyGrades: protectedProcedure
    .input(z.object({ enrollmentId: z.number().int().positive(), semester: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados indisponível",
        });
      }

      // Verifica se a matrícula pertence ao aluno
      const enrollment = await db
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.id, input.enrollmentId), eq(enrollments.userId, ctx.user.id)))
        .limit(1);

      if (enrollment.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado a esta matrícula",
        });
      }

      // Busca as notas e as disciplinas relacionadas
      const studentGrades = await db
        .select({
          subjectId: subjects.id,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          firstBimester: grades.firstBimester,
          secondBimester: grades.secondBimester,
          thirdBimester: grades.thirdBimester,
          fourthBimester: grades.fourthBimester,
          finalExam: grades.finalExam,
          finalGrade: grades.finalGrade,
          status: grades.status,
        })
        .from(subjects)
        .leftJoin(grades, and(
          eq(subjects.id, grades.subjectId),
          eq(grades.enrollmentId, input.enrollmentId),
          eq(grades.semester, input.semester)
        ))
        .where(and(eq(subjects.courseId, enrollment[0].courseId), eq(subjects.semester, input.semester)));

      return studentGrades;
    }),

  /**
   * Obter detalhes de um aluno (Admin)
   */
  getById: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados indisponível",
        });
      }

      const student = await db
        .select()
        .from(users)
        .where(and(eq(users.id, input.id), eq(users.role, "user")))
        .limit(1);

      if (student.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aluno não encontrado",
        });
      }

      // Obter matrículas do aluno
      const studentEnrollments = await db
        .select({
          id: enrollments.id,
          courseId: enrollments.courseId,
          courseName: courses.name,
          enrollmentDate: enrollments.enrollmentDate,
          status: enrollments.status,
          registrationNumber: enrollments.registrationNumber,
          currentSemester: enrollments.currentSemester,
        })
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(eq(enrollments.userId, input.id));

      return {
        ...student[0],
        enrollments: studentEnrollments,
      };
    }),

  /**
   * Criar novo aluno com envio de e-mail automático (Admin)
   */
  create: adminProcedure.input(createStudentSchema).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível",
      });
    }

    try {
      // Verifica se o email já existe
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email já cadastrado",
        });
      }

      // Gera uma senha temporária aleatória
      const temporaryPassword = generatePassword();
      const passwordHash = await hashPassword(temporaryPassword);

      // Insere o novo usuário
      const result = await db.insert(users).values({
        openId: `student-${Date.now()}-${Math.random()}`,
        email: input.email,
        name: input.name,
        passwordHash,
        role: "user",
        status: "active",
        firstLoginCompleted: false, // Marca como primeiro acesso pendente
        loginMethod: "email",
      }).returning({ insertedId: users.id });

      const userId = result[0].insertedId;

      // Formatar data atual para YYYY-MM-DD (compatível com PostgreSQL DATE)
      const today = new Date().toISOString().split('T')[0];

      // Cria a matrícula
      await db.insert(enrollments).values({
        userId: userId,
        courseId: input.courseId,
        enrollmentDate: today,
        status: "active",
        currentSemester: 1,
        registrationNumber: input.registrationNumber,
      });

      // Envia o e-mail com a senha temporária
      const emailSent = await sendWelcomeEmail(
        input.email,
        input.name,
        temporaryPassword
      );

      return {
        id: userId,
        email: input.email,
        name: input.name,
        message: `Aluno criado com sucesso${emailSent ? ". E-mail com credenciais enviado." : ". Nota: E-mail não pôde ser enviado (verifique as configurações)."}`,
        emailSent,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao criar aluno",
      });
    }
  }),

  /**
   * Atualizar aluno (Admin)
   */
  update: adminProcedure.input(updateStudentSchema).mutation(async ({ input }) => {
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
      if (input.email) updateData.email = input.email;
      if (input.status) updateData.status = input.status;

      if (Object.keys(updateData).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nenhum campo para atualizar",
        });
      }

      await db
        .update(users)
        .set(updateData)
        .where(and(eq(users.id, input.id), eq(users.role, "user")));

      return {
        success: true,
        message: "Aluno atualizado com sucesso",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao atualizar aluno",
      });
    }
  }),

  /**
   * Deletar aluno (Admin)
   */
  delete: adminProcedure.input(deleteStudentSchema).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível",
      });
    }

    try {
      // Deleta as matrículas primeiro
      await db.delete(enrollments).where(eq(enrollments.userId, input.id));

      // Deleta o usuário
      await db
        .delete(users)
        .where(and(eq(users.id, input.id), eq(users.role, "user")));

      return {
        success: true,
        message: "Aluno deletado com sucesso",
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao deletar aluno",
      });
    }
  }),

  /**
   * Resetar senha do aluno (Admin)
   */
  resetPassword: adminProcedure.input(resetPasswordSchema).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível",
      });
    }

    try {
      // Busca o usuário
      const userRecord = await db
        .select()
        .from(users)
        .where(and(eq(users.id, input.userId), eq(users.role, "user")))
        .limit(1);

      if (userRecord.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aluno não encontrado",
        });
      }

      const user = userRecord[0];

      // Gera uma nova senha temporária
      const temporaryPassword = generatePassword();
      const hashedPassword = await hashPassword(temporaryPassword);

      // Atualiza a senha e marca para trocar no próximo acesso
      await db
        .update(users)
        .set({
          passwordHash: hashedPassword,
          firstLoginCompleted: false,
          passwordChangedAt: new Date(),
        })
        .where(eq(users.id, input.userId));

      // Envia e-mail com a nova senha
      await sendWelcomeEmail(user.email || "", user.name || "", temporaryPassword);

      return {
        success: true,
        message: `Senha resetada com sucesso. Uma nova senha temporária foi enviada para ${user.email}`,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao resetar senha",
      });
    }
  }),
});
