import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { GradesService } from './service';
import { success, failure } from '@/backend/http/response';
import { GradesErrors } from './error';
import { ProfileErrors } from '@/features/profile/backend/error';

export const gradesRoutes = new Hono<AppEnv>()
  /**
   * GET /api/my-courses/:courseId/grades
   * 코스별 성적 조회 (학습자 전용)
   */
  .get('/my-courses/:courseId/grades', async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');
    const courseId = c.req.param('courseId');

    // 현재 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Auth error in get grades:', authError);
      return failure(c, ProfileErrors.UNAUTHORIZED_ACCESS);
    }

    const service = new GradesService(supabase);

    try {
      const grades = await service.getCourseGrades(courseId, user.id);
      return success(c, grades);
    } catch (error) {
      logger.error(`Grades fetch error for course ${courseId}:`, error);

      if (error instanceof Error && 'code' in error) {
        return failure(c, error);
      }

      return failure(c, GradesErrors.GRADES_FETCH_FAILED);
    }
  })

  /**
   * GET /api/submissions/:submissionId/feedback
   * 개별 피드백 조회
   */
  .get('/submissions/:submissionId/feedback', async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');
    const submissionId = c.req.param('submissionId');

    // 현재 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Auth error in get feedback:', authError);
      return failure(c, ProfileErrors.UNAUTHORIZED_ACCESS);
    }

    const service = new GradesService(supabase);

    try {
      const feedback = await service.getSubmissionFeedback(submissionId, user.id);
      return success(c, feedback);
    } catch (error) {
      logger.error(`Feedback fetch error for submission ${submissionId}:`, error);

      if (error instanceof Error && 'code' in error) {
        return failure(c, error);
      }

      return failure(c, GradesErrors.FEEDBACK_NOT_FOUND);
    }
  })

  /**
   * GET /api/my-courses/:courseId/progress
   * 진도율 조회
   */
  .get('/my-courses/:courseId/progress', async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');
    const courseId = c.req.param('courseId');

    // 현재 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Auth error in get progress:', authError);
      return failure(c, ProfileErrors.UNAUTHORIZED_ACCESS);
    }

    const service = new GradesService(supabase);

    try {
      const progress = await service.getProgress(courseId, user.id);
      return success(c, { progress });
    } catch (error) {
      logger.error(`Progress fetch error for course ${courseId}:`, error);
      return success(c, { progress: 0 });
    }
  })

  /**
   * GET /api/my-courses/transcript
   * 전체 성적표 조회
   */
  .get('/my-courses/transcript', async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');

    // 현재 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Auth error in get transcript:', authError);
      return failure(c, ProfileErrors.UNAUTHORIZED_ACCESS);
    }

    const service = new GradesService(supabase);

    try {
      const transcript = await service.generateTranscript(user.id);
      return success(c, transcript);
    } catch (error) {
      logger.error('Transcript generation error:', error);

      if (error instanceof Error && 'code' in error) {
        return failure(c, error);
      }

      return failure(c, GradesErrors.GRADES_FETCH_FAILED);
    }
  })

  /**
   * GET /api/my-courses/:courseId/summary
   * 코스 성적 요약
   */
  .get('/my-courses/:courseId/summary', async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');
    const courseId = c.req.param('courseId');

    // 현재 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Auth error in get summary:', authError);
      return failure(c, ProfileErrors.UNAUTHORIZED_ACCESS);
    }

    const service = new GradesService(supabase);

    try {
      const summary = await service.getCourseSummary(courseId, user.id);
      return success(c, summary);
    } catch (error) {
      logger.error(`Summary fetch error for course ${courseId}:`, error);

      if (error instanceof Error && 'code' in error) {
        return failure(c, error);
      }

      return failure(c, GradesErrors.GRADES_FETCH_FAILED);
    }
  });

export function registerGradesRoutes(app: Hono<AppEnv>) {
  app.route('/api', gradesRoutes);
}