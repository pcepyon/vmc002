'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Calendar, Weight, Settings2, Eye, Edit, Lock, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { formatDistance } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  dueDate: string;
  weight: number;
  allowLate: boolean;
  allowResubmission: boolean;
  status: 'draft' | 'published' | 'closed';
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalSubmissions: number;
    gradedCount: number;
    pendingCount: number;
  };
}

export default function AssignmentsManagementPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const queryClient = useQueryClient();

  // 과제 목록 조회
  const { data, isLoading, error } = useQuery({
    queryKey: ['managed-assignments', courseId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/manage/courses/${courseId}/assignments`);
      return response.data.data.assignments as Assignment[];
    },
  });

  // 과제 게시
  const publishMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await apiClient.put(`/api/assignments/${assignmentId}/publish`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managed-assignments', courseId] });
      toast({
        title: '과제가 게시되었습니다',
        description: '학습자들이 과제를 확인할 수 있습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '과제 게시 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // 과제 마감
  const closeMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await apiClient.put(`/api/assignments/${assignmentId}/close`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managed-assignments', courseId] });
      toast({
        title: '과제가 마감되었습니다',
        description: '더 이상 제출을 받지 않습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '과제 마감 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // 과제 삭제
  const deleteMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await apiClient.delete(`/api/assignments/${assignmentId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managed-assignments', courseId] });
      toast({
        title: '과제가 삭제되었습니다',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '과제 삭제 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">초안</Badge>;
      case 'published':
        return <Badge variant="default">게시됨</Badge>;
      case 'closed':
        return <Badge variant="outline">마감됨</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (date: string) => {
    return formatDistance(new Date(date), new Date(), {
      addSuffix: true,
      locale: ko,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">
          과제 목록을 불러오는데 실패했습니다
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">과제 관리</h1>
          <p className="text-gray-500 mt-2">코스의 과제를 관리하세요</p>
        </div>
        <Link href={`/manage/courses/${courseId}/assignments/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            새 과제 만들기
          </Button>
        </Link>
      </div>

      {!data || data.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">아직 생성된 과제가 없습니다</p>
            <Link href={`/manage/courses/${courseId}/assignments/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                첫 과제 만들기
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {data.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{assignment.title}</CardTitle>
                      {getStatusBadge(assignment.status)}
                    </div>
                    <CardDescription>
                      {assignment.description || '설명 없음'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {assignment.status === 'draft' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => publishMutation.mutate(assignment.id)}
                          disabled={publishMutation.isPending}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          게시하기
                        </Button>
                        <Link
                          href={`/manage/courses/${courseId}/assignments/${assignment.id}/edit`}
                        >
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>과제를 삭제하시겠습니까?</AlertDialogTitle>
                              <AlertDialogDescription>
                                이 작업은 되돌릴 수 없습니다. 과제와 관련된 모든 데이터가 삭제됩니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(assignment.id)}
                              >
                                삭제
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    {assignment.status === 'published' && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => closeMutation.mutate(assignment.id)}
                          disabled={closeMutation.isPending}
                        >
                          <Lock className="h-4 w-4 mr-1" />
                          마감하기
                        </Button>
                        <Link
                          href={`/manage/courses/${courseId}/assignments/${assignment.id}/submissions`}
                        >
                          <Button size="sm" variant="outline">
                            제출물 보기
                          </Button>
                        </Link>
                      </>
                    )}
                    {assignment.status === 'closed' && (
                      <Link
                        href={`/manage/courses/${courseId}/assignments/${assignment.id}/submissions`}
                      >
                        <Button size="sm" variant="outline">
                          제출물 보기
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500">마감일</p>
                      <p className="font-medium">{formatDate(assignment.dueDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Weight className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500">비중</p>
                      <p className="font-medium">{assignment.weight}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500">정책</p>
                      <div className="flex gap-2">
                        {assignment.allowLate && (
                          <Badge variant="outline" className="text-xs">
                            지각허용
                          </Badge>
                        )}
                        {assignment.allowResubmission && (
                          <Badge variant="outline" className="text-xs">
                            재제출
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {assignment.stats && (
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-gray-500">제출 현황</p>
                        <div className="flex gap-2 text-xs">
                          <span>전체: {assignment.stats.totalSubmissions}</span>
                          <span className="text-green-600">
                            채점: {assignment.stats.gradedCount}
                          </span>
                          <span className="text-orange-600">
                            대기: {assignment.stats.pendingCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}