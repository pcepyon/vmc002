# 과제 제출 유스케이스

## Primary Actor
학습자 (Learner 역할)

## Precondition
- 학습자가 로그인 상태임
- 해당 코스에 수강 등록되어 있음
- 과제가 published 상태임
- 과제 상세 페이지에 접근함

## Trigger
학습자가 과제 제출 버튼을 클릭

## Main Scenario
1. 학습자가 과제 상세 페이지에서 제출 폼을 확인함
2. 학습자가 텍스트 답변을 입력함 (필수)
3. 학습자가 참고 링크를 입력함 (선택)
4. 학습자가 "제출" 버튼을 클릭함
5. 시스템이 입력값을 검증함
   - 텍스트 필드 비어있지 않은지 확인
   - 링크 형식이 올바른지 확인 (입력한 경우)
6. 시스템이 마감일을 확인함
7. 시스템이 기존 제출 여부를 확인함
8. 시스템이 제출물을 저장함
   - 정상 제출 또는 지각 제출 플래그 설정
9. 시스템이 제출 완료 메시지를 표시함
10. 학습자가 제출 상태 변경을 확인함

## Edge Cases
- **E1: 필수 텍스트 필드 누락**
  - 시스템이 "답변을 입력해주세요" 에러 메시지 표시
- **E2: 잘못된 URL 형식**
  - 시스템이 "올바른 URL 형식을 입력해주세요" 에러 표시
- **E3: 마감일 이후 제출 (지각 불허)**
  - 시스템이 제출 차단
  - "마감일이 지났습니다" 메시지 표시
- **E4: 마감일 이후 제출 (지각 허용)**
  - 시스템이 지각 제출로 처리
  - "지각 제출되었습니다" 경고 메시지 표시
- **E5: 재제출 시도 (재제출 불허)**
  - 시스템이 제출 차단
  - "이미 제출하셨습니다" 메시지 표시
- **E6: 재제출 시도 (재제출 허용)**
  - 시스템이 새 버전으로 저장
  - "재제출되었습니다" 메시지 표시
- **E7: Closed 상태 과제 제출 시도**
  - 시스템이 제출 차단
  - "마감된 과제입니다" 메시지 표시

## Business Rules
- 텍스트 답변은 필수 입력
- 링크는 선택 입력, 입력 시 URL 형식 검증
- 마감일 이후 제출:
  - allow_late=true: 지각 제출 허용, is_late=true 플래그
  - allow_late=false: 제출 차단
- 재제출 정책:
  - allow_resubmission=true: 새 버전 생성 (version++)
  - allow_resubmission=false: 최초 1회만 제출 가능
- status='closed' 과제는 모든 제출 차단

## Sequence Diagram

```plantuml
@startuml
actor Learner
participant FE as "Frontend"
participant BE as "Backend"
database Database

Learner -> FE : 과제 제출 폼 작성
Learner -> FE : 텍스트 답변 입력
Learner -> FE : 링크 입력 (선택)
Learner -> FE : "제출" 버튼 클릭

FE -> FE : 클라이언트 검증\n(필수 필드, URL 형식)

alt 검증 실패
    FE -> Learner : 에러 메시지 표시
else 검증 성공
    FE -> BE : POST /api/assignments/:id/submit\n{content_text, content_link}

    BE -> Database : SELECT * FROM assignments\nWHERE id = :assignmentId
    Database -> BE : Assignment details

    BE -> BE : 과제 상태 확인

    alt status = 'closed'
        BE -> FE : 422 Unprocessable\n"Assignment closed"
        FE -> Learner : "마감된 과제입니다"
    else status = 'published'
        BE -> BE : 마감일 확인\n(now() vs due_date)

        alt 마감 전
            BE -> BE : is_late = false
        else 마감 후 & allow_late = false
            BE -> FE : 422 Unprocessable\n"Past deadline"
            FE -> Learner : "마감일이 지났습니다"
        else 마감 후 & allow_late = true
            BE -> BE : is_late = true
        end

        BE -> Database : SELECT * FROM submissions\nWHERE assignment_id = :assignmentId\nAND user_id = :userId\nORDER BY version DESC
        Database -> BE : Previous submissions

        alt 기존 제출 있음 & allow_resubmission = false
            BE -> FE : 409 Conflict\n"Already submitted"
            FE -> Learner : "이미 제출하셨습니다"
        else 첫 제출 or 재제출 허용
            BE -> BE : version = prev_version + 1

            BE -> Database : INSERT INTO submissions\n(assignment_id, user_id, content_text,\ncontent_link, is_late, version, status)
            Database -> BE : Submission created

            alt is_late = true
                BE -> FE : 200 OK\n{submission_id, warning: "late"}
                FE -> Learner : "지각 제출되었습니다"
            else is_late = false
                BE -> FE : 200 OK\n{submission_id}
                FE -> Learner : "제출 완료되었습니다"
            end

            FE -> Learner : 제출 상태 업데이트
        end
    end
end
@enduml
```