'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatPhoneNumber } from '@/lib/validators/profile';
import { Loader2 } from 'lucide-react';

const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, '이름은 2자 이상이어야 합니다')
    .max(100, '이름은 100자 이하여야 합니다'),
  phone: z
    .string()
    .regex(/^010-\d{4}-\d{4}$/, '올바른 전화번호 형식이 아닙니다 (010-xxxx-xxxx)')
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  onSubmit: (data: ProfileFormData) => void | Promise<void>;
  isSubmitting?: boolean;
  defaultValues?: Partial<ProfileFormData>;
}

export function ProfileForm({
  onSubmit,
  isSubmitting = false,
  defaultValues
}: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setValue('phone', formatted);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="name">이름 *</Label>
        <Input
          id="name"
          type="text"
          placeholder="실명을 입력해주세요"
          {...register('name')}
          disabled={isSubmitting}
          className="mt-1"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">휴대폰 번호 *</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="010-0000-0000"
          {...register('phone')}
          onChange={handlePhoneChange}
          disabled={isSubmitting}
          className="mt-1"
          maxLength={13}
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            처리 중...
          </>
        ) : (
          '다음'
        )}
      </Button>
    </form>
  );
}