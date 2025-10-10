import { createMiddleware } from 'hono/factory';
import {
  contextKeys,
  type AppEnv,
} from '@/backend/hono/context';
import { createServiceClient } from '@/backend/supabase/client';
import { createClient } from '@supabase/supabase-js';

export const withSupabase = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const config = c.get(
      contextKeys.config,
    ) as AppEnv['Variables']['config'] | undefined;

    if (!config) {
      throw new Error('Application configuration is not available.');
    }

    // Authorization 헤더에서 토큰 추출
    const authHeader = c.req.header('Authorization');

    let client;

    if (authHeader?.startsWith('Bearer ')) {
      // 사용자 토큰이 있으면 해당 토큰으로 클라이언트 생성
      const token = authHeader.substring(7);
      client = createClient(
        config.supabase.url,
        config.supabase.serviceRoleKey, // anon key 대신 service role key 사용
        {
          global: {
            headers: {
              Authorization: authHeader,
            },
          },
        }
      );
    } else {
      // 토큰이 없으면 서비스 클라이언트 사용
      client = createServiceClient(config.supabase);
    }

    c.set(contextKeys.supabase, client);

    await next();
  });
