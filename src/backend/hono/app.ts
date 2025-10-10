import { Hono } from 'hono';
import { errorBoundary } from '@/backend/middleware/error';
import { withAppContext } from '@/backend/middleware/context';
import { withSupabase } from '@/backend/middleware/supabase';
import { registerExampleRoutes } from '@/features/example/backend/route';
import { profileRoutes } from '@/features/profile/backend/route';
import { courseRoutes } from '@/features/course/backend/route';
import { enrollmentRoutes } from '@/features/enrollment/backend/route';
import { assignmentRoutes } from '@/features/assignment/backend/route';
import { registerSubmissionRoutes } from '@/features/submission/backend/route';
import { registerGradingRoutes } from '@/features/grading/backend/route';
import { registerGradesRoutes } from '@/features/grades/backend/route';
import { dashboardRoutes } from '@/features/dashboard/backend/route';
import type { AppEnv } from '@/backend/hono/context';

let singletonApp: Hono<AppEnv> | null = null;

export const createHonoApp = () => {
  if (singletonApp) {
    return singletonApp;
  }

  const app = new Hono<AppEnv>();

  app.use('*', errorBoundary());
  app.use('*', withAppContext());
  app.use('*', withSupabase());

  registerExampleRoutes(app);
  app.route('/api/profile', profileRoutes);
  app.route('/api', courseRoutes);
  app.route('/api', enrollmentRoutes);
  app.route('/api', assignmentRoutes);
  registerSubmissionRoutes(app);
  registerGradingRoutes(app);
  registerGradesRoutes(app);
  app.route('/api/dashboard', dashboardRoutes);

  singletonApp = app;

  return app;
};
