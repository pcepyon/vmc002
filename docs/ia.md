# Information Architecture

## Route Structure

```
/                                     # Public - Home/Course Catalog
├── /auth
│   ├── /signin                      # Public - Sign In
│   ├── /signup                      # Public - Sign Up
│   └── /onboarding                  # Auth Required - Role Selection & Profile Setup
│
├── /courses                         # Public - Course List/Search
│   └── /[courseId]                  # Public - Course Detail
│       ├── /enroll                  # Learner Only - Course Enrollment
│       └── /unenroll                # Learner Only - Course Unenrollment
│
├── /dashboard                       # Role-based Redirect
│   ├── /learner                     # Learner Only - Learner Dashboard
│   └── /instructor                  # Instructor Only - Instructor Dashboard
│
├── /my-courses                      # Learner Only - Enrolled Courses
│   └── /[courseId]
│       ├── /assignments             # Assignment List for Course
│       │   └── /[assignmentId]
│       │       ├── /submit          # Submit/Resubmit Assignment
│       │       └── /feedback        # View Grade & Feedback
│       └── /grades                  # Course Grade Summary
│
└── /manage                          # Instructor Only
    ├── /courses
    │   ├── /new                     # Create New Course
    │   └── /[courseId]
    │       ├── /edit                # Edit Course Details
    │       ├── /publish             # Change Course Status
    │       └── /assignments
    │           ├── /new             # Create Assignment
    │           └── /[assignmentId]
    │               ├── /edit        # Edit Assignment
    │               ├── /submissions # View All Submissions
    │               └── /grade       # Grade & Feedback Interface
    └── /analytics                   # Course Analytics (Optional)
```

## Access Control Matrix

| Route Pattern | Public | Learner | Instructor | Additional Conditions |
|--------------|--------|---------|------------|----------------------|
| `/` | ✅ | ✅ | ✅ | - |
| `/auth/*` | ✅ | - | - | Redirect if authenticated |
| `/onboarding` | - | ✅ | ✅ | Only if profile incomplete |
| `/courses` | ✅ | ✅ | ✅ | - |
| `/courses/[id]` | ✅ | ✅ | ✅ | - |
| `/courses/[id]/enroll` | - | ✅ | ❌ | Course must be published |
| `/dashboard/learner` | - | ✅ | ❌ | - |
| `/dashboard/instructor` | - | ❌ | ✅ | - |
| `/my-courses/*` | - | ✅ | ❌ | Must be enrolled |
| `/my-courses/*/submit` | - | ✅ | ❌ | Assignment must be published |
| `/manage/*` | - | ❌ | ✅ | Must own the resource |

## Page Components

### Public Pages
```yaml
HomePage:
  route: /
  features:
    - Course catalog with search/filter
    - Featured courses
    - Category navigation
    - Sign in/up CTA

CourseDetailPage:
  route: /courses/[courseId]
  features:
    - Course overview
    - Curriculum outline
    - Instructor info
    - Enrollment button (if authenticated as learner)
    - Student count & ratings
```

### Authentication Pages
```yaml
SignInPage:
  route: /auth/signin
  features:
    - Email/password login
    - Link to signup
    - Password recovery

SignUpPage:
  route: /auth/signup
  features:
    - Email/password registration
    - Terms agreement
    - Auto-redirect to onboarding

OnboardingPage:
  route: /auth/onboarding
  features:
    - Role selection (learner/instructor)
    - Profile completion (name, phone)
    - Dashboard redirect based on role
```

### Learner Pages
```yaml
LearnerDashboard:
  route: /dashboard/learner
  features:
    - Enrolled courses grid
    - Upcoming deadlines
    - Recent feedback notifications
    - Overall progress

MyCoursePage:
  route: /my-courses/[courseId]
  features:
    - Course progress
    - Assignment list with statuses
    - Grade summary

AssignmentDetailPage:
  route: /my-courses/[courseId]/assignments/[assignmentId]
  features:
    - Assignment description
    - Due date & late policy
    - Submission form (text + link)
    - Submission status indicator

FeedbackPage:
  route: /my-courses/[courseId]/assignments/[assignmentId]/feedback
  features:
    - Score display
    - Instructor feedback
    - Resubmission request status
    - Version history
```

### Instructor Pages
```yaml
InstructorDashboard:
  route: /dashboard/instructor
  features:
    - My courses list
    - Pending submissions count
    - Recent activities
    - Quick actions

CourseManagementPage:
  route: /manage/courses/[courseId]/edit
  features:
    - Course details editor
    - Status management (draft/published/archived)
    - Assignment list
    - Enrollment statistics

AssignmentManagementPage:
  route: /manage/courses/[courseId]/assignments/[assignmentId]/edit
  features:
    - Assignment editor
    - Due date & policy settings
    - Status control (draft/published/closed)

SubmissionsPage:
  route: /manage/courses/[courseId]/assignments/[assignmentId]/submissions
  features:
    - Submission list with filters
    - Status indicators (submitted/late/graded)
    - Batch actions
    - Export options

GradingPage:
  route: /manage/courses/[courseId]/assignments/[assignmentId]/grade
  features:
    - Submission content viewer
    - Score input (0-100)
    - Feedback editor
    - Resubmission request option
```

## State Management

### User States
```yaml
AuthState:
  - unauthenticated
  - authenticated
  - onboarding_required

ProfileState:
  - incomplete
  - learner_active
  - instructor_active
```

### Course States
```yaml
CourseStatus:
  - draft        # Instructor only
  - published    # Public visible
  - archived     # Hidden from catalog
```

### Assignment States
```yaml
AssignmentStatus:
  - draft        # Not visible to learners
  - published    # Open for submissions
  - closed       # No new submissions

SubmissionStatus:
  - submitted
  - graded
  - resubmission_required
```

## Navigation Hierarchy

### Primary Navigation
```yaml
Unauthenticated:
  - Home
  - Courses
  - Sign In

Learner:
  - Dashboard
  - My Courses
  - Browse Courses
  - Profile

Instructor:
  - Dashboard
  - Manage Courses
  - Create Course
  - Profile
```

### Breadcrumb Examples
```
Home > Courses > PostgreSQL Basics
Dashboard > My Courses > PostgreSQL Basics > Assignment 1 > Submit
Manage > Web Development 101 > Assignment 3 > Submissions
```

## API Endpoints Mapping

### Public Endpoints
```
GET  /api/courses              # List all published courses
GET  /api/courses/:id          # Get course details
```

### Authenticated Endpoints
```
# Profile
POST /api/auth/signup
POST /api/auth/signin
POST /api/profile/complete

# Learner
POST /api/courses/:id/enroll
GET  /api/my-courses
POST /api/assignments/:id/submit
GET  /api/assignments/:id/feedback

# Instructor
POST /api/courses
PUT  /api/courses/:id
POST /api/assignments
PUT  /api/assignments/:id
GET  /api/assignments/:id/submissions
POST /api/submissions/:id/grade
```

## Key Design Principles

1. **Role-based Access**: Every route checks user role before rendering
2. **Progressive Disclosure**: Show only relevant actions based on state
3. **Clear Hierarchy**: Consistent parent-child relationships in URLs
4. **State Visibility**: Always show current status (draft/published/submitted/graded)
5. **Contextual Actions**: Actions available based on current state and permissions
6. **Responsive Feedback**: Immediate UI updates after state changes

## Error States

```yaml
401_Unauthorized:
  redirect: /auth/signin

403_Forbidden:
  message: "You don't have permission to access this resource"

404_NotFound:
  message: "The requested resource was not found"

422_InvalidState:
  examples:
    - "Cannot submit to closed assignment"
    - "Cannot enroll in draft course"
    - "Resubmission not allowed for this assignment"
```