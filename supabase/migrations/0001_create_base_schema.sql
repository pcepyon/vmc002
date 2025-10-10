-- ===================================================================
-- LMS Base Schema Migration
-- Description: 최소 스펙 LMS 데이터베이스 스키마 생성
-- Author: System
-- Date: 2025-01-09
-- ===================================================================

BEGIN;

-- ===================================================================
-- 1. ENUMS
-- ===================================================================

-- 사용자 역할 타입
CREATE TYPE user_role AS ENUM ('learner', 'instructor');

-- 코스 상태
CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');

-- 과제 상태
CREATE TYPE assignment_status AS ENUM ('draft', 'published', 'closed');

-- 제출물 상태
CREATE TYPE submission_status AS ENUM ('submitted', 'graded', 'resubmission_required');

-- 난이도
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- ===================================================================
-- 2. TABLES
-- ===================================================================

-- profiles: 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- terms_agreements: 약관 동의 이력
CREATE TABLE IF NOT EXISTS terms_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    agreed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0'
);

-- courses: 코스 테이블
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES profiles(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    difficulty difficulty_level DEFAULT 'beginner',
    status course_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- enrollments: 수강신청 테이블
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    UNIQUE(user_id, course_id) -- 중복 수강 방지
);

-- assignments: 과제 테이블
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    weight DECIMAL(5,2) DEFAULT 0 CHECK (weight >= 0 AND weight <= 100),
    allow_late BOOLEAN DEFAULT false,
    allow_resubmission BOOLEAN DEFAULT false,
    status assignment_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- submissions: 과제 제출물 테이블
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    content_text TEXT NOT NULL,
    content_link VARCHAR(500),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_late BOOLEAN DEFAULT false,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    feedback TEXT,
    status submission_status NOT NULL DEFAULT 'submitted',
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(assignment_id, user_id, version) -- 버전별 유니크 제약
);

-- ===================================================================
-- 3. INDEXES
-- ===================================================================

-- profiles 인덱스
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- courses 인덱스
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX idx_courses_category ON courses(category);

-- enrollments 인덱스
CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);

-- assignments 인덱스
CREATE INDEX idx_assignments_course_id ON assignments(course_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);

-- submissions 인덱스
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_status ON submissions(status);

-- ===================================================================
-- 4. FUNCTIONS AND TRIGGERS
-- ===================================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 적용
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- 5. VALIDATION FUNCTIONS
-- ===================================================================

-- 역할 검증 함수: 강사만 코스 생성 가능
CREATE OR REPLACE FUNCTION validate_instructor_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = NEW.instructor_id
        AND role = 'instructor'
    ) THEN
        RAISE EXCEPTION 'Only instructors can create courses';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_course_instructor
    BEFORE INSERT OR UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION validate_instructor_role();

-- 수강신청 검증 함수: 학습자만 수강신청 가능
CREATE OR REPLACE FUNCTION validate_learner_enrollment()
RETURNS TRIGGER AS $$
BEGIN
    -- 학습자 역할 확인
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = NEW.user_id
        AND role = 'learner'
    ) THEN
        RAISE EXCEPTION 'Only learners can enroll in courses';
    END IF;

    -- 코스가 published 상태인지 확인
    IF NOT EXISTS (
        SELECT 1 FROM courses
        WHERE id = NEW.course_id
        AND status = 'published'
    ) THEN
        RAISE EXCEPTION 'Can only enroll in published courses';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_enrollment
    BEFORE INSERT ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION validate_learner_enrollment();

-- 제출 검증 함수: 마감일과 정책 확인
CREATE OR REPLACE FUNCTION validate_submission()
RETURNS TRIGGER AS $$
DECLARE
    v_assignment assignments%ROWTYPE;
    v_existing_submission submissions%ROWTYPE;
BEGIN
    -- 과제 정보 조회
    SELECT * INTO v_assignment
    FROM assignments
    WHERE id = NEW.assignment_id;

    -- 과제가 published 상태인지 확인
    IF v_assignment.status != 'published' THEN
        RAISE EXCEPTION 'Cannot submit to non-published assignments';
    END IF;

    -- 수강 여부 확인
    IF NOT EXISTS (
        SELECT 1 FROM enrollments e
        JOIN assignments a ON a.course_id = e.course_id
        WHERE e.user_id = NEW.user_id
        AND a.id = NEW.assignment_id
    ) THEN
        RAISE EXCEPTION 'Must be enrolled in the course to submit assignments';
    END IF;

    -- 마감일 확인 및 지각 처리
    IF now() > v_assignment.due_date THEN
        IF NOT v_assignment.allow_late THEN
            RAISE EXCEPTION 'Late submission not allowed for this assignment';
        ELSE
            NEW.is_late := true;
        END IF;
    END IF;

    -- 재제출 확인
    SELECT * INTO v_existing_submission
    FROM submissions
    WHERE assignment_id = NEW.assignment_id
    AND user_id = NEW.user_id
    ORDER BY version DESC
    LIMIT 1;

    IF v_existing_submission.id IS NOT NULL THEN
        IF NOT v_assignment.allow_resubmission THEN
            RAISE EXCEPTION 'Resubmission not allowed for this assignment';
        ELSE
            -- 재제출인 경우 버전 증가
            NEW.version := v_existing_submission.version + 1;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_submission_rules
    BEFORE INSERT ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION validate_submission();

-- ===================================================================
-- 6. RLS (Row Level Security) - DISABLED
-- ===================================================================

-- RLS는 명시적으로 비활성화
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE terms_agreements DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;

-- ===================================================================
-- 7. SAMPLE DATA (Optional - Comment out in production)
-- ===================================================================

-- 샘플 데이터는 별도 시드 파일로 관리하는 것을 권장
-- 필요시 아래 주석을 해제하여 사용

/*
-- 샘플 강사 계정 (실제로는 auth.users에 먼저 생성되어야 함)
INSERT INTO profiles (id, email, name, phone, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'instructor@example.com', '김강사', '010-1111-1111', 'instructor');

-- 샘플 학습자 계정
INSERT INTO profiles (id, email, name, phone, role) VALUES
    ('22222222-2222-2222-2222-222222222222', 'learner@example.com', '이학생', '010-2222-2222', 'learner');

-- 샘플 코스
INSERT INTO courses (instructor_id, title, description, category, difficulty, status) VALUES
    ('11111111-1111-1111-1111-111111111111', 'PostgreSQL 기초', 'PostgreSQL 데이터베이스 기초 과정', 'Database', 'beginner', 'published');
*/

COMMIT;

-- ===================================================================
-- END OF MIGRATION
-- ===================================================================