import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppEnv } from '@/backend/hono/context';
import { AssignmentService } from './service';
import { success, failure } from '@/backend/http/response';
import { AssignmentErrors } from './error';
import { ProfileErrors } from '@/features/profile/backend/error';
import { CreateAssignmentSchema, UpdateAssignmentSchema } from './schema';

export const assignmentRoutes = new Hono<AppEnv>()
  /**
   * GET /api/assignments/:id
   * 과제 상세 조회
   */
  .get('/assignments/:id', async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');
    const assignmentId = c.req.param('id');

    // 현재 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Auth error in get assignment:', authError);
      return failure(c, ProfileErrors.UNAUTHORIZED_ACCESS);
    }

    const service = new AssignmentService(supabase);

    try {
      const assignment = await service.getAssignmentById(assignmentId, user.id);
      return success(c, assignment);
    } catch (error) {
      logger.error(`Assignment fetch error for ${assignmentId}:`, error);

      if (error instanceof Error && 'code' in error) {
        return failure(c, error);
      }

      return failure(c, AssignmentErrors.ASSIGNMENT_FETCH_FAILED);
    }
  })
  /**
   * GET /api/my-courses/:courseId/assignments
   * 코스별 과제 목록
   */
  .get('/my-courses/:courseId/assignments', async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');
    const courseId = c.req.param('courseId');

    // 현재 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Auth error in get course assignments:', authError);
      return failure(c, ProfileErrors.UNAUTHORIZED_ACCESS);
    }

    const service = new AssignmentService(supabase);

    try {
      const assignments = await service.listAssignmentsByCourse(courseId, user.id);
      return success(c, assignments);
    } catch (error) {
      logger.error(`Assignments fetch error for course ${courseId}:`, error);

      if (error instanceof Error && 'code' in error) {
        return failure(c, error);
      }

      return failure(c, AssignmentErrors.ASSIGNMENT_FETCH_FAILED);
    }
  })

  /**
   * POST /api/courses/:courseId/assignments
   * 새 과제 생성 (강사 전용)
   */
  .post('/courses/:courseId/assignments',
    zValidator('json', CreateAssignmentSchema),
    async (c) => {
      const supabase = c.get('supabase');
      const logger = c.get('logger');
      const courseId = c.req.param('courseId');
      const data = c.req.valid('json');

      // 현재 사용자 정보 가져오기
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        logger.error('Auth error in create assignment:', authError);
        return failure(c, ProfileErrors.UNAUTHORIZED_ACCESS);
      }

      const service = new AssignmentService(supabase);

      try {
        const assignment = await service.createAssignment(courseId, user.id, data);
        return success(c, assignment, 201);
      } catch (error) {
        logger.error(`Assignment creation error for course ${courseId}:`, error);

        if (error instanceof Error && 'code' in error) {
          return failure(c, error);
        }

        return failure(c, AssignmentErrors.ASSIGNMENT_CREATE_FAILED);
      }
    }
  )

  /**
   * PUT /api/assignments/:id
   * 과제 정보 수정 (강사 전용)
   */
  .put('/assignments/:id',
    zValidator('json', UpdateAssignmentSchema),
    async (c) => {
      const supabase = c.get('supabase');
      const logger = c.get('logger');
      const assignmentId = c.req.param('id');
      const data = c.req.valid('json');

      // 현재 사용자 정보 가져오기
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        logger.error('Auth error in update assignment:', authError);
        return failure(c, ProfileErrors.UNAUTHORIZED_ACCESS);
      }

      const service = new AssignmentService(supabase);

      try {
        const assignment = await service.updateAssignment(assignmentId, user.id, data);
        return success(c, assignment);
      } catch (error) {
        logger.error(`Assignment update error for ${assignmentId}:`, error);

        if (error instanceof Error && 'code' in error) {
          return failure(c, error);
        }

        return failure(c, AssignmentErrors.ASSIGNMENT_UPDATE_FAILED);
      }
    }
  )

  /**
   * PUT /api/assignments/:id/publish
   * 과제 게시 (draft -> published)
   */
  .put('/assignments/:id/publish', async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');
    const assignmentId = c.req.param('id');

    // 현재 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Auth error in publish assignment:', authError);
      return failure(c, ProfileErrors.UNAUTHORIZED_ACCESS);
    }

    const service = new AssignmentService(supabase);

    try {
      const assignment = await service.publishAssignment(assignmentId, user.id);
      return success(c, assignment);
    } catch (error) {
      logger.error(`Assignment publish error for ${assignmentId}:`, error);

      if (error instanceof Error && 'code' in error) {
        return failure(c, error);
      }

      return failure(c, AssignmentErrors.ASSIGNMENT_STATUS_CHANGE_FAILED);
    }
  })

  /**
   * PUT /api/assignments/:id/close
   * 과제 마감 (published -> closed)
   */
  .put('/assignments/:id/close', async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');
    const assignmentId = c.req.param('id');

    // 현재 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Auth error in close assignment:', authError);
      return failure(c, ProfileErrors.UNAUTHORIZED_ACCESS);
    }

    const service = new AssignmentService(supabase);

    try {
      const assignment = await service.closeAssignment(assignmentId, user.id);
      return success(c, assignment);
    } catch (error) {
      logger.error(`Assignment close error for ${assignmentId}:`, error);

      if (error instanceof Error && 'code' in error) {
        return failure(c, error);
      }

      return failure(c, AssignmentErrors.ASSIGNMENT_STATUS_CHANGE_FAILED);
    }
  })

  /**
   * DELETE /api/assignments/:id
   * 과제 삭제 (draft 상태만 가능)
   */
  .delete('/assignments/:id', async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');
    const assignmentId = c.req.param('id');

    // 현재 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Auth error in delete assignment:', authError);
      return failure(c, ProfileErrors.UNAUTHORIZED_ACCESS);
    }

    const service = new AssignmentService(supabase);

    try {
      await service.deleteAssignment(assignmentId, user.id);
      return success(c, { deleted: true });
    } catch (error) {
      logger.error(`Assignment delete error for ${assignmentId}:`, error);

      if (error instanceof Error && 'code' in error) {
        return failure(c, error);
      }

      return failure(c, AssignmentErrors.ASSIGNMENT_DELETE_FAILED);
    }
  })

  /**
   * GET /api/manage/courses/:courseId/assignments
   * 강사용 - 코스의 모든 과제 목록
   */
  .get('/manage/courses/:courseId/assignments', async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');
    const courseId = c.req.param('courseId');

    // 현재 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Auth error in get managed assignments:', authError);
      return failure(c, ProfileErrors.UNAUTHORIZED_ACCESS);
    }

    const service = new AssignmentService(supabase);

    try {
      const assignments = await service.listManagedAssignments(courseId, user.id);
      return success(c, assignments);
    } catch (error) {
      logger.error(`Managed assignments fetch error for course ${courseId}:`, error);

      if (error instanceof Error && 'code' in error) {
        return failure(c, error);
      }

      return failure(c, AssignmentErrors.ASSIGNMENT_FETCH_FAILED);
    }
  });