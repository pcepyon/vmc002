import { SupabaseClient } from '@supabase/supabase-js'
import {
  LearnerDashboardResponse,
  InstructorDashboardResponse
} from './schema'

export class DashboardService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get learner dashboard data
   */
  async getLearnerDashboard(userId: string): Promise<LearnerDashboardResponse> {
    try {
      // Fetch enrolled courses with progress
      const { data: enrollments, error: enrollmentsError } = await this.supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(
            *,
            instructor:profiles!courses_instructor_id_fkey(name)
          )
        `)
        .eq('user_id', userId)
        .order('enrolled_at', { ascending: false })

      if (enrollmentsError) throw enrollmentsError

      // Fetch upcoming assignment deadlines
      const { data: assignments, error: assignmentsError } = await this.supabase
        .from('assignments')
        .select(`
          *,
          course:courses(id, title),
          submissions(*)
        `)
        .in('course_id', enrollments?.map(e => e.course.id) || [])
        .eq('status', 'published')
        .gte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(10)

      if (assignmentsError) throw assignmentsError

      // Fetch recent feedback (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: recentSubmissions, error: submissionsError } = await this.supabase
        .from('submissions')
        .select(`
          *,
          assignment:assignments(
            id,
            title,
            course:courses(id, title)
          )
        `)
        .eq('user_id', userId)
        .in('status', ['graded', 'resubmission_required'])
        .gte('updated_at', sevenDaysAgo.toISOString())
        .order('updated_at', { ascending: false })
        .limit(10)

      if (submissionsError) throw submissionsError

      // Calculate overall progress and stats
      const { data: allSubmissions } = await this.supabase
        .from('submissions')
        .select('score, status')
        .eq('user_id', userId)

      const stats = this.calculateLearnerStats(allSubmissions || [])

      // Transform data to match schema
      const enrolledCourses = enrollments?.map(e => ({
        id: e.course.id,
        title: e.course.title,
        description: e.course.description,
        category: e.course.category,
        difficulty: e.course.difficulty,
        status: e.course.status,
        instructor_id: e.course.instructor_id,
        instructor_name: e.course.instructor?.name,
        created_at: e.course.created_at,
        updated_at: e.course.updated_at,
        progress: e.progress || 0,
        enrolled_at: e.enrolled_at,
      })) || []

      const upcomingDeadlines = assignments?.map(a => {
        const userSubmission = a.submissions?.find((s: any) => s.user_id === userId)
        return {
          assignment_id: a.id,
          assignment_title: a.title,
          course_id: a.course.id,
          course_title: a.course.title,
          due_date: a.due_date,
          weight: a.weight,
          status: a.status,
          submission_status: userSubmission
            ? userSubmission.status
            : 'not_submitted' as const,
          is_late: userSubmission?.is_late || false,
        }
      }) || []

      const recentFeedback = recentSubmissions?.map(s => ({
        submission_id: s.id,
        assignment_id: s.assignment.id,
        assignment_title: s.assignment.title,
        course_id: s.assignment.course.id,
        course_title: s.assignment.course.title,
        score: s.score,
        feedback: s.feedback,
        graded_at: s.updated_at,
        status: s.status,
      })) || []

      const overallProgress = enrolledCourses.length > 0
        ? Math.round(
            enrolledCourses.reduce((sum, course) => sum + (course.progress || 0), 0) /
            enrolledCourses.length
          )
        : 0

      return {
        enrolled_courses: enrolledCourses,
        upcoming_deadlines: upcomingDeadlines,
        recent_feedback: recentFeedback,
        overall_progress: overallProgress,
        stats,
      }
    } catch (error) {
      console.error('Error fetching learner dashboard:', error)
      throw new Error('Failed to fetch learner dashboard data')
    }
  }

  /**
   * Get instructor dashboard data
   */
  async getInstructorDashboard(instructorId: string): Promise<InstructorDashboardResponse> {
    try {
      // Fetch instructor's courses
      const { data: courses, error: coursesError } = await this.supabase
        .from('courses')
        .select(`
          *,
          enrollments(count)
        `)
        .eq('instructor_id', instructorId)
        .order('created_at', { ascending: false })

      if (coursesError) throw coursesError

      // Fetch pending submissions for instructor's courses
      const courseIds = courses?.map(c => c.id) || []

      const { data: pendingSubmissions, error: pendingError } = await this.supabase
        .from('submissions')
        .select(`
          *,
          assignment:assignments(
            id,
            title,
            course:courses(id, title)
          ),
          user:profiles(id, name)
        `)
        .in('assignment.course_id', courseIds)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: true })
        .limit(20)

      if (pendingError) throw pendingError

      // Fetch recent activities
      const activities = await this.getRecentActivities(courseIds)

      // Calculate statistics
      const statistics = await this.calculateInstructorStats(instructorId, courses || [])

      // Transform data to match schema
      const myCourses = courses?.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        difficulty: c.difficulty,
        status: c.status,
        instructor_id: c.instructor_id,
        created_at: c.created_at,
        updated_at: c.updated_at,
        student_count: c.enrollments?.[0]?.count || 0,
      })) || []

      const pendingSubmissionsList = pendingSubmissions?.map(s => ({
        submission_id: s.id,
        assignment_id: s.assignment.id,
        assignment_title: s.assignment.title,
        course_id: s.assignment.course.id,
        course_title: s.assignment.course.title,
        user_id: s.user_id,
        learner_name: s.user?.name || 'Unknown',
        submitted_at: s.submitted_at,
        is_late: s.is_late,
        status: s.status,
        content_text: s.content_text,
        content_link: s.content_link,
      })) || []

      return {
        my_courses: myCourses,
        pending_submissions: pendingSubmissionsList,
        recent_activities: activities,
        statistics,
      }
    } catch (error) {
      console.error('Error fetching instructor dashboard:', error)
      throw new Error('Failed to fetch instructor dashboard data')
    }
  }

  /**
   * Calculate learner statistics
   */
  private calculateLearnerStats(submissions: any[]) {
    const completedCount = submissions.filter(s => s.status === 'graded').length
    const pendingCount = submissions.filter(s => s.status === 'submitted').length
    const scores = submissions
      .filter(s => s.score !== null)
      .map(s => s.score)

    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : null

    return {
      total_courses: 0, // Will be set from enrolled courses
      completed_assignments: completedCount,
      pending_assignments: pendingCount,
      average_score: averageScore,
    }
  }

  /**
   * Get recent activities for instructor
   */
  private async getRecentActivities(courseIds: string[]) {
    const activities = []

    // Get recent enrollments
    const { data: recentEnrollments } = await this.supabase
      .from('enrollments')
      .select(`
        *,
        user:profiles(name),
        course:courses(title)
      `)
      .in('course_id', courseIds)
      .order('enrolled_at', { ascending: false })
      .limit(5)

    if (recentEnrollments) {
      activities.push(...recentEnrollments.map(e => ({
        id: e.id,
        type: 'enrollment' as const,
        title: 'New enrollment',
        description: `${e.user?.name || 'A student'} enrolled in ${e.course?.title}`,
        user_name: e.user?.name,
        timestamp: e.enrolled_at,
        metadata: { course_id: e.course_id },
      })))
    }

    // Get recent submissions
    const { data: recentSubmissions } = await this.supabase
      .from('submissions')
      .select(`
        *,
        user:profiles(name),
        assignment:assignments(
          title,
          course:courses(title)
        )
      `)
      .in('assignment.course_id', courseIds)
      .order('submitted_at', { ascending: false })
      .limit(5)

    if (recentSubmissions) {
      activities.push(...recentSubmissions.map(s => ({
        id: s.id,
        type: 'submission' as const,
        title: 'New submission',
        description: `${s.user?.name || 'A student'} submitted ${s.assignment?.title}`,
        user_name: s.user?.name,
        timestamp: s.submitted_at,
        metadata: {
          assignment_id: s.assignment_id,
          submission_id: s.id,
        },
      })))
    }

    // Sort all activities by timestamp
    activities.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return activities.slice(0, 10)
  }

  /**
   * Calculate instructor statistics
   */
  private async calculateInstructorStats(instructorId: string, courses: any[]) {
    // Get total student count
    const { data: enrollmentCount } = await this.supabase
      .from('enrollments')
      .select('user_id', { count: 'exact' })
      .in('course_id', courses.map(c => c.id))

    // Get all submissions for instructor's courses
    const { data: allSubmissions } = await this.supabase
      .from('submissions')
      .select(`
        score,
        status,
        assignment:assignments(course_id)
      `)
      .in('assignment.course_id', courses.map(c => c.id))

    const scores = allSubmissions
      ?.filter(s => s.score !== null)
      .map(s => s.score) || []

    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : null

    const pendingCount = allSubmissions?.filter(s => s.status === 'submitted').length || 0

    // Get total assignments
    const { data: totalAssignments } = await this.supabase
      .from('assignments')
      .select('id', { count: 'exact' })
      .in('course_id', courses.map(c => c.id))
      .eq('status', 'published')

    const submissionRate = totalAssignments?.length && enrollmentCount?.length
      ? Math.round((allSubmissions?.length || 0) / (totalAssignments.length * enrollmentCount.length) * 100)
      : 0

    const coursesByStatus = {
      draft: courses.filter(c => c.status === 'draft').length,
      published: courses.filter(c => c.status === 'published').length,
      archived: courses.filter(c => c.status === 'archived').length,
    }

    return {
      total_students: enrollmentCount?.length || 0,
      total_courses: courses.length,
      active_courses: coursesByStatus.published,
      pending_submissions: pendingCount,
      average_score: averageScore,
      submission_rate: submissionRate,
      courses_by_status: coursesByStatus,
    }
  }
}

// Export service factory
export const createDashboardService = (supabase: SupabaseClient) => {
  return new DashboardService(supabase)
}