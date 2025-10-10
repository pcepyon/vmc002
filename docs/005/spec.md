# 과제 채점 & 피드백 유스케이스

## Primary Actor
강사 (Instructor 역할)

## Precondition
- 강사가 로그인 상태임
- 해당 코스의 소유자임
- 과제에 제출물이 존재함
- 과제가 published 또는 closed 상태임

## Trigger
강사가 제출물 목록에서 특정 제출물의 채점을 시작

## Main Scenario
1. 강사가 강사 대시보드에 접근함
2. 강사가 본인 코스 목록을 확인함
3. 강사가 특정 코스의 과제 관리 페이지로 이동함
4. 강사가 특정 과제의 제출물 목록을 확인함
   - 필터: 미채점/채점완료/지각/재제출요청
5. 강사가 채점할 제출물을 선택함
6. 시스템이 제출물 상세 내용을 표시함
   - 학습자 정보
   - 제출 시간, 지각 여부
   - 제출 내용 (텍스트, 링크)
   - 버전 정보
7. 강사가 점수를 입력함 (0-100)
8. 강사가 피드백 텍스트를 작성함
9. 강사가 재제출 요청 여부를 선택함 (선택)
10. 강사가 "채점 완료" 버튼을 클릭함
11. 시스템이 채점 정보를 저장함
12. 시스템이 제출물 상태를 업데이트함
13. 시스템이 다음 미채점 제출물로 이동함 (선택)

## Edge Cases
- **E1: 타인 코스 접근 시도**
  - 시스템이 403 Forbidden 반환
  - "권한이 없습니다" 메시지 표시
- **E2: 점수 범위 초과**
  - 시스템이 0-100 범위 검증
  - "점수는 0-100 사이여야 합니다" 에러 표시
- **E3: 피드백 미입력**
  - 시스템이 경고 메시지 표시
  - "피드백을 입력해주세요" (필수)
- **E4: 이미 채점된 제출물 재채점**
  - 기존 점수/피드백 덮어쓰기
  - 수정 이력 저장 (updated_at)
- **E5: Draft 상태 과제의 제출물 채점**
  - 시스템이 채점 차단
  - "과제를 먼저 게시해주세요" 메시지

## Business Rules
- 본인 소유 코스의 과제만 채점 가능
- 점수는 0-100 정수값
- 피드백은 필수 입력
- 재제출 요청 시 상태를 resubmission_required로 변경
- 채점 완료 시 상태를 graded로 변경
- 채점 후에도 수정 가능

## Sequence Diagram

```plantuml
@startuml
actor Instructor
participant FE as "Frontend"
participant BE as "Backend"
database Database

Instructor -> FE : 강사 대시보드 접근
FE -> BE : GET /api/instructor/courses

BE -> Database : SELECT * FROM courses\nWHERE instructor_id = :userId
Database -> BE : Instructor's courses

BE -> FE : 200 OK\n[courses]
FE -> Instructor : 코스 목록 표시

Instructor -> FE : 특정 코스 선택
Instructor -> FE : 과제 관리 페이지 이동
FE -> BE : GET /api/manage/courses/:courseId/assignments

BE -> BE : 소유권 확인

BE -> Database : SELECT * FROM assignments\nWHERE course_id = :courseId
Database -> BE : Assignment list

BE -> FE : 200 OK\n[assignments]
FE -> Instructor : 과제 목록 표시

Instructor -> FE : 특정 과제의 제출물 목록 요청
FE -> BE : GET /api/assignments/:assignmentId/submissions

BE -> Database : SELECT s.*, p.name FROM submissions s\nJOIN profiles p ON s.user_id = p.id\nWHERE s.assignment_id = :assignmentId\nORDER BY s.submitted_at DESC
Database -> BE : Submission list

BE -> FE : 200 OK\n[submissions]
FE -> Instructor : 제출물 목록 표시\n(필터링 옵션 포함)

Instructor -> FE : 특정 제출물 선택
FE -> BE : GET /api/submissions/:submissionId

BE -> Database : SELECT * FROM submissions\nWHERE id = :submissionId
Database -> BE : Submission details

BE -> FE : 200 OK\n{submission details}
FE -> Instructor : 제출물 상세 표시

Instructor -> FE : 점수 입력 (0-100)
Instructor -> FE : 피드백 작성
Instructor -> FE : 재제출 요청 체크 (선택)
Instructor -> FE : "채점 완료" 클릭

FE -> BE : POST /api/submissions/:submissionId/grade\n{score, feedback, request_resubmission}

BE -> BE : 점수 범위 검증\n피드백 필수 확인

alt 검증 실패
    BE -> FE : 400 Bad Request\n{errors}
    FE -> Instructor : 에러 메시지 표시
else 검증 성공
    BE -> BE : 상태 결정

    alt request_resubmission = true
        BE -> BE : status = 'resubmission_required'
    else request_resubmission = false
        BE -> BE : status = 'graded'
    end

    BE -> Database : UPDATE submissions\nSET score = :score,\nfeedback = :feedback,\nstatus = :status,\nupdated_at = NOW()\nWHERE id = :submissionId
    Database -> BE : Update successful

    BE -> FE : 200 OK\n{updated submission}
    FE -> Instructor : "채점 완료" 메시지

    alt 다음 미채점 제출물 존재
        FE -> Instructor : 다음 제출물로 이동 옵션
    else 모두 채점 완료
        FE -> Instructor : 제출물 목록으로 복귀
    end
end
@enduml
```