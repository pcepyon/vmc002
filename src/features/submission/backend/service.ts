import { AppContext } from '@/backend/hono/context';
import { SubmissionErrors } from './error';
import { SubmitAssignmentDto, UpdateSubmissionDto } from './schema';

export class SubmissionService {
  constructor(private readonly c: AppContext) {}

  async submitAssignment(
    assignmentId: string,
    userId: string,
    data: SubmitAssignmentDto
  ) {
    const supabase = this.c.get('supabase');

    // 과제 정보 조회
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('*, course:courses!inner(*)')
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      throw new Error(SubmissionErrors.ASSIGNMENT_NOT_FOUND.message);
    }

    // 과제 상태 확인
    if (assignment.status === 'draft') {
      throw new Error(SubmissionErrors.ASSIGNMENT_NOT_PUBLISHED.message);
    }

    if (assignment.status === 'closed') {
      throw new Error(SubmissionErrors.ASSIGNMENT_CLOSED.message);
    }

    // 수강 등록 여부 확인
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', assignment.course_id)
      .single();

    if (!enrollment) {
      throw new Error(SubmissionErrors.NOT_ENROLLED.message);
    }

    // 마감일 확인 및 지각 여부 판단
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    const isLate = now > dueDate;

    if (isLate && !assignment.allow_late) {
      throw new Error(SubmissionErrors.DEADLINE_PASSED.message);
    }

    // 기존 제출물 확인
    const { data: existingSubmissions } = await supabase
      .from('submissions')
      .select('id, version')
      .eq('assignment_id', assignmentId)
      .eq('user_id', userId)
      .order('version', { ascending: false })
      .limit(1);

    const hasExistingSubmission = existingSubmissions && existingSubmissions.length > 0;

    if (hasExistingSubmission && !assignment.allow_resubmission) {
      throw new Error(SubmissionErrors.ALREADY_SUBMITTED.message);
    }

    // 다음 버전 번호 계산
    const nextVersion = hasExistingSubmission
      ? existingSubmissions[0].version + 1
      : 1;

    // 제출물 생성
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        assignment_id: assignmentId,
        user_id: userId,
        content_text: data.content_text,
        content_link: data.content_link || null,
        is_late: isLate,
        status: 'submitted',
        version: nextVersion,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (submissionError) {
      throw new Error('제출물 저장에 실패했습니다');
    }

    return submission;
  }

  async getLatestSubmission(
    assignmentId: string,
    userId: string
  ) {
    const supabase = this.c.get('supabase');

    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('user_id', userId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error('제출물 조회에 실패했습니다');
    }

    return data;
  }

  async getSubmissionHistory(
    assignmentId: string,
    userId: string
  ) {
    const supabase = this.c.get('supabase');

    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('user_id', userId)
      .order('version', { ascending: false });

    if (error) {
      throw new Error('제출 이력 조회에 실패했습니다');
    }

    return {
      submissions: data || [],
      total: data?.length || 0,
    };
  }

  async updateSubmission(
    submissionId: string,
    userId: string,
    data: UpdateSubmissionDto
  ) {
    const supabase = this.c.get('supabase');

    // 제출물 소유자 확인
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('*, assignment:assignments!inner(*)')
      .eq('id', submissionId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !submission) {
      throw new Error(SubmissionErrors.SUBMISSION_NOT_FOUND.message);
    }

    // 재제출 허용 여부 확인
    if (!submission.assignment.allow_resubmission) {
      throw new Error(SubmissionErrors.RESUBMISSION_NOT_ALLOWED.message);
    }

    // 이미 채점된 경우 수정 불가
    if (submission.status === 'graded') {
      throw new Error('이미 채점된 제출물은 수정할 수 없습니다');
    }

    // 제출물 업데이트
    const { data: updated, error: updateError } = await supabase
      .from('submissions')
      .update({
        content_text: data.content_text,
        content_link: data.content_link || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (updateError) {
      throw new Error('제출물 수정에 실패했습니다');
    }

    return updated;
  }

  async validateSubmission(
    assignmentId: string,
    userId: string
  ): Promise<{
    canSubmit: boolean;
    isLate: boolean;
    message?: string;
  }> {
    const supabase = this.c.get('supabase');

    // 과제 정보 조회
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return {
        canSubmit: false,
        isLate: false,
        message: SubmissionErrors.ASSIGNMENT_NOT_FOUND.message,
      };
    }

    // 과제 상태 확인
    if (assignment.status !== 'published') {
      return {
        canSubmit: false,
        isLate: false,
        message: assignment.status === 'closed'
          ? SubmissionErrors.ASSIGNMENT_CLOSED.message
          : SubmissionErrors.ASSIGNMENT_NOT_PUBLISHED.message,
      };
    }

    // 마감일 확인
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    const isLate = now > dueDate;

    if (isLate && !assignment.allow_late) {
      return {
        canSubmit: false,
        isLate: true,
        message: SubmissionErrors.DEADLINE_PASSED.message,
      };
    }

    // 기존 제출물 확인 (재제출 불가한 경우)
    if (!assignment.allow_resubmission) {
      const { data: existingSubmission } = await supabase
        .from('submissions')
        .select('id')
        .eq('assignment_id', assignmentId)
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (existingSubmission) {
        return {
          canSubmit: false,
          isLate: false,
          message: SubmissionErrors.ALREADY_SUBMITTED.message,
        };
      }
    }

    return {
      canSubmit: true,
      isLate,
      message: isLate ? '지각 제출입니다. 점수가 감점될 수 있습니다.' : undefined,
    };
  }
}