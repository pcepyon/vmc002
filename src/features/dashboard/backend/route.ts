import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { AppEnv } from '@/backend/hono/context'
import { success, failure } from '@/backend/http/response'
import { AppError } from '@/backend/http/error'
import { createDashboardService } from './service'
import {
  DashboardRequestSchema,
  LearnerDashboardResponseSchema,
  InstructorDashboardResponseSchema
} from './schema'

export const dashboardRoutes = new Hono<AppEnv>()
  // Learner Dashboard
  .get(
    '/learner',
    zValidator('query', DashboardRequestSchema),
    async (c) => {
      try {
        const supabase = c.get('supabase')
        const logger = c.get('logger')

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          logger.error('Authentication failed', authError)
          return failure(c, new AppError('UNAUTHORIZED', 'Authentication required', 401))
        }

        // Check if user is a learner
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileError || !profile) {
          logger.error('Profile fetch failed', profileError)
          return failure(c, new AppError('PROFILE_NOT_FOUND', 'User profile not found', 404))
        }

        if (profile.role !== 'learner') {
          return failure(c, new AppError('FORBIDDEN', 'Access denied. Learner role required', 403))
        }

        // Get dashboard data
        const dashboardService = createDashboardService(supabase)
        const dashboardData = await dashboardService.getLearnerDashboard(user.id)

        // Update stats with total courses count
        dashboardData.stats.total_courses = dashboardData.enrolled_courses.length

        // Validate response
        const validatedData = LearnerDashboardResponseSchema.parse(dashboardData)

        logger.info(`Learner dashboard fetched for user ${user.id}`)
        return success(c, validatedData)

      } catch (error) {
        const logger = c.get('logger')
        logger.error('Failed to fetch learner dashboard', error)

        if (error instanceof Error) {
          return failure(c, new AppError('DASHBOARD_ERROR', error.message, 500))
        }

        return failure(c, new AppError('INTERNAL_ERROR', 'Failed to fetch dashboard data', 500))
      }
    }
  )

  // Instructor Dashboard
  .get(
    '/instructor',
    zValidator('query', DashboardRequestSchema),
    async (c) => {
      try {
        const supabase = c.get('supabase')
        const logger = c.get('logger')

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          logger.error('Authentication failed', authError)
          return failure(c, new AppError('UNAUTHORIZED', 'Authentication required', 401))
        }

        // Check if user is an instructor
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileError || !profile) {
          logger.error('Profile fetch failed', profileError)
          return failure(c, new AppError('PROFILE_NOT_FOUND', 'User profile not found', 404))
        }

        if (profile.role !== 'instructor') {
          return failure(c, new AppError('FORBIDDEN', 'Access denied. Instructor role required', 403))
        }

        // Get dashboard data
        const dashboardService = createDashboardService(supabase)
        const dashboardData = await dashboardService.getInstructorDashboard(user.id)

        // Validate response
        const validatedData = InstructorDashboardResponseSchema.parse(dashboardData)

        logger.info(`Instructor dashboard fetched for user ${user.id}`)
        return success(c, validatedData)

      } catch (error) {
        const logger = c.get('logger')
        logger.error('Failed to fetch instructor dashboard', error)

        if (error instanceof Error) {
          return failure(c, new AppError('DASHBOARD_ERROR', error.message, 500))
        }

        return failure(c, new AppError('INTERNAL_ERROR', 'Failed to fetch dashboard data', 500))
      }
    }
  )

  // Generic dashboard endpoint that redirects based on role
  .get(
    '/',
    async (c) => {
      try {
        const supabase = c.get('supabase')
        const logger = c.get('logger')

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          logger.error('Authentication failed', authError)
          return failure(c, new AppError('UNAUTHORIZED', 'Authentication required', 401))
        }

        // Get user role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileError || !profile) {
          logger.error('Profile fetch failed', profileError)
          return failure(c, new AppError('PROFILE_NOT_FOUND', 'User profile not found', 404))
        }

        // Return role information for frontend to handle redirect
        return success(
          c,
          {
            role: profile.role,
            redirect_url: profile.role === 'learner'
              ? '/dashboard/learner'
              : '/dashboard/instructor'
          }
        )

      } catch (error) {
        const logger = c.get('logger')
        logger.error('Failed to fetch user role', error)

        return failure(c, new AppError('INTERNAL_ERROR', 'Failed to fetch user role', 500))
      }
    }
  )

// Export the routes
export default dashboardRoutes