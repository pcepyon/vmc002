import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { AppEnv } from '@/backend/hono/context';
import { success, failure } from '@/backend/http/response';
import { SubmitAssignmentSchema, UpdateSubmissionSchema } from './schema';
import { SubmissionService } from './service';
import { SubmissionErrors } from './error';

const submissionRoute = new Hono<AppEnv>();

// 과제 제출
submissionRoute.post(
  '/assignments/:id/submit',
  zValidator('json', SubmitAssignmentSchema),
  async (c) => {
    try {
      const assignmentId = c.req.param('id');
      const data = c.req.valid('json');

      // TODO: 실제로는 인증된 사용자 ID를 가져와야 함
      const userId = 'mock-user-id';

      const service = new SubmissionService(c);
      const submission = await service.submitAssignment(
        assignmentId,
        userId,
        data
      );

      return success(c, {
        id: submission.id,
        version: submission.version,
        is_late: submission.is_late,
        status: submission.status,
        submitted_at: submission.submitted_at,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '제출에 실패했습니다';

      // 에러 코드에 따른 적절한 상태 코드 반환
      if (message === SubmissionErrors.DEADLINE_PASSED.message ||
          message === SubmissionErrors.ALREADY_SUBMITTED.message ||
          message === SubmissionErrors.ASSIGNMENT_CLOSED.message) {
        return failure(c, new Error(message), 422);
      }

      if (message === SubmissionErrors.NOT_ENROLLED.message) {
        return failure(c, new Error(message), 403);
      }

      if (message === SubmissionErrors.ASSIGNMENT_NOT_FOUND.message) {
        return failure(c, new Error(message), 404);
      }

      return failure(c, new Error(message), 400);
    }
  }
);

// 제출 이력 조회
submissionRoute.get(
  '/assignments/:id/submissions',
  async (c) => {
    try {
      const assignmentId = c.req.param('id');
      const userId = 'mock-user-id';

      const service = new SubmissionService(c);
      const history = await service.getSubmissionHistory(assignmentId, userId);

      return success(c, history);
    } catch (error) {
      const message = error instanceof Error ? error.message : '조회에 실패했습니다';
      return failure(c, new Error(message), 400);
    }
  }
);

// 최신 제출물 조회
submissionRoute.get(
  '/assignments/:id/submission/latest',
  async (c) => {
    try {
      const assignmentId = c.req.param('id');
      const userId = 'mock-user-id';

      const service = new SubmissionService(c);
      const submission = await service.getLatestSubmission(assignmentId, userId);

      if (!submission) {
        return success(c, null);
      }

      return success(c, submission);
    } catch (error) {
      const message = error instanceof Error ? error.message : '조회에 실패했습니다';
      return failure(c, new Error(message), 400);
    }
  }
);

// 제출 가능 여부 확인
submissionRoute.get(
  '/assignments/:id/can-submit',
  async (c) => {
    try {
      const assignmentId = c.req.param('id');
      const userId = 'mock-user-id';

      const service = new SubmissionService(c);
      const validation = await service.validateSubmission(assignmentId, userId);

      return success(c, validation);
    } catch (error) {
      const message = error instanceof Error ? error.message : '확인에 실패했습니다';
      return failure(c, new Error(message), 400);
    }
  }
);

// 제출물 수정 (재제출)
submissionRoute.put(
  '/submissions/:id',
  zValidator('json', UpdateSubmissionSchema),
  async (c) => {
    try {
      const submissionId = c.req.param('id');
      const data = c.req.valid('json');
      const userId = 'mock-user-id';

      const service = new SubmissionService(c);
      const submission = await service.updateSubmission(
        submissionId,
        userId,
        data
      );

      return success(c, submission);
    } catch (error) {
      const message = error instanceof Error ? error.message : '수정에 실패했습니다';

      if (message === SubmissionErrors.SUBMISSION_NOT_FOUND.message) {
        return failure(c, new Error(message), 404);
      }

      if (message === SubmissionErrors.RESUBMISSION_NOT_ALLOWED.message) {
        return failure(c, new Error(message), 422);
      }

      return failure(c, new Error(message), 400);
    }
  }
);

export function registerSubmissionRoutes(app: Hono<AppEnv>) {
  app.route('/api', submissionRoute);
}