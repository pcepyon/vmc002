import { AppContext } from '@/backend/hono/context';
import { GradingErrors } from './error';
import {
  GradeSubmissionDto,
  BatchGradeDto,
  GradingFilter,
  SubmissionForGrading,
  GradingStats,
} from './schema';

export class GradingService {
  constructor(private readonly c: AppContext) {}

  async getSubmissionsForGrading(
    assignmentId: string,
    instructorId: string,
    filter?: GradingFilter
  ): Promise<SubmissionForGrading[]> {
    const supabase = this.c.get('supabase');

    // 과제 소유권 확인
    const { data: assignment } = await supabase
      .from('assignments')
      .select('*, course:courses!inner(*)')
      .eq('id', assignmentId)
      .single();

    if (!assignment) {
      throw new Error(GradingErrors.ASSIGNMENT_NOT_FOUND.message);
    }

    if (assignment.course.instructor_id !== instructorId) {
      throw new Error(GradingErrors.COURSE_NOT_OWNED.message);
    }

    // 제출물 조회 쿼리 생성
    let query = supabase
      .from('submissions')
      .select(`
        *,
        user:profiles!inner(id, name, email)
      `)
      .eq('assignment_id', assignmentId);

    // 필터 적용
    if (filter?.status === 'ungraded') {
      query = query.eq('status', 'submitted');
    } else if (filter?.status === 'graded') {
      query = query.in('status', ['graded', 'resubmission_required']);
    } else if (filter?.status === 'late') {
      query = query.eq('is_late', true);
    }

    // 정렬 적용
    const sortBy = filter?.sortBy || 'submitted_at';
    const order = filter?.order || 'desc';
    query = query.order(sortBy, { ascending: order === 'asc' });

    const { data, error } = await query;

    if (error) {
      throw new Error('제출물 조회에 실패했습니다');
    }

    // 데이터 포맷팅
    return (data || []).map((submission: any) => ({
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
    }));
  }

  async gradeSubmission(
    submissionId: string,
    instructorId: string,
    data: GradeSubmissionDto
  ) {
    const supabase = this.c.get('supabase');

    // 제출물 및 과제 정보 조회
    const { data: submission } = await supabase
      .from('submissions')
      .select(`
        *,
        assignment:assignments!inner(
          *,
          course:courses!inner(*)
        )
      `)
      .eq('id', submissionId)
      .single();

    if (!submission) {
      throw new Error(GradingErrors.SUBMISSION_NOT_FOUND.message);
    }

    // 권한 확인
    if (submission.assignment.course.instructor_id !== instructorId) {
      throw new Error(GradingErrors.GRADING_PERMISSION_DENIED.message);
    }

    // 과제 상태 확인
    if (submission.assignment.status === 'draft') {
      throw new Error(GradingErrors.INVALID_ASSIGNMENT_STATUS.message);
    }

    // 상태 결정
    const newStatus = data.request_resubmission
      ? 'resubmission_required'
      : 'graded';

    // 채점 정보 업데이트
    const { data: updated, error } = await supabase
      .from('submissions')
      .update({
        score: data.score,
        feedback: data.feedback,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) {
      throw new Error('채점 저장에 실패했습니다');
    }

    return updated;
  }

  async batchGradeSubmissions(
    instructorId: string,
    data: BatchGradeDto
  ) {
    const supabase = this.c.get('supabase');
    const results = [];

    // 트랜잭션 대신 개별 처리 (Supabase는 트랜잭션 지원 제한적)
    for (const item of data.submissions) {
      try {
        const graded = await this.gradeSubmission(
          item.id,
          instructorId,
          {
            score: item.score,
            feedback: item.feedback,
            request_resubmission: false,
          }
        );
        results.push({ id: item.id, success: true, data: graded });
      } catch (error) {
        results.push({
          id: item.id,
          success: false,
          error: error instanceof Error ? error.message : '채점 실패',
        });
      }
    }

    return results;
  }

  async getGradingStats(
    assignmentId: string,
    instructorId: string
  ): Promise<GradingStats> {
    const supabase = this.c.get('supabase');

    // 과제 소유권 확인
    const { data: assignment } = await supabase
      .from('assignments')
      .select('*, course:courses!inner(*)')
      .eq('id', assignmentId)
      .single();

    if (!assignment) {
      throw new Error(GradingErrors.ASSIGNMENT_NOT_FOUND.message);
    }

    if (assignment.course.instructor_id !== instructorId) {
      throw new Error(GradingErrors.COURSE_NOT_OWNED.message);
    }

    // 제출물 통계 조회
    const { data: submissions } = await supabase
      .from('submissions')
      .select('score, status, is_late')
      .eq('assignment_id', assignmentId);

    const total = submissions?.length || 0;
    const graded = submissions?.filter(s =>
      s.status === 'graded' || s.status === 'resubmission_required'
    ).length || 0;
    const ungraded = total - graded;
    const late = submissions?.filter(s => s.is_late).length || 0;

    // 평균 점수 계산
    const scores = submissions
      ?.filter(s => s.score !== null)
      .map(s => s.score as number) || [];

    const averageScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : null;

    // 수강생 수 조회
    const { count: enrollmentCount } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', assignment.course_id);

    const submissionRate = enrollmentCount
      ? (total / enrollmentCount) * 100
      : 0;

    return {
      total,
      graded,
      ungraded,
      late,
      averageScore,
      submissionRate: Math.round(submissionRate),
    };
  }

  async getNextUngradedSubmission(
    assignmentId: string,
    instructorId: string,
    currentSubmissionId?: string
  ) {
    const supabase = this.c.get('supabase');

    // 미채점 제출물 조회
    let query = supabase
      .from('submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: true })
      .limit(1);

    // 현재 제출물 이후의 것만 조회
    if (currentSubmissionId) {
      const { data: current } = await supabase
        .from('submissions')
        .select('submitted_at')
        .eq('id', currentSubmissionId)
        .single();

      if (current) {
        query = query.gt('submitted_at', current.submitted_at);
      }
    }

    const { data } = await query;

    return data?.[0] || null;
  }

  async getGradingQueue(instructorId: string) {
    const supabase = this.c.get('supabase');

    // 강사의 모든 코스 조회
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title')
      .eq('instructor_id', instructorId);

    if (!courses || courses.length === 0) {
      return { assignments: [] };
    }

    const courseIds = courses.map(c => c.id);

    // 각 코스의 과제별 미채점 제출물 수 조회
    const { data: assignments } = await supabase
      .from('assignments')
      .select(`
        id,
        title,
        due_date,
        course_id,
        submissions(id, status)
      `)
      .in('course_id', courseIds)
      .eq('status', 'published');

    const result = (assignments || []).map((assignment: any) => {
      const course = courses.find(c => c.id === assignment.course_id);
      const submissions = assignment.submissions || [];
      const ungradedCount = submissions.filter(
        (s: any) => s.status === 'submitted'
      ).length;

      return {
        id: assignment.id,
        course_id: assignment.course_id,
        course_title: course?.title || '',
        title: assignment.title,
        due_date: assignment.due_date,
        ungraded_count: ungradedCount,
        total_submissions: submissions.length,
      };
    }).filter((a: any) => a.ungraded_count > 0);

    return { assignments: result };
  }
}