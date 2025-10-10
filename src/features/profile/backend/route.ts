import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppEnv } from '@/backend/hono/context';
import { ProfileService } from './service';
import { CompleteProfileRequestSchema } from './schema';
import { success, failure } from '@/backend/http/response';
import { ProfileErrors } from './error';

export const profileRoutes = new Hono<AppEnv>()
  /**
   * POST /api/profile/complete
   * 프로필 완성 처리
   */
  .post(
    '/complete',
    zValidator('json', CompleteProfileRequestSchema),
    async (c) => {
      const supabase = c.get('supabase');
      const logger = c.get('logger');

      // 현재 사용자 정보 가져오기
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        logger.error('Auth error in profile complete:', authError);
        return failure(c, ProfileErrors.UNAUTHORIZED_ACCESS);
      }

      const request = c.req.valid('json');
      const service = new ProfileService(supabase);

      try {
        const profile = await service.completeProfile(
          user.id,
          user.email!,
          request
        );

        // 역할에 따른 리다이렉트 URL 설정
        const redirectUrl = profile.role === 'learner'
          ? '/courses'
          : '/dashboard/instructor';

        logger.info(`Profile completed for user ${user.id} with role ${profile.role}`);

        return success(c, {
          profile,
          redirectUrl
        });
      } catch (error) {
        logger.error('Profile completion error:', error);

        if (error instanceof Error && 'code' in error) {
          return failure(c, error);
        }

        return failure(c, ProfileErrors.PROFILE_UPDATE_FAILED);
      }
    }
  )
  /**
   * GET /api/profile/status
   * 프로필 완성도 확인
   */
  .get('/status', async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');

    // 현재 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Auth error in profile status:', authError);
      return failure(c, ProfileErrors.UNAUTHORIZED_ACCESS);
    }

    const service = new ProfileService(supabase);

    try {
      const status = await service.checkProfileCompletion(user.id);
      return success(c, status);
    } catch (error) {
      logger.error('Profile status check error:', error);
      return failure(c, ProfileErrors.PROFILE_UPDATE_FAILED);
    }
  })
  /**
   * GET /api/profile/me
   * 현재 사용자 프로필 조회
   */
  .get('/me', async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');

    // 현재 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Auth error in get profile:', authError);
      return failure(c, ProfileErrors.UNAUTHORIZED_ACCESS);
    }

    const service = new ProfileService(supabase);

    try {
      const profile = await service.getProfile(user.id);

      if (!profile) {
        return failure(c, ProfileErrors.PROFILE_NOT_FOUND);
      }

      return success(c, profile);
    } catch (error) {
      logger.error('Get profile error:', error);
      return failure(c, ProfileErrors.PROFILE_UPDATE_FAILED);
    }
  });