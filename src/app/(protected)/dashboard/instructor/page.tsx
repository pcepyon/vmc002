'use client'

import { InstructorDashboard } from '@/features/dashboard/components'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

type InstructorDashboardPageProps = {
  params: Promise<Record<string, never>>;
};

export default function InstructorDashboardPage({ params }: InstructorDashboardPageProps) {
  void params;
  const { user, role, isLoading } = useCurrentUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth/signin')
      } else if (role !== 'instructor') {
        router.push('/dashboard/learner')
      }
    }
  }, [user, role, isLoading, router])

  if (isLoading || !user || role !== 'instructor') {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <InstructorDashboard />
    </div>
  )
}