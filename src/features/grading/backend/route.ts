import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { AppEnv } from '@/backend/hono/context';
import { success, failure } from '@/backend/http/response';
import {
  GradeSubmissionSchema,
  BatchGradeSchema,
  GradingFilterSchema
} from './schema';
import { GradingService } from './service';
import { GradingErrors } from './error';

const gradingRoute = new Hono<AppEnv>();

// 제출물 목록 조회 (채점용)
gradingRoute.get(
  '/assignments/:id/submissions',
  zValidator('query', GradingFilterSchema),
  async (c) => {
    try {
      const assignmentId = c.req.param('id');
      const filter = c.req.valid('query');

      // TODO: 실제로는 인증된 강사 ID를 가져와야 함
      const instructorId = 'mock-instructor-id';

      const service = new GradingService(c);
      const submissions = await service.getSubmissionsForGrading(
        assignmentId,
        instructorId,
        filter
      );

      return success(c,submissions);
    } catch (error) {
      const message = error instanceof Error ? error.message : '조회에 실패했습니다';

      if (message === GradingErrors.COURSE_NOT_OWNED.message) {
        return failure(c, new Error(message), 403);
      }

      if (message === GradingErrors.ASSIGNMENT_NOT_FOUND.message) {
        return failure(c, new Error(message), 404);
      }

      return failure(c, new Error(message), 400);
    }
  }
);

// 제출물 상세 조회
gradingRoute.get(
  '/submissions/:id',
  async (c) => {
    try {
      const submissionId = c.req.param('id');
      const instructorId = 'mock-instructor-id';

      const supabase = c.get('supabase');

      const { data: submission, error } = await supabase
        .from('submissions')
        .select(`
          *,
          user:profiles!inner(id, name, email),
          assignment:assignments!inner(
            *,
            course:courses!inner(*)
          )
        `)
        .eq('id', submissionId)
        .single();

      if (error || !submission) {
        throw new Error(GradingErrors.SUBMISSION_NOT_FOUND.message);
      }

      // 권한 확인
      if (submission.assignment.course.instructor_id !== instructorId) {
        throw new Error(GradingErrors.GRADING_PERMISSION_DENIED.message);
      }

      return success(c,{
        id: submission.id,
        assignment_id: submission.assignment_id,
        user_id: submission.user_id,
        user_name: submission.user.name,
        user_email: submission.user.email,
        content_text: submission.content_text,
        content_link: submission.content_link,
        submitted_at: submission.submitted_at,
        is_late: submission.is_late,
        score: submission.score,
        feedback: submission.feedback,
        status: submission.status,
        version: submission.version,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '조회에 실패했습니다';

      if (message === GradingErrors.SUBMISSION_NOT_FOUND.message) {
        return failure(c, new Error(message), 404);
      }

      if (message === GradingErrors.GRADING_PERMISSION_DENIED.message) {
        return failure(c, new Error(message), 403);
      }

      return failure(c, new Error(message), 400);
    }
  }
);

// 채점 처리
gradingRoute.post(
  '/submissions/:id/grade',
  zValidator('json', GradeSubmissionSchema),
  async (c) => {
    try {
      const submissionId = c.req.param('id');
      const data = c.req.valid('json');
      const instructorId = 'mock-instructor-id';

      const service = new GradingService(c);
      const result = await service.gradeSubmission(
        submissionId,
        instructorId,
        data
      );

      return success(c,result);
    } catch (error) {
      const message = error instanceof Error ? error.message : '채점에 실패했습니다';

      if (message === GradingErrors.GRADING_PERMISSION_DENIED.message ||
          message === GradingErrors.COURSE_NOT_OWNED.message) {
        return failure(c, new Error(message), 403);
      }

      if (message === GradingErrors.SUBMISSION_NOT_FOUND.message) {
        return failure(c, new Error(message), 404);
      }

      return failure(c, new Error(message), 400);
    }
  }
);

// 일괄 채점
gradingRoute.post(
  '/submissions/batch-grade',
  zValidator('json', BatchGradeSchema),
  async (c) => {
    try {
      const data = c.req.valid('json');
      const instructorId = 'mock-instructor-id';

      const service = new GradingService(c);
      const results = await service.batchGradeSubmissions(instructorId, data);

      return success(c,results);
    } catch (error) {
      const message = error instanceof Error ? error.message : '일괄 채점에 실패했습니다';
      return failure(c, new Error(message), 400);
    }
  }
);

// 채점 통계 조회
gradingRoute.get(
  '/assignments/:id/grading-stats',
  async (c) => {
    try {
      const assignmentId = c.req.param('id');
      const instructorId = 'mock-instructor-id';

      const service = new GradingService(c);
      const stats = await service.getGradingStats(assignmentId, instructorId);

      return success(c,stats);
    } catch (error) {
      const message = error instanceof Error ? error.message : '통계 조회에 실패했습니다';

      if (message === GradingErrors.COURSE_NOT_OWNED.message) {
        return failure(c, new Error(message), 403);
      }

      if (message === GradingErrors.ASSIGNMENT_NOT_FOUND.message) {
        return failure(c, new Error(message), 404);
      }

      return failure(c, new Error(message), 400);
    }
  }
);

// 채점 대기열 조회
gradingRoute.get(
  '/instructor/grading-queue',
  async (c) => {
    try {
      const instructorId = 'mock-instructor-id';

      const service = new GradingService(c);
      const queue = await service.getGradingQueue(instructorId);

      return success(c,queue);
    } catch (error) {
      const message = error instanceof Error ? error.message : '대기열 조회에 실패했습니다';
      return failure(c, new Error(message), 400);
    }
  }
);

// 다음 미채점 제출물 조회
gradingRoute.get(
  '/assignments/:id/next-ungraded',
  async (c) => {
    try {
      const assignmentId = c.req.param('id');
      const currentId = c.req.query('current');
      const instructorId = 'mock-instructor-id';

      const service = new GradingService(c);
      const next = await service.getNextUngradedSubmission(
        assignmentId,
        instructorId,
        currentId
      );

      return success(c,next);
    } catch (error) {
      const message = error instanceof Error ? error.message : '조회에 실패했습니다';
      return failure(c, new Error(message), 400);
    }
  }
);

export function registerGradingRoutes(app: Hono<AppEnv>) {
  app.route('/api', gradingRoute);
}