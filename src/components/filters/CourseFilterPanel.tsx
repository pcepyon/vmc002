'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import type { DifficultyLevel } from '@/features/course/lib/dto';

interface CourseFilterPanelProps {
  category?: string;
  difficulty?: DifficultyLevel;
  onCategoryChange: (category: string | undefined) => void;
  onDifficultyChange: (difficulty: DifficultyLevel | undefined) => void;
  onReset: () => void;
}

export function CourseFilterPanel({
  category,
  difficulty,
  onCategoryChange,
  onDifficultyChange,
  onReset
}: CourseFilterPanelProps) {
  const categories = [
    { value: 'web', label: '웹 개발' },
    { value: 'mobile', label: '모바일' },
    { value: 'database', label: '데이터베이스' },
    { value: 'devops', label: 'DevOps' },
    { value: 'ai', label: 'AI/ML' },
    { value: 'design', label: '디자인' }
  ];

  const difficulties: Array<{ value: DifficultyLevel; label: string }> = [
    { value: 'beginner', label: '초급' },
    { value: 'intermediate', label: '중급' },
    { value: 'advanced', label: '고급' }
  ];

  const hasFilters = category || difficulty;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">필터</CardTitle>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            초기화
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 카테고리 필터 */}
        <div>
          <Label className="text-sm font-medium mb-3 block">카테고리</Label>
          <RadioGroup
            value={category || 'all'}
            onValueChange={(value) =>
              onCategoryChange(value === 'all' ? undefined : value)
            }
          >
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="all" id="category-all" />
              <Label
                htmlFor="category-all"
                className="text-sm font-normal cursor-pointer"
              >
                전체
              </Label>
            </div>
            {categories.map((cat) => (
              <div key={cat.value} className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value={cat.value} id={`category-${cat.value}`} />
                <Label
                  htmlFor={`category-${cat.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {cat.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* 난이도 필터 */}
        <div>
          <Label className="text-sm font-medium mb-3 block">난이도</Label>
          <RadioGroup
            value={difficulty || 'all'}
            onValueChange={(value) =>
              onDifficultyChange(
                value === 'all' ? undefined : (value as DifficultyLevel)
              )
            }
          >
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="all" id="difficulty-all" />
              <Label
                htmlFor="difficulty-all"
                className="text-sm font-normal cursor-pointer"
              >
                전체
              </Label>
            </div>
            {difficulties.map((diff) => (
              <div key={diff.value} className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value={diff.value} id={`difficulty-${diff.value}`} />
                <Label
                  htmlFor={`difficulty-${diff.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {diff.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}