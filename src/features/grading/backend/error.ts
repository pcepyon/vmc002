export const GradingErrors = {
  GRADING_PERMISSION_DENIED: {
    code: 'GRADING_PERMISSION_DENIED',
    message: '채점 권한이 없습니다',
  },
  INVALID_SCORE_RANGE: {
    code: 'INVALID_SCORE_RANGE',
    message: '점수는 0-100 사이여야 합니다',
  },
  FEEDBACK_REQUIRED: {
    code: 'FEEDBACK_REQUIRED',
    message: '피드백을 입력해주세요',
  },
  SUBMISSION_NOT_FOUND: {
    code: 'SUBMISSION_NOT_FOUND',
    message: '제출물을 찾을 수 없습니다',
  },
  ALREADY_GRADED: {
    code: 'ALREADY_GRADED',
    message: '이미 채점된 제출물입니다',
  },
  ASSIGNMENT_NOT_FOUND: {
    code: 'ASSIGNMENT_NOT_FOUND',
    message: '과제를 찾을 수 없습니다',
  },
  COURSE_NOT_OWNED: {
    code: 'COURSE_NOT_OWNED',
    message: '본인 코스가 아닙니다',
  },
  INVALID_ASSIGNMENT_STATUS: {
    code: 'INVALID_ASSIGNMENT_STATUS',
    message: '과제를 먼저 게시해주세요',
  },
  BATCH_GRADE_FAILED: {
    code: 'BATCH_GRADE_FAILED',
    message: '일괄 채점 중 오류가 발생했습니다',
  },
} as const;