import { SupabaseClient } from '@supabase/supabase-js';
import { CourseErrors } from './error';
import type {
  CourseListQuery,
  CourseResponse,
  CourseDetail,
  CourseListResponse
} from './schema';

export class CourseService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * 코스 목록 조회 (필터링/정렬)
   */
  async listCourses(query: CourseListQuery): Promise<CourseListResponse> {
    try {
      let supabaseQuery = this.supabase
        .from('courses')
        .select('*, profiles!courses_instructor_id_fkey(name)', { count: 'exact' })
        .eq('status', 'published');

      // 카테고리 필터
      if (query.category) {
        supabaseQuery = supabaseQuery.eq('category', query.category);
      }

      // 난이도 필터
      if (query.difficulty) {
        supabaseQuery = supabaseQuery.eq('difficulty', query.difficulty);
      }

      // 검색
      if (query.search) {
        supabaseQuery = supabaseQuery.or(
          `title.ilike.%${query.search}%,description.ilike.%${query.search}%`
        );
      }

      // 정렬
      if (query.sort === 'popular') {
        // 수강생 수로 정렬 (enrollments 테이블과 조인 필요)
        const { data: popularCourses, error: popularError, count } = await this.supabase
          .from('courses')
          .select(`
            *,
            profiles!courses_instructor_id_fkey(name),
            enrollments(count)
          `, { count: 'exact' })
          .eq('status', 'published')
          .order('enrollments_count', { ascending: false })
          .range((query.page - 1) * query.limit, query.page * query.limit - 1);

        if (popularError) {
          console.error('Popular courses fetch error:', popularError);
          throw CourseErrors.COURSE_LIST_FETCH_FAILED;
        }

        return this.formatCourseListResponse(
          popularCourses || [],
          count || 0,
          query.page,
          query.limit
        );
      } else {
        // 최신순 정렬
        supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
      }

      // 페이지네이션
      const start = (query.page - 1) * query.limit;
      const end = start + query.limit - 1;
      supabaseQuery = supabaseQuery.range(start, end);

      const { data, error, count } = await supabaseQuery;

      if (error) {
        console.error('Course list fetch error:', error);
        throw CourseErrors.COURSE_LIST_FETCH_FAILED;
      }

      return this.formatCourseListResponse(
        data || [],
        count || 0,
        query.page,
        query.limit
      );
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw CourseErrors.COURSE_LIST_FETCH_FAILED;
    }
  }

  /**
   * 코스 상세 조회
   */
  async getCourseById(courseId: string, userId?: string): Promise<CourseDetail> {
    try {
      const { data: course, error } = await this.supabase
        .from('courses')
        .select(`
          *,
          profiles!courses_instructor_id_fkey(name)
        `)
        .eq('id', courseId)
        .single();

      if (error || !course) {
        throw CourseErrors.COURSE_NOT_FOUND;
      }

      // published가 아닌 경우 접근 제한 (단, 코스 소유자는 예외)
      const isOwner = userId && course.instructor_id === userId;
      if (course.status !== 'published' && !isOwner) {
        throw CourseErrors.COURSE_NOT_PUBLISHED;
      }

      // 수강 여부 확인
      let isEnrolled = false;
      if (userId) {
        const { data: enrollment } = await this.supabase
          .from('enrollments')
          .select('id')
          .eq('course_id', courseId)
          .eq('user_id', userId)
          .single();

        isEnrolled = !!enrollment;
      }

      // 수강생 수 조회
      const { count: enrollmentCount } = await this.supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);

      return {
        id: course.id,
        instructorId: course.instructor_id,
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        status: course.status,
        createdAt: course.created_at,
        updatedAt: course.updated_at,
        instructorName: course.profiles?.name,
        enrollmentCount: enrollmentCount || 0,
        averageRating: 4.5, // 모의 데이터
        isEnrolled,
        curriculum: [] // TODO: 커리큘럼 데이터 추가
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw CourseErrors.COURSE_NOT_FOUND;
    }
  }

  /**
   * 코스 통계 조회
   */
  async getCourseStats(courseId: string): Promise<{
    enrollmentCount: number;
    averageRating: number;
  }> {
    try {
      const { count } = await this.supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);

      return {
        enrollmentCount: count || 0,
        averageRating: 4.5 // 모의 데이터
      };
    } catch (error) {
      console.error('Course stats fetch error:', error);
      return {
        enrollmentCount: 0,
        averageRating: 0
      };
    }
  }

  /**
   * 강사의 코스 목록 조회
   */
  async getInstructorCourses(instructorId: string) {
    try {
      const { data, error } = await this.supabase
        .from('courses')
        .select(`
          *,
          enrollments(count)
        `)
        .eq('instructor_id', instructorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Instructor courses fetch error:', error);
        throw CourseErrors.COURSE_LIST_FETCH_FAILED;
      }

      // 통계 계산
      const coursesWithStats = await Promise.all((data || []).map(async (course) => {
        // 미채점 제출물 수 계산
        const { data: assignments } = await this.supabase
          .from('assignments')
          .select('id')
          .eq('course_id', course.id);

        let pendingGrading = 0;
        if (assignments && assignments.length > 0) {
          const assignmentIds = assignments.map(a => a.id);
          const { count } = await this.supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .in('assignment_id', assignmentIds)
            .eq('status', 'submitted');

          pendingGrading = count || 0;
        }

        return {
          ...course,
          studentCount: course.enrollments?.[0]?.count || 0,
          pendingGrading
        };
      }));

      return coursesWithStats;
    } catch (error) {
      console.error('Get instructor courses error:', error);
      throw error;
    }
  }

  /**
   * 코스 생성
   */
  async createCourse(instructorId: string, data: {
    title: string;
    description?: string;
    category?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  }) {
    try {
      const { data: course, error } = await this.supabase
        .from('courses')
        .insert({
          ...data,
          instructor_id: instructorId,
          status: 'draft'
        })
        .select()
        .single();

      if (error) {
        console.error('Course creation error:', error);
        throw CourseErrors.COURSE_CREATE_FAILED;
      }

      return course;
    } catch (error) {
      console.error('Create course error:', error);
      throw error;
    }
  }

  /**
   * 코스 업데이트
   */
  async updateCourse(courseId: string, instructorId: string, data: {
    title?: string;
    description?: string;
    category?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  }) {
    try {
      // 소유권 확인
      const { data: course } = await this.supabase
        .from('courses')
        .select('instructor_id')
        .eq('id', courseId)
        .single();

      if (!course || course.instructor_id !== instructorId) {
        throw CourseErrors.UNAUTHORIZED_ACCESS;
      }

      const { data: updated, error } = await this.supabase
        .from('courses')
        .update(data)
        .eq('id', courseId)
        .select()
        .single();

      if (error) {
        console.error('Course update error:', error);
        throw CourseErrors.COURSE_UPDATE_FAILED;
      }

      return updated;
    } catch (error) {
      console.error('Update course error:', error);
      throw error;
    }
  }

  /**
   * 코스 게시
   */
  async publishCourse(courseId: string, instructorId: string) {
    try {
      // 소유권 확인
      const { data: course } = await this.supabase
        .from('courses')
        .select('instructor_id')
        .eq('id', courseId)
        .single();

      if (!course || course.instructor_id !== instructorId) {
        throw CourseErrors.UNAUTHORIZED_ACCESS;
      }

      // 과제가 있는지 확인
      const { count: assignmentCount } = await this.supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);

      if (!assignmentCount || assignmentCount === 0) {
        throw new Error('코스에 최소 1개 이상의 과제가 필요합니다');
      }

      const { error } = await this.supabase
        .from('courses')
        .update({ status: 'published' })
        .eq('id', courseId);

      if (error) {
        console.error('Course publish error:', error);
        throw CourseErrors.COURSE_PUBLISH_FAILED;
      }
    } catch (error) {
      console.error('Publish course error:', error);
      throw error;
    }
  }

  /**
   * 코스 아카이브
   */
  async archiveCourse(courseId: string, instructorId: string) {
    try {
      // 소유권 확인
      const { data: course } = await this.supabase
        .from('courses')
        .select('instructor_id')
        .eq('id', courseId)
        .single();

      if (!course || course.instructor_id !== instructorId) {
        throw CourseErrors.UNAUTHORIZED_ACCESS;
      }

      const { error } = await this.supabase
        .from('courses')
        .update({ status: 'archived' })
        .eq('id', courseId);

      if (error) {
        console.error('Course archive error:', error);
        throw CourseErrors.COURSE_ARCHIVE_FAILED;
      }
    } catch (error) {
      console.error('Archive course error:', error);
      throw error;
    }
  }

  /**
   * 응답 포맷팅 헬퍼
   */
  private formatCourseListResponse(
    courses: any[],
    total: number,
    page: number,
    limit: number
  ): CourseListResponse {
    const formattedCourses: CourseResponse[] = courses.map(course => ({
      id: course.id,
      instructorId: course.instructor_id,
      title: course.title,
      description: course.description,
      category: course.category,
      difficulty: course.difficulty,
      status: course.status,
      createdAt: course.created_at,
      updatedAt: course.updated_at,
      instructorName: course.profiles?.name,
      enrollmentCount: course.enrollments?.length || 0,
      averageRating: 4.5 // 모의 데이터
    }));

    return {
      courses: formattedCourses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}