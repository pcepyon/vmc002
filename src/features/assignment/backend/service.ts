import { SupabaseClient } from '@supabase/supabase-js';
import { AssignmentErrors } from './error';
import type {
  AssignmentResponse,
  AssignmentDetail,
  AssignmentListResponse,
  AssignmentAccess,
  CreateAssignmentInput,
  UpdateAssignmentInput
} from './schema';

export class AssignmentService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * 과제 상세 정보 조회
   */
  async getAssignmentById(assignmentId: string, userId: string): Promise<AssignmentDetail> {
    try {
      // 과제 정보 조회
      const { data: assignment, error } = await this.supabase
        .from('assignments')
        .select(`
          *,
          courses (
            id,
            title
          )
        `)
        .eq('id', assignmentId)
        .single();

      if (error || !assignment) {
        throw AssignmentErrors.ASSIGNMENT_NOT_FOUND;
      }

      // published 또는 closed 상태가 아닌 경우 404
      if (assignment.status === 'draft') {
        throw AssignmentErrors.ASSIGNMENT_NOT_PUBLISHED;
      }

      // 수강 권한 확인
      const { data: enrollment } = await this.supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', assignment.course_id)
        .single();

      if (!enrollment) {
        throw AssignmentErrors.NOT_ENROLLED_IN_COURSE;
      }

      // 제출물 정보 조회
      const { data: submission } = await this.supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('user_id', userId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      // 마감일 정보 계산
      const now = new Date();
      const dueDate = new Date(assignment.due_date);
      const isOverdue = now > dueDate;
      const canSubmit = assignment.status === 'published' && (!isOverdue || assignment.allow_late);
      const timeRemaining = this.calculateTimeRemaining(dueDate);

      return {
        id: assignment.id,
        courseId: assignment.course_id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.due_date,
        weight: assignment.weight || 0,
        allowLate: assignment.allow_late,
        allowResubmission: assignment.allow_resubmission,
        status: assignment.status,
        createdAt: assignment.created_at,
        updatedAt: assignment.updated_at,
        courseName: assignment.courses?.title,
        canSubmit,
        submissionStatus: {
          hasSubmitted: !!submission,
          submission: submission ? {
            id: submission.id,
            contentText: submission.content_text,
            contentLink: submission.content_link,
            submittedAt: submission.submitted_at,
            isLate: submission.is_late,
            score: submission.score,
            feedback: submission.feedback,
            status: submission.status,
            version: submission.version
          } : null
        },
        deadlineInfo: {
          isOverdue,
          timeRemaining: isOverdue ? null : timeRemaining,
          canSubmitLate: isOverdue && assignment.allow_late
        }
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw AssignmentErrors.ASSIGNMENT_FETCH_FAILED;
    }
  }

  /**
   * 코스별 과제 목록 조회
   */
  async listAssignmentsByCourse(courseId: string, userId: string): Promise<AssignmentListResponse> {
    try {
      // 수강 권한 확인
      const { data: enrollment } = await this.supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      if (!enrollment) {
        throw AssignmentErrors.NOT_ENROLLED_IN_COURSE;
      }

      // 과제 목록 조회 (published와 closed 상태만)
      const { data: assignments, error } = await this.supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .in('status', ['published', 'closed'])
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Assignment list fetch error:', error);
        throw AssignmentErrors.ASSIGNMENT_FETCH_FAILED;
      }

      // 각 과제에 대한 제출 상태 조회
      const assignmentsWithStatus = await Promise.all(
        (assignments || []).map(async (assignment) => {
          const { data: submission } = await this.supabase
            .from('submissions')
            .select('status')
            .eq('assignment_id', assignment.id)
            .eq('user_id', userId)
            .order('version', { ascending: false })
            .limit(1)
            .single();

          let submissionStatus: 'not_submitted' | 'submitted' | 'graded' | 'resubmission_required' = 'not_submitted';

          if (submission) {
            if (submission.status === 'graded') {
              submissionStatus = 'graded';
            } else if (submission.status === 'resubmission_required') {
              submissionStatus = 'resubmission_required';
            } else {
              submissionStatus = 'submitted';
            }
          }

          return {
            id: assignment.id,
            courseId: assignment.course_id,
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.due_date,
            weight: assignment.weight || 0,
            allowLate: assignment.allow_late,
            allowResubmission: assignment.allow_resubmission,
            status: assignment.status,
            createdAt: assignment.created_at,
            updatedAt: assignment.updated_at,
            submissionStatus
          };
        })
      );

      return {
        assignments: assignmentsWithStatus
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw AssignmentErrors.ASSIGNMENT_FETCH_FAILED;
    }
  }

  /**
   * 과제 접근 권한 확인
   */
  async checkAssignmentAccess(assignmentId: string, userId: string): Promise<AssignmentAccess> {
    try {
      // 과제 정보 조회
      const { data: assignment } = await this.supabase
        .from('assignments')
        .select('course_id, status')
        .eq('id', assignmentId)
        .single();

      if (!assignment) {
        return {
          hasAccess: false,
          isEnrolled: false,
          isPublished: false,
          reason: '과제를 찾을 수 없습니다'
        };
      }

      // 수강 권한 확인
      const { data: enrollment } = await this.supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', assignment.course_id)
        .single();

      const isEnrolled = !!enrollment;
      const isPublished = assignment.status !== 'draft';

      if (!isEnrolled) {
        return {
          hasAccess: false,
          isEnrolled: false,
          isPublished,
          reason: '수강 등록이 필요합니다'
        };
      }

      if (!isPublished) {
        return {
          hasAccess: false,
          isEnrolled: true,
          isPublished: false,
          reason: '과제가 공개되지 않았습니다'
        };
      }

      return {
        hasAccess: true,
        isEnrolled: true,
        isPublished: true
      };
    } catch (error) {
      return {
        hasAccess: false,
        isEnrolled: false,
        isPublished: false,
        reason: '권한 확인 중 오류가 발생했습니다'
      };
    }
  }

  /**
   * 남은 시간 계산
   */
  private calculateTimeRemaining(dueDate: Date): string {
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();

    if (diff <= 0) {
      return '마감됨';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}일 ${hours}시간 남음`;
    } else if (hours > 0) {
      return `${hours}시간 ${minutes}분 남음`;
    } else {
      return `${minutes}분 남음`;
    }
  }

  /**
   * 과제 생성 (강사 전용)
   */
  async createAssignment(courseId: string, instructorId: string, data: CreateAssignmentInput): Promise<AssignmentResponse> {
    try {
      // 코스 소유권 확인
      const { data: course } = await this.supabase
        .from('courses')
        .select('id, instructor_id')
        .eq('id', courseId)
        .eq('instructor_id', instructorId)
        .single();

      if (!course) {
        throw AssignmentErrors.COURSE_NOT_OWNED;
      }

      // 마감일 검증
      if (new Date(data.due_date) <= new Date()) {
        throw AssignmentErrors.INVALID_DUE_DATE;
      }

      // 과제 생성
      const { data: assignment, error } = await this.supabase
        .from('assignments')
        .insert({
          course_id: courseId,
          title: data.title,
          description: data.description || null,
          due_date: data.due_date,
          weight: data.weight || 0,
          allow_late: data.allow_late || false,
          allow_resubmission: data.allow_resubmission || false,
          status: 'draft'
        })
        .select()
        .single();

      if (error || !assignment) {
        throw AssignmentErrors.ASSIGNMENT_CREATE_FAILED;
      }

      return this.formatAssignmentResponse(assignment);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw AssignmentErrors.ASSIGNMENT_CREATE_FAILED;
    }
  }

  /**
   * 과제 수정 (강사 전용)
   */
  async updateAssignment(assignmentId: string, instructorId: string, data: UpdateAssignmentInput): Promise<AssignmentResponse> {
    try {
      // 과제 및 코스 소유권 확인
      const { data: assignment } = await this.supabase
        .from('assignments')
        .select(`
          *,
          courses!inner(instructor_id)
        `)
        .eq('id', assignmentId)
        .single();

      if (!assignment || assignment.courses.instructor_id !== instructorId) {
        throw AssignmentErrors.COURSE_NOT_OWNED;
      }

      // 게시된 과제는 제한적 수정만 가능
      if (assignment.status !== 'draft' && (data.title || data.due_date)) {
        throw AssignmentErrors.CANNOT_MODIFY_PUBLISHED;
      }

      // 마감일 검증
      if (data.due_date && new Date(data.due_date) <= new Date()) {
        throw AssignmentErrors.INVALID_DUE_DATE;
      }

      // 과제 업데이트
      const { data: updated, error } = await this.supabase
        .from('assignments')
        .update({
          ...(data.title && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.due_date && { due_date: data.due_date }),
          ...(data.weight !== undefined && { weight: data.weight }),
          ...(data.allow_late !== undefined && { allow_late: data.allow_late }),
          ...(data.allow_resubmission !== undefined && { allow_resubmission: data.allow_resubmission }),
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error || !updated) {
        throw AssignmentErrors.ASSIGNMENT_UPDATE_FAILED;
      }

      return this.formatAssignmentResponse(updated);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw AssignmentErrors.ASSIGNMENT_UPDATE_FAILED;
    }
  }

  /**
   * 과제 게시 (draft -> published)
   */
  async publishAssignment(assignmentId: string, instructorId: string): Promise<AssignmentResponse> {
    try {
      // 과제 정보 조회
      const { data: assignment, error: assignmentError } = await this.supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (assignmentError || !assignment) {
        throw AssignmentErrors.ASSIGNMENT_NOT_FOUND;
      }

      // 코스 정보 조회
      const { data: course, error: courseError } = await this.supabase
        .from('courses')
        .select('instructor_id, status')
        .eq('id', assignment.course_id)
        .single();

      if (courseError || !course) {
        throw AssignmentErrors.COURSE_NOT_OWNED;
      }

      // 소유권 확인
      if (course.instructor_id !== instructorId) {
        throw AssignmentErrors.COURSE_NOT_OWNED;
      }

      // 상태 전환 검증
      if (assignment.status !== 'draft') {
        throw AssignmentErrors.INVALID_STATUS_TRANSITION;
      }

      // 코스가 published 상태인지 확인
      if (course.status !== 'published') {
        throw new Error('코스가 게시되지 않았습니다');
      }

      // 마감일 검증 (경고만, 과거 날짜도 허용)
      const dueDate = new Date(assignment.due_date);
      const now = new Date();
      if (dueDate <= now) {
        // 과거 날짜지만 게시는 허용
        console.warn(`Warning: Publishing assignment ${assignmentId} with past due date: ${assignment.due_date}`);
      }

      // 상태 업데이트
      const { data: updated, error } = await this.supabase
        .from('assignments')
        .update({
          status: 'published',
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw new Error(`Failed to update assignment status: ${error.message || JSON.stringify(error)}`);
      }

      if (!updated) {
        throw new Error('No assignment returned after update');
      }

      return this.formatAssignmentResponse(updated);
    } catch (error) {
      console.error('publishAssignment error:', error);
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      if (error instanceof Error) {
        throw new Error(`Assignment publish failed: ${error.message}`);
      }
      throw AssignmentErrors.ASSIGNMENT_STATUS_CHANGE_FAILED;
    }
  }

  /**
   * 과제 마감 (published -> closed)
   */
  async closeAssignment(assignmentId: string, instructorId: string): Promise<AssignmentResponse> {
    try {
      // 과제 및 코스 소유권 확인
      const { data: assignment } = await this.supabase
        .from('assignments')
        .select(`
          *,
          courses!inner(instructor_id)
        `)
        .eq('id', assignmentId)
        .single();

      if (!assignment || assignment.courses.instructor_id !== instructorId) {
        throw AssignmentErrors.COURSE_NOT_OWNED;
      }

      // 상태 전환 검증
      if (assignment.status !== 'published') {
        throw AssignmentErrors.INVALID_STATUS_TRANSITION;
      }

      // 상태 업데이트
      const { data: updated, error } = await this.supabase
        .from('assignments')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error || !updated) {
        throw AssignmentErrors.ASSIGNMENT_STATUS_CHANGE_FAILED;
      }

      return this.formatAssignmentResponse(updated);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw AssignmentErrors.ASSIGNMENT_STATUS_CHANGE_FAILED;
    }
  }

  /**
   * 과제 삭제 (draft 상태만)
   */
  async deleteAssignment(assignmentId: string, instructorId: string): Promise<void> {
    try {
      // 과제 및 코스 소유권 확인
      const { data: assignment } = await this.supabase
        .from('assignments')
        .select(`
          *,
          courses!inner(instructor_id)
        `)
        .eq('id', assignmentId)
        .single();

      if (!assignment || assignment.courses.instructor_id !== instructorId) {
        throw AssignmentErrors.COURSE_NOT_OWNED;
      }

      // draft 상태만 삭제 가능
      if (assignment.status !== 'draft') {
        throw AssignmentErrors.CANNOT_MODIFY_PUBLISHED;
      }

      // 제출물 확인
      const { data: submissions } = await this.supabase
        .from('submissions')
        .select('id')
        .eq('assignment_id', assignmentId)
        .limit(1);

      if (submissions && submissions.length > 0) {
        throw AssignmentErrors.CANNOT_DELETE_WITH_SUBMISSIONS;
      }

      // 과제 삭제
      const { error } = await this.supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) {
        throw AssignmentErrors.ASSIGNMENT_DELETE_FAILED;
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw AssignmentErrors.ASSIGNMENT_DELETE_FAILED;
    }
  }

  /**
   * 강사용 - 관리 중인 과제 목록
   */
  async listManagedAssignments(courseId: string, instructorId: string): Promise<AssignmentListResponse> {
    try {
      // 코스 소유권 확인
      const { data: course } = await this.supabase
        .from('courses')
        .select('id')
        .eq('id', courseId)
        .eq('instructor_id', instructorId)
        .single();

      if (!course) {
        throw AssignmentErrors.COURSE_NOT_OWNED;
      }

      // 모든 과제 조회 (상태 무관)
      const { data: assignments, error } = await this.supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) {
        throw AssignmentErrors.ASSIGNMENT_FETCH_FAILED;
      }

      // 각 과제의 제출 통계 조회
      const assignmentsWithStats = await Promise.all(
        (assignments || []).map(async (assignment) => {
          const { data: submissions } = await this.supabase
            .from('submissions')
            .select('id, status')
            .eq('assignment_id', assignment.id);

          const totalSubmissions = submissions?.length || 0;
          const gradedCount = submissions?.filter(s => s.status === 'graded').length || 0;
          const pendingCount = submissions?.filter(s => s.status === 'submitted').length || 0;

          return {
            ...this.formatAssignmentResponse(assignment),
            stats: {
              totalSubmissions,
              gradedCount,
              pendingCount
            }
          };
        })
      );

      return {
        assignments: assignmentsWithStats
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw AssignmentErrors.ASSIGNMENT_FETCH_FAILED;
    }
  }

  /**
   * 과제 응답 포맷팅
   */
  private formatAssignmentResponse(assignment: any): AssignmentResponse {
    return {
      id: assignment.id,
      courseId: assignment.course_id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.due_date,
      weight: assignment.weight || 0,
      allowLate: assignment.allow_late,
      allowResubmission: assignment.allow_resubmission,
      status: assignment.status,
      createdAt: assignment.created_at,
      updatedAt: assignment.updated_at
    };
  }
}