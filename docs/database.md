# Database Schema

## ENUM Types
```sql
user_role: 'learner' | 'instructor'
course_status: 'draft' | 'published' | 'archived'
assignment_status: 'draft' | 'published' | 'closed'
submission_status: 'submitted' | 'graded' | 'resubmission_required'
difficulty_level: 'beginner' | 'intermediate' | 'advanced'
```

## Tables

### profiles
```sql
id: UUID (PK, auth.users FK, ON DELETE CASCADE)
email: VARCHAR(255) (required)
name: VARCHAR(100) (required)
phone: VARCHAR(20)
role: user_role (required)
created_at: TIMESTAMPTZ (DEFAULT now())
updated_at: TIMESTAMPTZ (DEFAULT now())
```

### terms_agreements
```sql
id: UUID (PK, DEFAULT gen_random_uuid())
user_id: UUID (profiles FK, ON DELETE CASCADE, required)
agreed_at: TIMESTAMPTZ (DEFAULT now())
version: VARCHAR(20) (DEFAULT '1.0.0', required)
```

### courses
```sql
id: UUID (PK, DEFAULT gen_random_uuid())
instructor_id: UUID (profiles FK, required, must be role='instructor')
title: VARCHAR(200) (required)
description: TEXT
category: VARCHAR(50)
difficulty: difficulty_level (DEFAULT 'beginner')
status: course_status (DEFAULT 'draft', required)
created_at: TIMESTAMPTZ (DEFAULT now())
updated_at: TIMESTAMPTZ (DEFAULT now())
```

### enrollments
```sql
id: UUID (PK, DEFAULT gen_random_uuid())
user_id: UUID (profiles FK, required, must be role='learner')
course_id: UUID (courses FK, ON DELETE CASCADE, required, must be status='published')
enrolled_at: TIMESTAMPTZ (DEFAULT now())
progress: INTEGER (DEFAULT 0, CHECK 0-100)
UNIQUE(user_id, course_id)
```

### assignments
```sql
id: UUID (PK, DEFAULT gen_random_uuid())
course_id: UUID (courses FK, ON DELETE CASCADE, required)
title: VARCHAR(200) (required)
description: TEXT
due_date: TIMESTAMPTZ (required)
weight: DECIMAL(5,2) (DEFAULT 0, CHECK 0-100)
allow_late: BOOLEAN (DEFAULT false)
allow_resubmission: BOOLEAN (DEFAULT false)
status: assignment_status (DEFAULT 'draft', required)
created_at: TIMESTAMPTZ (DEFAULT now())
updated_at: TIMESTAMPTZ (DEFAULT now())
```

### submissions
```sql
id: UUID (PK, DEFAULT gen_random_uuid())
assignment_id: UUID (assignments FK, ON DELETE CASCADE, required)
user_id: UUID (profiles FK, required)
content_text: TEXT (required)
content_link: VARCHAR(500)
submitted_at: TIMESTAMPTZ (DEFAULT now())
is_late: BOOLEAN (DEFAULT false)
score: INTEGER (CHECK 0-100)
feedback: TEXT
status: submission_status (DEFAULT 'submitted', required)
version: INTEGER (DEFAULT 1, required)
created_at: TIMESTAMPTZ (DEFAULT now())
updated_at: TIMESTAMPTZ (DEFAULT now())
UNIQUE(assignment_id, user_id, version)
```

## Key Business Rules

### Role-Based Access
- Only `instructor` can create courses
- Only `learner` can enroll in courses
- Only enrolled users can submit assignments

### State-Based Rules
- Enroll only in `published` courses
- Submit only to `published` assignments
- Cannot submit to `closed` assignments

### Submission Rules
- If `now() > due_date`:
  - `allow_late=true` → submit with `is_late=true`
  - `allow_late=false` → block submission
- If existing submission:
  - `allow_resubmission=true` → create new version
  - `allow_resubmission=false` → block

### Status Transitions
- Courses: draft → published → archived
- Assignments: draft → published → closed
- Submissions: submitted → graded OR resubmission_required

## Data Flow

1. **User Registration**
   - auth.users → profiles (with role) → terms_agreements

2. **Course Creation (Instructor)**
   - courses (draft) → published → assignments (draft) → published

3. **Course Enrollment (Learner)**
   - courses (published only) → enrollments (unique per user/course)

4. **Assignment Submission (Learner)**
   - Check enrollment → Check assignment status → Check deadline → submissions

5. **Grading (Instructor)**
   - submissions → score + feedback → status change (graded/resubmission_required)

6. **Grade Calculation**
   - Total = SUM(score × weight) / SUM(weight)

## Migration File
Location: `/supabase/migrations/0001_create_base_schema.sql`

## Notes
- All tables have `updated_at` triggers
- RLS is disabled
- Use Supabase Auth for authentication
- PostgreSQL with Supabase