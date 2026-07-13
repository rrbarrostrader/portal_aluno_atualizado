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
  role: z.enum(["user", "admin", "teacher"]),
  courseId: z.number().int().positive().nullable().optional(),
  registrationNumber: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

const updateStudentSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(3).optional(),
  email: z.string().email().optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  role: z.enum(["user", "admin", "teacher"]).optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
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
   * Listar todos os usuários (Admin)
   */
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível",
      });
    }

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
        cpf: users.cpf,
        rg: users.rg,
        birthDate: users.birthDate,
        address: users.address,
        phone: users.phone,
        firstLoginCompleted: users.firstLoginCompleted,
        createdAt: users.createdAt,
        registrationNumber: enrollments.registrationNumber,
        enrollmentId: enrollments.id,
        courseId: enrollments.courseId,
        courseName: courses.name,
        courseType: courses.type,
      })
      .from(users)
      .leftJoin(enrollments, eq(users.id, enrollments.userId))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .orderBy(users.name);

    return allUsers;
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

      const allSubjects = await db
        .select({
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
          courseHours: subjects.courseHours,
          semester: subjects.semester,
        })
        .from(subjects)
        .where(and(
          eq(subjects.courseId, enrollment[0].courseId),
          eq(subjects.semester, input.semester)
        ))
        .orderBy(subjects.id);

      const studentGrades = await Promise.all(
        allSubjects.map(async (subject) => {
          const gradeRecord = await db
            .select()
            .from(grades)
            .where(and(
              eq(grades.enrollmentId, input.enrollmentId),
              eq(grades.subjectId, subject.id),
              eq(grades.semester, input.semester)
            ))
            .limit(1);

          return {
            subjectId: subject.id,
            subjectName: subject.name,
            subjectCode: subject.code,
            courseHours: subject.courseHours,
            firstBimester: gradeRecord[0]?.firstBimester || null,
            secondBimester: gradeRecord[0]?.secondBimester || null,
            thirdBimester: gradeRecord[0]?.thirdBimester || null,
            fourthBimester: gradeRecord[0]?.fourthBimester || null,
            finalExam: gradeRecord[0]?.finalExam || null,
            finalGrade: gradeRecord[0]?.finalGrade || null,
            status: gradeRecord[0]?.status || "pending",
          };
        })
      );

      return studentGrades;
    }),

  /**
   * Criar novo usuário (Admin)
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

      // Verifica se o CPF já existe (se fornecido)
      if (input.cpf) {
        const existingCpf = await db
          .select()
          .from(users)
          .where(eq(users.cpf, input.cpf))
          .limit(1);

        if (existingCpf.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "CPF já cadastrado no sistema",
          });
        }
      }

      const temporaryPassword = generatePassword();
      const passwordHash = await hashPassword(temporaryPassword);

      const result = await db.insert(users).values({
        openId: `${input.role}-${Date.now()}-${Math.random()}`,
        email: input.email,
        name: input.name,
        passwordHash,
        role: input.role,
        status: "active",
        firstLoginCompleted: false,
        loginMethod: "email",
        cpf: input.cpf || null,
        rg: input.rg || null,
        birthDate: input.birthDate || null,
        address: input.address || null,
        phone: input.phone || null,
      }).returning({ insertedId: users.id });

      const userId = result[0].insertedId;
      const today = new Date().toISOString().split('T')[0];

      // Só cria matrícula se for Aluno (user) e tiver curso selecionado
      if (input.role === "user" && input.courseId) {
        await db.insert(enrollments).values({
          userId: userId,
          courseId: input.courseId,
          enrollmentDate: today,
          status: "active",
          currentSemester: 1,
          registrationNumber: input.registrationNumber || `RA${Date.now()}`,
        });
      }

      const emailSent = await sendWelcomeEmail(
        input.email,
        input.name,
        temporaryPassword
      );

      return {
        id: userId,
        email: input.email,
        name: input.name,
        message: `Usuário criado com sucesso${emailSent ? ". E-mail enviado." : ". E-mail não enviado."}`,
        emailSent,
      };
    } catch (error) {
      console.error("[ERROR students.create]", error);
      if (error instanceof TRPCError) throw error;
      
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      if (msg.includes("unique constraint") && msg.includes("email")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este e-mail já está em uso." });
      }
      if (msg.includes("unique constraint") && msg.includes("cpf")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este CPF já está cadastrado." });
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Erro ao criar usuário: ${msg}`,
      });
    }
  }),

  /**
   * Atualizar usuário (Admin)
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
      if (input.role) updateData.role = input.role;
      if (input.cpf) updateData.cpf = input.cpf;
      if (input.rg) updateData.rg = input.rg;
      if (input.birthDate) updateData.birthDate = input.birthDate;
      if (input.address) updateData.address = input.address;
      if (input.phone) updateData.phone = input.phone;

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, input.id));

      return { success: true, message: "Usuário atualizado com sucesso" };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao atualizar usuário",
      });
    }
  }),

  /**
   * Deletar usuário (Admin)
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
      await db.delete(enrollments).where(eq(enrollments.userId, input.id));
      await db.delete(users).where(eq(users.id, input.id));
      return { success: true, message: "Usuário deletado com sucesso" };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao deletar usuário",
      });
    }
  }),

  /**
   * Resetar senha (Admin)
   */
  resetPassword: adminProcedure.input(resetPasswordSchema).mutation(async ({ input }) => {
    const db = await getDb();
    const userRecord = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
    if (userRecord.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });

    const temporaryPassword = generatePassword();
    const hashedPassword = await hashPassword(temporaryPassword);
    await db.update(users).set({ passwordHash: hashedPassword, firstLoginCompleted: false, passwordChangedAt: new Date() }).where(eq(users.id, input.userId));
    await sendWelcomeEmail(userRecord[0].email || "", userRecord[0].name || "", temporaryPassword);
    return { success: true, message: "Senha resetada com sucesso" };
  }),
});
