# 성적 & 피드백 열람 모듈화 설계

## 개요

### 모듈 목록

| 모듈 이름 | 위치 | 설명 |
|----------|------|------|
| **Grades Feature** | `src/features/grades/` | 성적 조회 핵심 로직 |
| **Grade Display** | `src/components/grades/display/` | 성적 표시 컴포넌트 |
| **Feedback Viewer** | `src/components/grades/feedback/` | 피드백 뷰어 |
| **Progress Chart** | `src/components/grades/charts/` | 진도 차트 |
| **Grade Calculator** | `src/lib/utils/grade-calculator.ts` | 성적 계산 유틸리티 |
| **Export Tools** | `src/lib/export/grades.ts` | 성적표 내보내기 |

## Diagram

```mermaid
graph TB
    subgraph "Learner Navigation"
        A[MyCoursesPage] --> B[CourseDetailPage]
        B --> C[GradesTab]
        B --> D[AssignmentsTab]
        D --> E[FeedbackButton]
    end

    subgraph "Grades View"
        C --> F[GradesSummary]
        F --> G[OverallScore]
        F --> H[ProgressBar]
        F --> I[AssignmentsList]

        I --> J[AssignmentRow]
        J --> K[ScoreDisplay]
        J --> L[StatusBadge]
        J --> M[ViewFeedback]
    end

    subgraph "Feedback View"
        E --> N[FeedbackModal]
        M --> N
        N --> O[SubmissionContent]
        N --> P[Score&Grade]
        N --> Q[InstructorFeedback]
        N --> R[ResubmitStatus]
    end

    subgraph "API Layer"
        S[GET /api/my-courses/:courseId/grades]
        T[GET /api/submissions/:submissionId/feedback]
        U[GET /api/my-courses/:courseId/progress]
    end

    subgraph "Backend Processing"
        S --> V[FetchAssignments]
        V --> W[FetchSubmissions]
        W --> X[CalculateGrades]
        X --> Y[FormatResponse]

        T --> Z[ValidateAccess]
        Z --> AA[FetchFeedback]
    end

    subgraph "Calculations"
        AB[WeightedAverage] --> AC{Has Submissions?}
        AC -->|Yes| AD[Sum(score × weight)]
        AC -->|No| AE[Return 0]
        AD --> AF[Divide by Total Weight]
    end

    C --> S
    N --> T
```

## Implementation Plan

### 1. Backend Modules

#### 1.1 Grades Feature Backend (`src/features/grades/backend/`)

**route.ts**
- `GET /api/my-courses/:courseId/grades` - 코스 성적 조회
- `GET /api/submissions/:submissionId/feedback` - 개별 피드백 조회
- `GET /api/my-courses/:courseId/progress` - 진도율 조회
- `GET /api/my-courses/transcript` - 전체 성적표

**service.ts**
- `getCourseGrades()` - 코스별 성적 조회
- `calculateCourseScore()` - 코스 총점 계산
- `getSubmissionFeedback()` - 제출물 피드백 조회
- `calculateProgress()` - 진도율 계산
- `generateTranscript()` - 성적 증명서 생성
- `getGradeDistribution()` - 성적 분포 통계

**schema.ts**
```typescript
export const GradeResponseSchema = z.object({
  course: z.object({
    id: z.string(),
    title: z.string(),
  }),
  assignments: z.array(z.object({
    id: z.string(),
    title: z.string(),
    due_date: z.string(),
    weight: z.number(),
    submission: z.object({
      id: z.string(),
      score: z.number().nullable(),
      status: z.enum(['submitted', 'graded', 'resubmission_required']),
      is_late: z.boolean(),
      feedback: z.string().nullable(),
      version: z.number(),
    }).nullable(),
  })),
  summary: z.object({
    total_score: z.number(),
    submitted_count: z.number(),
    graded_count: z.number(),
    pending_count: z.number(),
    average_score: z.number(),
    letter_grade: z.string(),
  }),
});

export const FeedbackDetailSchema = z.object({
  submission: z.object({
    id: z.string(),
    content_text: z.string(),
    content_link: z.string().nullable(),
    submitted_at: z.string(),
    is_late: z.boolean(),
  }),
  grading: z.object({
    score: z.number(),
    feedback: z.string(),
    graded_at: z.string(),
    status: z.string(),
  }),
  assignment: z.object({
    title: z.string(),
    weight: z.number(),
  }),
});
```

**error.ts**
- `GRADES_ACCESS_DENIED` - 본인 성적만 조회 가능
- `FEEDBACK_NOT_FOUND` - 피드백 없음
- `NOT_ENROLLED` - 미수강 코스
- `SUBMISSION_NOT_FOUND` - 제출물 없음

**Unit Tests**
```typescript
describe('GradesService', () => {
  it('should calculate weighted average correctly');
  it('should exclude ungraded assignments from total');
  it('should handle zero-weight assignments');
  it('should return only user\'s own grades');
  it('should calculate letter grade accurately');
});
```

### 2. Frontend Modules

#### 2.1 Grades Page (`src/app/my-courses/[courseId]/grades/page.tsx`)

**주요 기능**
- 성적 요약 카드
- 과제별 점수 테이블
- 성적 분포 차트
- 진도 표시
- 성적표 다운로드

**QA Sheet**
- [ ] 전체 점수 계산 정확성
- [ ] 미제출 과제 0점 처리
- [ ] 미채점 과제 제외 처리
- [ ] 지각 제출 표시
- [ ] 재제출 필요 강조 표시
- [ ] 성적표 PDF 다운로드
- [ ] 빈 성적 상태 메시지

#### 2.2 Feedback Modal (`src/components/grades/feedback/FeedbackModal.tsx`)

**Props**
```typescript
interface FeedbackModalProps {
  submissionId: string;
  assignmentTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onResubmit?: () => void;
}
```

**QA Sheet**
- [ ] 제출 내용 정확히 표시
- [ ] 점수 및 등급 표시
- [ ] 피드백 텍스트 포맷팅
- [ ] 재제출 필요 시 버튼 표시
- [ ] 로딩 상태 처리
- [ ] 접근 권한 검증

#### 2.3 Grade Summary Card (`src/components/grades/display/GradeSummaryCard.tsx`)

**Features**
- 총점 표시 (숫자 & 레터 등급)
- 진도율 바
- 제출/채점 통계
- 평균 점수

### 3. Shared Components

#### 3.1 Assignment Grade Row (`src/components/grades/display/AssignmentGradeRow.tsx`)

**Columns**
- 과제명
- 마감일
- 비중
- 점수
- 상태
- 액션 (피드백 보기)

**Features**
- 상태별 색상 코딩
- 호버 시 상세 정보
- 클릭 시 피드백 모달

#### 3.2 Progress Chart (`src/components/grades/charts/ProgressChart.tsx`)

**Types**
- Line chart: 시간별 성적 추이
- Bar chart: 과제별 점수
- Pie chart: 제출 상태 분포

### 4. Grade Calculations

#### 4.1 Grade Calculator (`src/lib/utils/grade-calculator.ts`)

```typescript
export function calculateWeightedAverage(
  assignments: AssignmentWithGrade[]
): number {
  const graded = assignments.filter(a => a.submission?.score !== null);

  if (graded.length === 0) return 0;

  const weightedSum = graded.reduce((sum, assignment) => {
    const score = assignment.submission?.score || 0;
    return sum + (score * assignment.weight);
  }, 0);

  const totalWeight = graded.reduce((sum, assignment) => {
    return sum + assignment.weight;
  }, 0);

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

export function getLetterGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 75) return 'C+';
  if (score >= 70) return 'C';
  if (score >= 65) return 'D+';
  if (score >= 60) return 'D';
  return 'F';
}

export function calculateProgress(
  totalAssignments: number,
  submittedAssignments: number
): number {
  if (totalAssignments === 0) return 0;
  return Math.round((submittedAssignments / totalAssignments) * 100);
}
```

### 5. State Management

#### 5.1 React Query Hooks

```typescript
// useGradesQuery.ts
export function useGradesQuery(courseId: string) {
  return useQuery({
    queryKey: ['grades', courseId],
    queryFn: () => fetchCourseGrades(courseId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

// useFeedbackQuery.ts
export function useFeedbackQuery(submissionId: string) {
  return useQuery({
    queryKey: ['feedback', submissionId],
    queryFn: () => fetchSubmissionFeedback(submissionId),
    enabled: !!submissionId,
  });
}
```

#### 5.2 Grades Store (`src/features/grades/store.ts`)

```typescript
interface GradesStore {
  selectedCourseId: string | null;
  viewMode: 'table' | 'cards' | 'chart';
  sortBy: 'date' | 'score' | 'weight';
  filterStatus: 'all' | 'graded' | 'pending' | 'resubmit';

  setSelectedCourse: (courseId: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (sort: SortOption) => void;
  setFilterStatus: (status: FilterStatus) => void;
}
```

### 6. Export Features

#### 6.1 Grade Export (`src/lib/export/grades.ts`)

```typescript
export async function exportGradesPDF(
  courseId: string,
  userId: string
): Promise<Blob> {
  const grades = await fetchCourseGrades(courseId);
  const html = generateGradeReportHTML(grades);
  return convertHTMLToPDF(html);
}

export async function exportGradesCSV(
  courseId: string
): Promise<string> {
  const grades = await fetchCourseGrades(courseId);
  return convertToCSV(grades);
}
```

### 7. UI/UX Features

#### 7.1 Grade Trends Visualization

```typescript
interface GradeTrendsProps {
  grades: AssignmentGrade[];
}

export function GradeTrends({ grades }: GradeTrendsProps) {
  const chartData = useMemo(() =>
    grades.map(g => ({
      date: formatDate(g.submitted_at),
      score: g.score,
      average: calculateRunningAverage(grades, g.id),
    })),
    [grades]
  );

  return (
    <LineChart
      data={chartData}
      lines={[
        { dataKey: 'score', color: 'blue', label: '점수' },
        { dataKey: 'average', color: 'green', label: '누적 평균' },
      ]}
    />
  );
}
```

#### 7.2 Resubmission Alert

```typescript
export function ResubmissionAlert({ assignments }: { assignments: Assignment[] }) {
  const needsResubmission = assignments.filter(
    a => a.submission?.status === 'resubmission_required'
  );

  if (needsResubmission.length === 0) return null;

  return (
    <Alert variant="warning">
      <AlertTitle>재제출이 필요한 과제가 있습니다</AlertTitle>
      <AlertDescription>
        {needsResubmission.map(a => (
          <Link key={a.id} href={`/assignments/${a.id}/submit`}>
            {a.title}
          </Link>
        ))}
      </AlertDescription>
    </Alert>
  );
}
```

### 8. Performance Optimizations

1. **Data aggregation** - 서버에서 계산 후 전송
2. **Lazy loading** - 피드백 on-demand 로딩
3. **Caching** - 성적 데이터 캐싱
4. **Memoization** - 복잡한 계산 결과 캐싱
5. **Virtual scrolling** - 긴 성적 목록 최적화

### 9. Accessibility

- 스크린 리더용 성적 설명
- 색맹 친화적 색상 구성
- 키보드 네비게이션 지원
- 고대비 모드 지원
- 성적 변화 음성 안내

### 10. Testing Strategy

#### 10.1 Integration Tests

```typescript
describe('Grades Flow', () => {
  it('should display correct weighted average');
  it('should update when new grade is posted');
  it('should handle edge cases (no submissions, all zeros)');
  it('should respect access permissions');
});
```

#### 10.2 E2E Tests
- 성적 조회 전체 플로우
- 피드백 모달 열기/닫기
- 성적표 다운로드
- 재제출 플로우 연결
- 다양한 화면 크기 대응