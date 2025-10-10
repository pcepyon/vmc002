# 과제 상세 열람 유스케이스

## Primary Actor
학습자 (Learner 역할)

## Precondition
- 학습자가 로그인 상태임
- 해당 코스에 수강 등록되어 있음
- 과제가 published 상태임

## Trigger
학습자가 내 코스 목록에서 특정 과제를 선택

## Main Scenario
1. 학습자가 "내 코스" 페이지에 접근함
2. 학습자가 수강 중인 코스를 선택함
3. 시스템이 해당 코스의 과제 목록을 표시함
4. 학습자가 특정 과제를 선택함
5. 시스템이 수강 권한을 확인함
6. 시스템이 과제 상태를 확인함 (published/closed)
7. 시스템이 과제 상세 정보를 표시함
   - 과제 제목 및 설명
   - 마감일 및 남은 시간
   - 점수 비중
   - 지각 제출 허용 여부
   - 재제출 허용 여부
8. 시스템이 현재 제출 상태를 표시함
   - 미제출/제출됨/채점완료/재제출요청
9. 시스템이 과제 상태에 따라 제출 UI를 조정함
   - published: 제출 폼 활성화
   - closed: 제출 폼 비활성화, "마감됨" 표시

## Edge Cases
- **E1: 미수강 코스의 과제 접근**
  - 시스템이 403 Forbidden 에러 반환
  - "수강 등록이 필요합니다" 메시지 표시
- **E2: Draft 상태 과제 접근**
  - 시스템이 404 Not Found 반환
  - "과제를 찾을 수 없습니다" 메시지 표시
- **E3: 마감된 과제 접근**
  - 과제 정보는 표시하되 제출 불가능
  - "마감된 과제입니다" 안내 표시
- **E4: 삭제된 과제 접근**
  - 시스템이 404 에러 반환

## Business Rules
- published 상태의 과제만 학습자에게 표시
- 수강 등록된 학습자만 과제 상세 접근 가능
- closed 상태 과제는 열람만 가능, 제출 불가
- 마감 시간은 클라이언트 타임존으로 표시

## Sequence Diagram

```plantuml
@startuml
actor Learner
participant FE as "Frontend"
participant BE as "Backend"
database Database

Learner -> FE : "내 코스" 페이지 접근
FE -> BE : GET /api/my-courses

BE -> Database : SELECT * FROM enrollments e\nJOIN courses c ON e.course_id = c.id\nWHERE e.user_id = :userId
Database -> BE : Enrolled courses

BE -> FE : 200 OK\n[enrolled courses]
FE -> Learner : 수강 중인 코스 목록 표시

Learner -> FE : 특정 코스 선택
FE -> BE : GET /api/my-courses/:courseId/assignments

BE -> BE : 수강 권한 확인
BE -> Database : SELECT * FROM enrollments\nWHERE user_id = :userId\nAND course_id = :courseId

alt 수강 권한 없음
    Database -> BE : No enrollment
    BE -> FE : 403 Forbidden\n"Not enrolled"
    FE -> Learner : "수강 등록이 필요합니다"
else 수강 권한 있음
    Database -> BE : Enrollment exists
    BE -> Database : SELECT * FROM assignments\nWHERE course_id = :courseId\nAND status IN ('published', 'closed')
    Database -> BE : Assignment list

    BE -> FE : 200 OK\n[assignments]
    FE -> Learner : 과제 목록 표시

    Learner -> FE : 특정 과제 선택
    FE -> BE : GET /api/assignments/:assignmentId

    BE -> Database : SELECT * FROM assignments\nWHERE id = :assignmentId
    Database -> BE : Assignment details

    BE -> Database : SELECT * FROM submissions\nWHERE assignment_id = :assignmentId\nAND user_id = :userId\nORDER BY version DESC LIMIT 1
    Database -> BE : Latest submission (if exists)

    BE -> BE : 과제 상태 확인\n제출 가능 여부 판단

    alt status = 'draft'
        BE -> FE : 404 Not Found
        FE -> Learner : "과제를 찾을 수 없습니다"
    else status = 'published'
        BE -> FE : 200 OK\n{assignment, submission, canSubmit: true}
        FE -> Learner : 과제 상세 + 제출 폼 표시
    else status = 'closed'
        BE -> FE : 200 OK\n{assignment, submission, canSubmit: false}
        FE -> Learner : 과제 상세 표시\n(제출 폼 비활성화)
    end
end
@enduml
```