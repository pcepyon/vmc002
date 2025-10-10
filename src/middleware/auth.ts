/**
 * Authentication and Authorization Middleware for Hono
 * Replaces RLS with application-level control as per AGENTS.md
 */

import { Context, Next } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { HTTPException } from 'hono/http-exception';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service client with admin privileges (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Extract and verify JWT token from request
 */
async function verifyToken(token: string) {
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      throw new Error('Invalid token');
    }
    return user;
  } catch (error) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }
}

/**
 * Authentication Middleware
 * Verifies JWT token and adds user to context
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing authorization token' });
  }

  const token = authHeader.split(' ')[1];
  const user = await verifyToken(token);

  // Fetch user role from database
  const { data: userData, error } = await supabaseAdmin
    .from('users')
    .select('id, email, role')
    .eq('id', user.id)
    .single();

  if (error || !userData) {
    throw new HTTPException(401, { message: 'User not found' });
  }

  // Add user to context for downstream handlers
  c.set('user', userData);

  await next();
}

/**
 * Role-based Authorization Middleware
 * Checks if user has required role
 */
export function requireRole(...allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');

    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(user.role)) {
      throw new HTTPException(403, { message: 'Insufficient permissions' });
    }

    await next();
  };
}

/**
 * Enrollment Verification Middleware
 * Checks if learner is enrolled in the course
 */
export async function requireEnrollment(c: Context, next: Next) {
  const user = c.get('user');
  const courseId = c.req.param('courseId');

  if (!user || !courseId) {
    throw new HTTPException(400, { message: 'Invalid request' });
  }

  // Instructors always have access to their own courses
  if (user.role === 'instructor') {
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('instructor_id', user.id)
      .single();

    if (course) {
      await next();
      return;
    }
  }

  // Learners need to be enrolled
  if (user.role === 'learner') {
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('learner_id', user.id)
      .single();

    if (enrollment) {
      await next();
      return;
    }
  }

  throw new HTTPException(403, { message: 'Not enrolled in this course' });
}

/**
 * Resource Ownership Middleware
 * Ensures user can only access their own resources
 */
export async function requireOwnership(resourceType: 'submission' | 'profile') {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    const resourceId = c.req.param('id') || c.req.param(`${resourceType}Id`);

    if (!user || !resourceId) {
      throw new HTTPException(400, { message: 'Invalid request' });
    }

    let hasAccess = false;

    switch (resourceType) {
      case 'submission':
        const { data: submission } = await supabaseAdmin
          .from('submissions')
          .select('learner_id, assignment_id')
          .eq('id', resourceId)
          .single();

        if (submission) {
          // Learner can access their own submissions
          if (user.role === 'learner' && submission.learner_id === user.id) {
            hasAccess = true;
          }

          // Instructor can access submissions for their assignments
          if (user.role === 'instructor') {
            const { data: assignment } = await supabaseAdmin
              .from('assignments')
              .select('course_id')
              .eq('id', submission.assignment_id)
              .single();

            if (assignment) {
              const { data: course } = await supabaseAdmin
                .from('courses')
                .select('instructor_id')
                .eq('id', assignment.course_id)
                .single();

              if (course && course.instructor_id === user.id) {
                hasAccess = true;
              }
            }
          }
        }
        break;

      case 'profile':
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('user_id')
          .eq('user_id', resourceId)
          .single();

        if (profile && profile.user_id === user.id) {
          hasAccess = true;
        }
        break;
    }

    if (!hasAccess) {
      throw new HTTPException(403, { message: 'Access denied' });
    }

    await next();
  };
}

/**
 * Course Status Middleware
 * Ensures learners can only see published courses
 */
export async function requirePublishedCourse(c: Context, next: Next) {
  const user = c.get('user');
  const courseId = c.req.param('courseId');

  if (!courseId) {
    await next();
    return;
  }

  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('status, instructor_id')
    .eq('id', courseId)
    .single();

  if (!course) {
    throw new HTTPException(404, { message: 'Course not found' });
  }

  // Instructors can see their own courses in any status
  if (user.role === 'instructor' && course.instructor_id === user.id) {
    await next();
    return;
  }

  // Learners can only see published courses
  if (user.role === 'learner' && course.status !== 'published') {
    throw new HTTPException(403, { message: 'Course not available' });
  }

  await next();
}

/**
 * Assignment Access Middleware
 * Checks assignment status and permissions
 */
export async function requireAssignmentAccess(c: Context, next: Next) {
  const user = c.get('user');
  const assignmentId = c.req.param('assignmentId');

  if (!assignmentId) {
    await next();
    return;
  }

  const { data: assignment } = await supabaseAdmin
    .from('assignments')
    .select(`
      id,
      status,
      course_id,
      courses!inner(instructor_id)
    `)
    .eq('id', assignmentId)
    .single();

  if (!assignment) {
    throw new HTTPException(404, { message: 'Assignment not found' });
  }

  // Type assertion for the joined data
  const assignmentWithCourse = assignment as any & { courses: { instructor_id: string } };

  // Instructors can access their own assignments in any status
  if (user.role === 'instructor' && assignmentWithCourse.courses.instructor_id === user.id) {
    c.set('assignment', assignment);
    await next();
    return;
  }

  // Learners can only access published assignments they're enrolled in
  if (user.role === 'learner') {
    if (assignment.status !== 'published') {
      throw new HTTPException(403, { message: 'Assignment not available' });
    }

    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('course_id', assignment.course_id)
      .eq('learner_id', user.id)
      .single();

    if (!enrollment) {
      throw new HTTPException(403, { message: 'Not enrolled in this course' });
    }

    c.set('assignment', assignment);
    await next();
    return;
  }

  throw new HTTPException(403, { message: 'Access denied' });
}