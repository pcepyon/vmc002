import { SupabaseClient } from '@supabase/supabase-js';
import { GradesErrors } from './error';
import type {
  GradeResponse,
  FeedbackDetail,
  GradeSummary,
  Transcript
} from './schema';

export class GradesService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * 코스별 성적 조회
   */
  async getCourseGrades(courseId: string, userId: string): Promise<GradeResponse> {
    try {
      // 수강 권한 확인
      const { data: enrollment } = await this.supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      if (!enrollment) {
        throw GradesErrors.NOT_ENROLLED;
      }

      // 코스 정보 조회
      const { data: course } = await this.supabase
        .from('courses')
        .select('id, title')
        .eq('id', courseId)
        .single();

      if (!course) {
        throw GradesErrors.GRADES_FETCH_FAILED;
      }

      // 과제 목록 조회 (published, closed 상태만)
      const { data: assignments, error: assignmentsError } = await this.supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .in('status', ['published', 'closed'])
        .order('due_date');

      if (assignmentsError) {
        throw GradesErrors.GRADES_FETCH_FAILED;
      }

      // 각 과제의 제출물 정보 조회
      const assignmentsWithSubmissions = await Promise.all(
        (assignments || []).map(async (assignment) => {
          const { data: submission } = await this.supabase
            .from('submissions')
            .select('*')
            .eq('assignment_id', assignment.id)
            .eq('user_id', userId)
            .order('version', { ascending: false })
            .limit(1)
            .single();

          return {
            id: assignment.id,
            title: assignment.title,
            due_date: assignment.due_date,
            weight: assignment.weight || 0,
            submission: submission ? {
              id: submission.id,
              score: submission.score,
              status: submission.status,
              is_late: submission.is_late,
              feedback: submission.feedback,
              version: submission.version,
              submitted_at: submission.submitted_at,
            } : null,
          };
        })
      );

      // 성적 요약 계산
      const summary = this.calculateSummary(assignmentsWithSubmissions);

      return {
        course: {
          id: course.id,
          title: course.title,
        },
        assignments: assignmentsWithSubmissions,
        summary,
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw GradesErrors.GRADES_FETCH_FAILED;
    }
  }

  /**
   * 개별 피드백 조회
   */
  async getSubmissionFeedback(submissionId: string, userId: string): Promise<FeedbackDetail> {
    try {
      // 제출물 정보 조회
      const { data: submission, error } = await this.supabase
        .from('submissions')
        .select(`
          *,
          assignments!inner (
            id,
            title,
            weight,
            due_date,
            course_id
          )
        `)
        .eq('id', submissionId)
        .single();

      if (error || !submission) {
        throw GradesErrors.SUBMISSION_NOT_FOUND;
      }

      // 본인의 제출물인지 확인
      if (submission.user_id !== userId) {
        throw GradesErrors.INVALID_SUBMISSION_ACCESS;
      }

      // 수강 권한 확인
      const { data: enrollment } = await this.supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', submission.assignments.course_id)
        .single();

      if (!enrollment) {
        throw GradesErrors.NOT_ENROLLED;
      }

      return {
        submission: {
          id: submission.id,
          content_text: submission.content_text,
          content_link: submission.content_link,
          submitted_at: submission.submitted_at,
          is_late: submission.is_late,
        },
        grading: {
          score: submission.score,
          feedback: submission.feedback,
          status: submission.status,
        },
        assignment: {
          title: submission.assignments.title,
          weight: submission.assignments.weight || 0,
          due_date: submission.assignments.due_date,
        },
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw GradesErrors.FEEDBACK_NOT_FOUND;
    }
  }

  /**
   * 진도율 조회
   */
  async getProgress(courseId: string, userId: string): Promise<number> {
    try {
      // 수강 권한 확인
      const { data: enrollment } = await this.supabase
        .from('enrollments')
        .select('progress')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      if (!enrollment) {
        throw GradesErrors.NOT_ENROLLED;
      }

      return enrollment.progress || 0;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      return 0;
    }
  }

  /**
   * 전체 성적표 생성
   */
  async generateTranscript(userId: string): Promise<Transcript> {
    try {
      // 사용자 정보 조회
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('id, name, email')
        .eq('id', userId)
        .single();

      if (!profile) {
        throw GradesErrors.GRADES_FETCH_FAILED;
      }

      // 수강 중인 코스 목록 조회
      const { data: enrollments } = await this.supabase
        .from('enrollments')
        .select(`
          course_id,
          enrolled_at,
          courses!inner (
            id,
            title,
            profiles!instructor_id (
              name
            )
          )
        `)
        .eq('user_id', userId);

      if (!enrollments) {
        return {
          student: {
            id: profile.id,
            name: profile.name,
            email: profile.email,
          },
          courses: [],
          generatedAt: new Date().toISOString(),
        };
      }

      // 각 코스의 성적 계산
      const coursesWithGrades = await Promise.all(
        enrollments.map(async (enrollment) => {
          const grades = await this.getCourseGrades(enrollment.course_id, userId);
          const course = enrollment.courses as any;
          const instructor = course.profiles as any;

          return {
            id: course.id,
            title: course.title,
            instructor: instructor?.name || 'Unknown',
            totalScore: grades.summary.total_score,
            letterGrade: grades.summary.letter_grade,
            completionDate: grades.summary.graded_count === grades.assignments.length
              ? new Date().toISOString()
              : null,
          };
        })
      );

      return {
        student: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
        },
        courses: coursesWithGrades,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw GradesErrors.GRADES_FETCH_FAILED;
    }
  }

  /**
   * 코스 성적 요약
   */
  async getCourseSummary(courseId: string, userId: string): Promise<GradeSummary> {
    try {
      const grades = await this.getCourseGrades(courseId, userId);

      // 코스 정보 조회
      const { data: course } = await this.supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single();

      return {
        courseId,
        courseName: course?.title || 'Unknown Course',
        totalScore: grades.summary.total_score,
        letterGrade: grades.summary.letter_grade,
        progress: this.calculateProgress(
          grades.assignments.length,
          grades.summary.submitted_count
        ),
        assignments: grades.assignments.map(a => ({
          id: a.id,
          title: a.title,
          score: a.submission?.score || null,
          weight: a.weight,
          status: this.getAssignmentStatus(a.submission),
        })),
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw GradesErrors.GRADES_FETCH_FAILED;
    }
  }

  /**
   * 성적 요약 계산
   */
  private calculateSummary(assignments: any[]): any {
    const submitted = assignments.filter(a => a.submission);
    const graded = submitted.filter(a => a.submission?.score !== null);
    const pending = submitted.filter(a => a.submission?.status === 'submitted');

    // 가중 평균 계산
    let totalScore = 0;
    let totalWeight = 0;

    graded.forEach(assignment => {
      const score = assignment.submission?.score || 0;
      const weight = assignment.weight || 0;
      totalScore += score * weight;
      totalWeight += weight;
    });

    const averageScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    return {
      total_score: Math.round(averageScore * 10) / 10,
      submitted_count: submitted.length,
      graded_count: graded.length,
      pending_count: pending.length,
      average_score: averageScore,
      letter_grade: this.getLetterGrade(averageScore),
    };
  }

  /**
   * 레터 등급 계산
   */
  private getLetterGrade(score: number): string {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 65) return 'D+';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * 진도 계산
   */
  private calculateProgress(total: number, submitted: number): number {
    if (total === 0) return 0;
    return Math.round((submitted / total) * 100);
  }

  /**
   * 과제 상태 결정
   */
  private getAssignmentStatus(submission: any): 'not_submitted' | 'submitted' | 'graded' | 'resubmission_required' {
    if (!submission) return 'not_submitted';
    if (submission.status === 'graded') return 'graded';
    if (submission.status === 'resubmission_required') return 'resubmission_required';
    return 'submitted';
  }
}