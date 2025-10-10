import type { Hono } from 'hono';
import {
  success,
  failure,
} from '@/backend/http/response';
import { AppError } from '@/backend/http/error';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import { ExampleParamsSchema } from '@/features/example/backend/schema';
import { getExampleById } from './service';

export const registerExampleRoutes = (app: Hono<AppEnv>) => {
  app.get('/example/:id', async (c) => {
    const parsedParams = ExampleParamsSchema.safeParse({ id: c.req.param('id') });

    if (!parsedParams.success) {
      return failure(
        c,
        new AppError(
          'INVALID_EXAMPLE_PARAMS',
          'The provided example id is invalid.',
          400,
          parsedParams.error.format()
        )
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    try {
      const result = await getExampleById(supabase, parsedParams.data.id);
      return success(c, result);
    } catch (error) {
      logger.error('Failed to fetch example:', error);
      return failure(c, error);
    }
  });
};
