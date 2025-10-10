import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppEnv } from '@/backend/hono/context';
import { CourseService } from './service';
import { CourseListQuerySchema } from './schema';
import { success, failure } from '@/backend/http/response';
import { CourseErrors } from './error';

export const courseRoutes = new Hono<AppEnv>()
  /**
   * GET /api/courses
   * 코스 목록 조회
   */
  .get(
    '/courses',
    zValidator('query', CourseListQuerySchema),
    async (c) => {
      const supabase = c.get('supabase');
      const logger = c.get('logger');

      const query = c.req.valid('query');
      const service = new CourseService(supabase);

      try {
        const result = await service.listCourses(query);
        return success(c, result);
      } catch (error) {
        logger.error('Course list fetch error:', error);

        if (error instanceof Error && 'code' in error) {
          return failure(c, error);
        }

        return failure(c, CourseErrors.COURSE_LIST_FETCH_FAILED);
      }
    }
  )
  /**
   * GET /api/courses/:id
   * 코스 상세 조회
   */
  .get('/courses/:id', async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');
    const courseId = c.req.param('id');

    // 현재 사용자 정보 가져오기 (선택적)
    const { data: { user } } = await supabase.auth.getUser();

    const service = new CourseService(supabase);

    try {
      const course = await service.getCourseById(courseId, user?.id);
      return success(c, course);
    } catch (error) {
      logger.error(`Course detail fetch error for ${courseId}:`, error);

      if (error instanceof Error && 'code' in error) {
        return failure(c, error);
      }

      return failure(c, CourseErrors.COURSE_NOT_FOUND);
    }
  })
  /**
   * GET /api/manage/courses
   * 강사의 코스 목록 조회
   */
  .get('/manage/courses', async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Auth error:', authError);
      return failure(c, CourseErrors.UNAUTHORIZED_ACCESS);
    }

    // 역할 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'instructor') {
      return failure(c, CourseErrors.UNAUTHORIZED_ACCESS);
    }

    const service = new CourseService(supabase);

    try {
      const courses = await service.getInstructorCourses(user.id);
      return success(c, courses);
    } catch (error) {
      logger.error('Instructor courses error:', error);
      return failure(c, CourseErrors.COURSE_LIST_FETCH_FAILED);
    }
  })
  /**
   * POST /api/manage/courses
   * 새 코스 생성
   */
  .post('/manage/courses', async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return failure(c, CourseErrors.UNAUTHORIZED_ACCESS);

    // 역할 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'instructor') {
      return failure(c, CourseErrors.UNAUTHORIZED_ACCESS);
    }

    const body = await c.req.json();
    const service = new CourseService(supabase);

    try {
      const course = await service.createCourse(user.id, body);
      return success(c, course, 201);
    } catch (error) {
      logger.error('Course creation error:', error);
      return failure(c, CourseErrors.COURSE_CREATE_FAILED);
    }
  })
  /**
   * PUT /api/manage/courses/:id
   * 코스 수정
   */
  .put('/manage/courses/:id', async (c) => {
    const supabase = c.get('supabase');
    const courseId = c.req.param('id');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return failure(c, CourseErrors.UNAUTHORIZED_ACCESS);

    const body = await c.req.json();
    const service = new CourseService(supabase);

    try {
      const course = await service.updateCourse(courseId, user.id, body);
      return success(c, course);
    } catch (error) {
      return failure(c, CourseErrors.COURSE_UPDATE_FAILED);
    }
  })
  /**
   * PUT /api/manage/courses/:id/publish
   * 코스 게시
   */
  .put('/manage/courses/:id/publish', async (c) => {
    const supabase = c.get('supabase');
    const courseId = c.req.param('id');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return failure(c, CourseErrors.UNAUTHORIZED_ACCESS);

    const service = new CourseService(supabase);

    try {
      await service.publishCourse(courseId, user.id);
      return success(c, { message: '코스가 게시되었습니다' });
    } catch (error) {
      if (error instanceof Error) {
        return failure(c, { code: 'PUBLISH_ERROR', message: error.message, status: 400 });
      }
      return failure(c, CourseErrors.COURSE_PUBLISH_FAILED);
    }
  })
  /**
   * PUT /api/manage/courses/:id/archive
   * 코스 아카이브
   */
  .put('/manage/courses/:id/archive', async (c) => {
    const supabase = c.get('supabase');
    const courseId = c.req.param('id');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return failure(c, CourseErrors.UNAUTHORIZED_ACCESS);

    const service = new CourseService(supabase);

    try {
      await service.archiveCourse(courseId, user.id);
      return success(c, { message: '코스가 아카이브되었습니다' });
    } catch (error) {
      return failure(c, CourseErrors.COURSE_ARCHIVE_FAILED);
    }
  });