'use client';

import { GraduationCap, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleSelectorProps {
  value?: 'learner' | 'instructor';
  onChange: (role: 'learner' | 'instructor') => void;
  disabled?: boolean;
}

export function RoleSelector({ value, onChange, disabled }: RoleSelectorProps) {
  const roles = [
    {
      id: 'learner' as const,
      title: '학습자',
      description: '코스를 수강하고 과제를 제출합니다',
      icon: GraduationCap,
      color: 'text-blue-600'
    },
    {
      id: 'instructor' as const,
      title: '강사',
      description: '코스를 개설하고 학생을 가르칩니다',
      icon: Users,
      color: 'text-green-600'
    }
  ];

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {roles.map((role) => {
        const Icon = role.icon;
        const isSelected = value === role.id;

        return (
          <button
            key={role.id}
            onClick={() => onChange(role.id)}
            disabled={disabled}
            className={cn(
              'relative p-6 rounded-lg border-2 transition-all',
              'hover:shadow-lg hover:scale-105',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              isSelected
                ? 'border-primary bg-primary/5 focus:ring-primary'
                : 'border-gray-200 hover:border-gray-300 focus:ring-gray-400',
              disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
            )}
          >
            <div className="flex flex-col items-center space-y-4">
              <Icon className={cn('h-16 w-16', role.color)} />
              <div className="text-center">
                <h3 className="text-lg font-semibold">{role.title}</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {role.description}
                </p>
              </div>
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <svg
                      className="h-4 w-4 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}