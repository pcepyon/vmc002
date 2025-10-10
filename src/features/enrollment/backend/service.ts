import { SupabaseClient } from '@supabase/supabase-js';
import { EnrollmentErrors } from './error';
import type {
  EnrollmentResponse,
  MyEnrollment,
  EnrollmentStatus
} from './schema';

export class EnrollmentService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * 수강신청 처리
   */
  async enrollInCourse(userId: string, courseId: string): Promise<EnrollmentResponse> {
    try {
      // 사용자 역할 확인
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (!profile || profile.role !== 'learner') {
        throw EnrollmentErrors.UNAUTHORIZED_ENROLLMENT;
      }

      // 코스 상태 확인
      const { data: course } = await this.supabase
        .from('courses')
        .select('status')
        .eq('id', courseId)
        .single();

      if (!course || course.status !== 'published') {
        throw EnrollmentErrors.COURSE_NOT_AVAILABLE;
      }

      // 기존 수강 여부 확인
      const { data: existingEnrollment } = await this.supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      if (existingEnrollment) {
        throw EnrollmentErrors.ALREADY_ENROLLED;
      }

      // 수강신청 생성
      const { data: enrollment, error } = await this.supabase
        .from('enrollments')
        .insert({
          user_id: userId,
          course_id: courseId
        })
        .select()
        .single();

      if (error || !enrollment) {
        console.error('Enrollment creation error:', error);
        throw EnrollmentErrors.ENROLLMENT_FAILED;
      }

      return {
        id: enrollment.id,
        userId: enrollment.user_id,
        courseId: enrollment.course_id,
        enrolledAt: enrollment.enrolled_at,
        progress: enrollment.progress || 0
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw EnrollmentErrors.ENROLLMENT_FAILED;
    }
  }

  /**
   * 수강 상태 확인
   */
  async checkEnrollmentStatus(userId: string, courseId: string): Promise<EnrollmentStatus> {
    try {
      const { data: enrollment } = await this.supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      if (!enrollment) {
        return {
          isEnrolled: false,
          enrollment: null
        };
      }

      return {
        isEnrolled: true,
        enrollment: {
          id: enrollment.id,
          userId: enrollment.user_id,
          courseId: enrollment.course_id,
          enrolledAt: enrollment.enrolled_at,
          progress: enrollment.progress || 0
        }
      };
    } catch (error) {
      return {
        isEnrolled: false,
        enrollment: null
      };
    }
  }

  /**
   * 수강취소 처리
   */
  async unenrollFromCourse(userId: string, courseId: string): Promise<void> {
    try {
      // 수강 정보 확인
      const { data: enrollment } = await this.supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      if (!enrollment) {
        throw EnrollmentErrors.ENROLLMENT_NOT_FOUND;
      }

      // 수강 취소 (삭제)
      const { error } = await this.supabase
        .from('enrollments')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId);

      if (error) {
        console.error('Unenrollment error:', error);
        throw EnrollmentErrors.UNENROLLMENT_FAILED;
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw EnrollmentErrors.UNENROLLMENT_FAILED;
    }
  }

  /**
   * 내 수강 목록 조회
   */
  async getMyEnrollments(userId: string): Promise<MyEnrollment[]> {
    try {
      const { data: enrollments, error } = await this.supabase
        .from('enrollments')
        .select(`
          *,
          courses!enrollments_course_id_fkey (
            id,
            title,
            description,
            category,
            difficulty,
            profiles!courses_instructor_id_fkey (name)
          )
        `)
        .eq('user_id', userId)
        .order('enrolled_at', { ascending: false });

      if (error) {
        console.error('My enrollments fetch error:', error);
        return [];
      }

      if (!enrollments) {
        return [];
      }

      return enrollments.map(enrollment => ({
        id: enrollment.id,
        courseId: enrollment.course_id,
        enrolledAt: enrollment.enrolled_at,
        progress: enrollment.progress || 0,
        course: {
          id: enrollment.courses.id,
          title: enrollment.courses.title,
          description: enrollment.courses.description,
          category: enrollment.courses.category,
          difficulty: enrollment.courses.difficulty,
          instructorName: enrollment.courses.profiles?.name
        }
      }));
    } catch (error) {
      console.error('Get my enrollments error:', error);
      return [];
    }
  }

  /**
   * 수강 중인 코스와 진행률 조회
   */
  async getMyCoursesWithProgress(userId: string) {
    try {
      const { data: enrollments, error } = await this.supabase
        .from('enrollments')
        .select(`
          *,
          courses!enrollments_course_id_fkey (
            id,
            title,
            description,
            instructor_id,
            status,
            profiles!courses_instructor_id_fkey(name)
          )
        `)
        .eq('user_id', userId)
        .order('enrolled_at', { ascending: false });

      if (error) {
        console.error('My courses fetch error:', error);
        return [];
      }

      if (!enrollments) {
        return [];
      }

      // 각 코스별 진행률 계산
      const coursesWithProgress = await Promise.all(
        enrollments.map(async (enrollment) => {
          const progress = await this.calculateCourseProgress(
            enrollment.course_id,
            userId
          );
          const nextAssignment = await this.getNextAssignment(enrollment.course_id, userId);

          return {
            ...enrollment,
            progress,
            nextAssignment
          };
        })
      );

      return coursesWithProgress;
    } catch (error) {
      console.error('Get my courses with progress error:', error);
      return [];
    }
  }

  /**
   * 코스 진행률 계산
   */
  async calculateCourseProgress(courseId: string, userId: string): Promise<number> {
    try {
      // 전체 과제 수
      const { count: totalAssignments } = await this.supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId)
        .eq('status', 'published');

      // 제출된 과제 수
      const { data: assignments } = await this.supabase
        .from('assignments')
        .select('id')
        .eq('course_id', courseId)
        .eq('status', 'published');

      if (!assignments || assignments.length === 0) {
        return 0;
      }

      const assignmentIds = assignments.map(a => a.id);

      const { count: submittedAssignments } = await this.supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('assignment_id', assignmentIds);

      if (!totalAssignments || totalAssignments === 0) return 0;

      return Math.round((submittedAssignments! / totalAssignments) * 100);
    } catch (error) {
      console.error('Calculate progress error:', error);
      return 0;
    }
  }

  /**
   * 다음 과제 정보 조회
   */
  async getNextAssignment(courseId: string, userId: string) {
    try {
      const { data } = await this.supabase
        .from('assignments')
        .select('id, title, due_date')
        .eq('course_id', courseId)
        .eq('status', 'published')
        .gt('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(1)
        .single();

      return data;
    } catch (error) {
      // 다음 과제가 없는 경우는 에러가 아님
      return null;
    }
  }

  /**
   * 특정 수강 코스 상세 조회
   */
  async getCourseDetailForStudent(courseId: string, userId: string) {
    try {
      // 수강 여부 확인
      const { data: enrollment } = await this.supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      if (!enrollment) {
        throw EnrollmentErrors.ENROLLMENT_NOT_FOUND;
      }

      // 코스 정보 조회
      const { data: course } = await this.supabase
        .from('courses')
        .select(`
          *,
          profiles!courses_instructor_id_fkey(name, email)
        `)
        .eq('id', courseId)
        .single();

      if (!course) {
        throw EnrollmentErrors.COURSE_NOT_AVAILABLE;
      }

      // 과제 목록 조회
      const { data: assignments } = await this.supabase
        .from('assignments')
        .select(`
          *,
          submissions!left(
            id,
            status,
            score,
            submitted_at,
            is_late
          )
        `)
        .eq('course_id', courseId)
        .eq('status', 'published')
        .order('due_date', { ascending: true });

      // 사용자의 제출물만 필터링
      const userAssignments = assignments?.map(assignment => ({
        ...assignment,
        submission: assignment.submissions?.find(
          (s: any) => s.user_id === userId
        ) || null
      }));

      // 진행률 계산
      const progress = await this.calculateCourseProgress(courseId, userId);

      // 현재 성적 계산
      const currentGrade = await this.calculateCurrentGrade(courseId, userId);

      return {
        enrollment,
        course: {
          ...course,
          instructorName: course.profiles?.name
        },
        assignments: userAssignments,
        progress,
        currentGrade,
        stats: {
          totalAssignments: assignments?.length || 0,
          completedAssignments: assignments?.filter(
            a => a.submissions?.some((s: any) => s.user_id === userId)
          ).length || 0
        }
      };
    } catch (error) {
      console.error('Get course detail error:', error);
      throw error;
    }
  }

  /**
   * 현재 성적 계산
   */
  async calculateCurrentGrade(courseId: string, userId: string): Promise<number> {
    try {
      const { data: assignments } = await this.supabase
        .from('assignments')
        .select(`
          id,
          weight,
          submissions!left(
            score,
            status
          )
        `)
        .eq('course_id', courseId)
        .eq('status', 'published');

      if (!assignments || assignments.length === 0) {
        return 0;
      }

      let totalWeight = 0;
      let weightedScore = 0;

      for (const assignment of assignments) {
        const submission = assignment.submissions?.find(
          (s: any) => s.user_id === userId && s.status === 'graded'
        );

        if (submission && submission.score !== null) {
          totalWeight += assignment.weight || 0;
          weightedScore += (submission.score * (assignment.weight || 0));
        }
      }

      if (totalWeight === 0) return 0;

      return Math.round(weightedScore / totalWeight);
    } catch (error) {
      console.error('Calculate grade error:', error);
      return 0;
    }
  }
}