export const SubmissionErrors = {
  SUBMISSION_NOT_ALLOWED: {
    code: 'SUBMISSION_NOT_ALLOWED',
    message: '제출이 허용되지 않습니다',
  },
  DEADLINE_PASSED: {
    code: 'DEADLINE_PASSED',
    message: '마감일이 지났습니다',
  },
  ALREADY_SUBMITTED: {
    code: 'ALREADY_SUBMITTED',
    message: '이미 제출하셨습니다',
  },
  ASSIGNMENT_CLOSED: {
    code: 'ASSIGNMENT_CLOSED',
    message: '마감된 과제입니다',
  },
  ASSIGNMENT_NOT_PUBLISHED: {
    code: 'ASSIGNMENT_NOT_PUBLISHED',
    message: '게시되지 않은 과제입니다',
  },
  CONTENT_REQUIRED: {
    code: 'CONTENT_REQUIRED',
    message: '답변을 입력해주세요',
  },
  NOT_ENROLLED: {
    code: 'NOT_ENROLLED',
    message: '수강 등록되지 않은 코스입니다',
  },
  ASSIGNMENT_NOT_FOUND: {
    code: 'ASSIGNMENT_NOT_FOUND',
    message: '과제를 찾을 수 없습니다',
  },
  SUBMISSION_NOT_FOUND: {
    code: 'SUBMISSION_NOT_FOUND',
    message: '제출물을 찾을 수 없습니다',
  },
  INVALID_URL_FORMAT: {
    code: 'INVALID_URL_FORMAT',
    message: '올바른 URL 형식이 아닙니다',
  },
  RESUBMISSION_NOT_ALLOWED: {
    code: 'RESUBMISSION_NOT_ALLOWED',
    message: '재제출이 허용되지 않습니다',
  },
} as const;