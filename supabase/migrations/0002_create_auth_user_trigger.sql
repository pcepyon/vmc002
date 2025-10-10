-- ===================================================================
-- Auto-create Profile on User Signup
-- Description: auth.users에 사용자가 생성되면 자동으로 profiles 테이블에 레코드 생성
-- Author: System
-- Date: 2025-01-10
-- ===================================================================

BEGIN;

-- ===================================================================
-- 1. FUNCTION: auth.users 생성 시 profiles 자동 생성
-- ===================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- auth.users에 새 사용자가 생성되면 profiles 테이블에 자동으로 레코드 생성
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)), -- 이름이 없으면 이메일 앞부분 사용
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'learner') -- 역할이 없으면 기본값 'learner'
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- 에러 발생 시 로그를 남기고 트랜잭션을 중단하지 않음
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- 2. TRIGGER: auth.users INSERT 시 handle_new_user 실행
-- ===================================================================

-- 기존 트리거가 있다면 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 새 트리거 생성
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ===================================================================
-- 3. COMMENT
-- ===================================================================

COMMENT ON FUNCTION public.handle_new_user() IS
'auth.users에 새 사용자가 생성되면 자동으로 profiles 테이블에 레코드를 생성합니다.
이름이 제공되지 않으면 이메일 앞부분을 사용하고, 역할이 없으면 learner로 설정됩니다.';

COMMIT;

-- ===================================================================
-- END OF MIGRATION
-- ===================================================================
