import { z } from "zod";
import { publicProcedure, router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { authenticateUser, updateUserPassword, verifyPassword } from "../auth";
import { getDb, getUserById } from "../db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import { sendPasswordChangeEmail } from "../email";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8, "Nova senha deve ter no mínimo 8 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não correspondem",
  path: ["confirmPassword"],
});

const forceChangePasswordSchema = z.object({
  newPassword: z.string().min(8, "Nova senha deve ter no mínimo 8 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não correspondem",
  path: ["confirmPassword"],
});

export const authRouter = router({
  /**
   * Obtém informações do usuário autenticado
   */
  me: publicProcedure.query(async (opts) => {
    if (!opts.ctx.user) {
      return null;
    }

    const user = await getUserById(opts.ctx.user.id);
    return user
      ? {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          firstLoginCompleted: user.firstLoginCompleted,
        }
      : null;
  }),

  /**
   * Login com email e senha
   */
  loginWithEmail: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    try {
      const user = await authenticateUser(input.email, input.password);

      // Cria o token de sessão
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
      });

      // Define o cookie de sessão
      const cookieOptions = getSessionCookieOptions(ctx.req);
      
      // Forçar SameSite=Lax e Secure se estiver em produção
      const isProd = process.env.NODE_ENV === "production";
      
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        secure: isProd,
        sameSite: "lax",
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 ano
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        firstLoginCompleted: user.firstLoginCompleted,
      };
    } catch (error) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: error instanceof Error ? error.message : "Falha na autenticação",
      });
    }
  }),

  /**
   * Logout
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    const { domain, httpOnly, path, sameSite, secure } = getSessionCookieOptions(ctx.req);
    
    // Forçar as mesmas opções usadas na criação para garantir a remoção
    const isProd = process.env.NODE_ENV === "production";
    
    ctx.res.clearCookie(COOKIE_NAME, {
      domain,
      httpOnly,
      path,
      sameSite: "lax",
      secure: isProd,
      maxAge: 0,
    });
    
    return {
      success: true,
    } as const;
  }),

  /**
   * Alterar senha do usuário (com validação de senha atual)
   */
  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Você precisa estar autenticado",
        });
      }

      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Banco de dados indisponível",
          });
        }

        // Busca o usuário para validar a senha atual
        const userRecord = await db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);

        if (userRecord.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Usuário não encontrado",
          });
        }

        const user = userRecord[0];

        // Valida a senha atual
        const isCurrentPasswordValid = await verifyPassword(
          input.currentPassword,
          user.passwordHash || ""
        );

        if (!isCurrentPasswordValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Senha atual incorreta",
          });
        }

        // Atualiza para a nova senha
        await updateUserPassword(ctx.user.id, input.newPassword);

        // Envia e-mail de confirmação
        await sendPasswordChangeEmail(user.email || "", user.name || "");

        return {
          success: true,
          message: "Senha alterada com sucesso",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao alterar senha",
        });
      }
    }),

  /**
   * Forçar mudança de senha no primeiro acesso (sem validar senha atual)
   */
  forceChangePassword: protectedProcedure
    .input(forceChangePasswordSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Você precisa estar autenticado",
        });
      }

      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Banco de dados indisponível",
          });
        }

        // Busca o usuário
        const userRecord = await db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);

        if (userRecord.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Usuário não encontrado",
          });
        }

        const user = userRecord[0];

        // Verifica se o usuário ainda não completou o primeiro login
        if (user.firstLoginCompleted) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Este usuário já completou o primeiro acesso",
          });
        }

        // Atualiza para a nova senha e marca como primeiro acesso completo
        await updateUserPassword(ctx.user.id, input.newPassword);

        // Envia e-mail de confirmação
        await sendPasswordChangeEmail(user.email || "", user.name || "");

        return {
          success: true,
          message: "Senha alterada com sucesso. Você agora tem acesso total ao portal.",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao alterar senha",
        });
      }
    }),
});
