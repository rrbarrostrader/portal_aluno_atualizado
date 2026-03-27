import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users, enrollments, courses } from "../../drizzle/schema";
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
   * Listar todos os alunos
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
      })
      .from(users)
      .where(eq(users.role, "user"));

    return students;
  }),

  /**
   * Obter detalhes de um aluno
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
   * Criar novo aluno com envio de e-mail automático
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
   * Atualizar aluno
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
   * Deletar aluno
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
});
