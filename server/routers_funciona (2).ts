import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { studentsRouter } from "./routers/students";
import { coursesRouter } from "./routers/courses";
import { gradesRouter } from "./routers/grades";
import { documentsRouter } from "./routers/documents";
import { dashboardRouter } from "./routers/dashboard";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  students: studentsRouter,
  courses: coursesRouter,
  grades: gradesRouter,
  documents: documentsRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
