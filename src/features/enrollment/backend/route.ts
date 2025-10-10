import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { EnrollmentService } from './service';
import { success, failure } from '@/backend/http/response';
import { EnrollmentErrors } from './error';
import { ProfileErrors } from '@/features/profile/backend/error';

export const enrollmentRoutes = new Hono<AppEnv>()
  /**
   * POST /api/courses/:id/enroll
   * 수강신청
   */
  .post('/courses/:id/enroll', async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');
    const courseId = c.req.param('id');

    // 현재 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Auth error in enrollment:', authError);
      return failure(c, ProfileErrors.UNAUTHORIZED_ACCESS);
    }

    const service = new EnrollmentService(supabase);

    try {
      const enrollment = await service.enrollInCourse(user.id, courseId);
      logger.info(`User ${user.id} enrolled in course ${courseId}`);
      return success(c, enrollment);
    } catch (error) {
      logger.error(`Enrollment error for user ${user.id} in course ${courseId}:`, error);

      if (error instanceof Error && 'code' in error) {
        return failure(c, error);
      }

      return failure(c, EnrollmentErrors.ENROLLMENT_FAILED);
    }
  })
  /**
   * DELETE /api/courses/:id/enroll
   * 수강취소
   */
  .delete('/courses/:id/enroll', async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');
    const courseId = c.req.param('id');

    // 현재 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Auth error in unenrollment:', authError);
      return failure(c, ProfileErrors.UNAUTHORIZED_ACCESS);
    }

    const service = new EnrollmentService(supabase);

    try {
      await service.unenrollFromCourse(user.id, courseId);
      logger.info(`User ${user.id} unenrolled from course ${courseId}`);
      return success(c, { message: '수강취소가 완료되었습니다' });
    } catch (error) {
      logger.error(`Unenrollment error for user ${user.id} from course ${courseId}:`, error);

      if (error instanceof Error && 'code' in error) {
        return failure(c, error);
      }

      return failure(c, EnrollmentErrors.UNENROLLMENT_FAILED);
    }
  })
  /**
   * GET /api/my-courses
   * 내 수강 목록
   */
  .get('/my-courses', async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');

    // 현재 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Auth error in getting my courses:', authError);
      return failure(c, ProfileErrors.UNAUTHORIZED_ACCESS);
    }

    const service = new EnrollmentService(supabase);

    try {
      const enrollments = await service.getMyCoursesWithProgress(user.id);
      return success(c, enrollments);
    } catch (error) {
      logger.error(`Get my enrollments error for user ${user.id}:`, error);
      return success(c, []); // 에러 시에도 빈 배열 반환
    }
  })
  /**
   * GET /api/my-courses/:courseId
   * 특정 수강 코스 상세 조회
   */
  .get('/my-courses/:courseId', async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');
    const courseId = c.req.param('courseId');

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Auth error:', authError);
      return failure(c, ProfileErrors.UNAUTHORIZED_ACCESS);
    }

    const service = new EnrollmentService(supabase);

    try {
      const courseDetail = await service.getCourseDetailForStudent(courseId, user.id);
      return success(c, courseDetail);
    } catch (error) {
      logger.error(`Course detail error for user ${user.id}, course ${courseId}:`, error);

      if (error instanceof Error && 'code' in error) {
        return failure(c, error);
      }

      return failure(c, EnrollmentErrors.ENROLLMENT_NOT_FOUND);
    }
  })
  /**
   * GET /api/my-courses/:courseId/progress
   * 코스 진행률 조회
   */
  .get('/my-courses/:courseId/progress', async (c) => {
    const supabase = c.get('supabase');
    const courseId = c.req.param('courseId');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return failure(c, ProfileErrors.UNAUTHORIZED_ACCESS);

    const service = new EnrollmentService(supabase);
    const progress = await service.calculateCourseProgress(courseId, user.id);

    return success(c, { progress });
  })
  /**
   * GET /api/my-courses/:courseId/grades
   * 코스 성적 조회
   */
  .get('/my-courses/:courseId/grades', async (c) => {
    const supabase = c.get('supabase');
    const courseId = c.req.param('courseId');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return failure(c, ProfileErrors.UNAUTHORIZED_ACCESS);

    const service = new EnrollmentService(supabase);
    const currentGrade = await service.calculateCurrentGrade(courseId, user.id);

    return success(c, { currentGrade });
  });