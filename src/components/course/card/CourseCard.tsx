'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { BookOpen, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CourseResponse } from '@/features/course/lib/dto';
import Link from 'next/link';

interface CourseCardProps {
  course: CourseResponse;
  isEnrolled?: boolean;
  onEnroll?: () => void;
  variant?: 'grid' | 'list';
}

export function CourseCard({
  course,
  isEnrolled = false,
  onEnroll,
  variant = 'grid'
}: CourseCardProps) {
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800'
  };

  const difficultyLabels = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급'
  };

  if (variant === 'list') {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <Link href={`/courses/${course.id}`}>
                    <h3 className="text-lg font-semibold hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {course.instructorName && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {course.instructorName}
                      </span>
                    )}
                    {course.category && (
                      <Badge variant="secondary">{course.category}</Badge>
                    )}
                    <Badge className={cn(difficultyColors[course.difficulty])}>
                      {difficultyLabels[course.difficulty]}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {course.description || '코스 설명이 없습니다.'}
              </p>
            </CardContent>
          </div>
          <CardFooter className="md:w-48 flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-l">
            <div className="text-center">
              {course.enrollmentCount !== undefined && (
                <p className="text-sm text-muted-foreground">
                  수강생 {course.enrollmentCount}명
                </p>
              )}
              {course.averageRating !== undefined && (
                <p className="text-sm text-muted-foreground">
                  평점 {course.averageRating.toFixed(1)}점
                </p>
              )}
            </div>
            {isEnrolled ? (
              <Button asChild variant="secondary" className="w-full">
                <Link href={`/my-courses/${course.id}`}>학습 계속하기</Link>
              </Button>
            ) : (
              <Button onClick={onEnroll} className="w-full">
                수강신청
              </Button>
            )}
          </CardFooter>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader>
        <Link href={`/courses/${course.id}`}>
          <h3 className="text-lg font-semibold hover:text-primary transition-colors line-clamp-2">
            {course.title}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mt-2">
          {course.category && (
            <Badge variant="secondary" className="text-xs">
              {course.category}
            </Badge>
          )}
          <Badge className={cn('text-xs', difficultyColors[course.difficulty])}>
            {difficultyLabels[course.difficulty]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {course.description || '코스 설명이 없습니다.'}
        </p>
        {course.instructorName && (
          <p className="text-sm text-muted-foreground mt-4 flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {course.instructorName}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <div className="flex justify-between w-full text-sm text-muted-foreground">
          {course.enrollmentCount !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {course.enrollmentCount}명
            </span>
          )}
          {course.averageRating !== undefined && (
            <span>⭐ {course.averageRating.toFixed(1)}</span>
          )}
        </div>
        {isEnrolled ? (
          <Button asChild variant="secondary" className="w-full">
            <Link href={`/my-courses/${course.id}`}>학습 계속하기</Link>
          </Button>
        ) : (
          <Button onClick={onEnroll} className="w-full">
            수강신청
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}