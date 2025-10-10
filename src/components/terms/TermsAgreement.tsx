'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface TermsAgreementProps {
  onAgree: () => void | Promise<void>;
  isSubmitting?: boolean;
}

export function TermsAgreement({ onAgree, isSubmitting = false }: TermsAgreementProps) {
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (agreed) {
      onAgree();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">이용약관</h3>
        <ScrollArea className="h-64 w-full rounded border p-4">
          <div className="space-y-4 text-sm">
            <h4 className="font-semibold">제1조 (목적)</h4>
            <p>
              이 약관은 LMS 플랫폼(이하 "플랫폼")이 제공하는 교육 서비스의 이용조건 및
              절차, 플랫폼과 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>

            <h4 className="font-semibold">제2조 (정의)</h4>
            <p>
              1. "플랫폼"이란 회사가 운영하는 온라인 학습 관리 시스템을 의미합니다.
              <br />
              2. "회원"이란 플랫폼에 개인정보를 제공하여 회원등록을 한 자로서, 플랫폼이
              제공하는 서비스를 이용하는 자를 의미합니다.
              <br />
              3. "학습자"란 플랫폼에서 코스를 수강하는 회원을 의미합니다.
              <br />
              4. "강사"란 플랫폼에서 코스를 개설하고 운영하는 회원을 의미합니다.
            </p>

            <h4 className="font-semibold">제3조 (약관의 효력 및 변경)</h4>
            <p>
              1. 이 약관은 회원가입 시 동의함으로써 효력이 발생합니다.
              <br />
              2. 플랫폼은 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 공지사항을
              통해 공지합니다.
            </p>

            <h4 className="font-semibold">제4조 (회원가입)</h4>
            <p>
              1. 회원가입은 이용자가 약관의 내용에 동의한 후 가입신청을 하고, 플랫폼이
              이를 승인함으로써 완료됩니다.
              <br />
              2. 회원은 가입 시 실명과 실제 정보를 입력해야 하며, 허위 정보 입력 시
              서비스 이용이 제한될 수 있습니다.
            </p>

            <h4 className="font-semibold">제5조 (개인정보보호)</h4>
            <p>
              플랫폼은 회원의 개인정보를 보호하기 위해 노력하며, 개인정보 처리방침에 따라
              회원의 개인정보를 관리합니다.
            </p>

            <h4 className="font-semibold">제6조 (서비스 이용)</h4>
            <p>
              1. 학습자는 플랫폼에서 제공하는 코스를 수강하고 과제를 제출할 수 있습니다.
              <br />
              2. 강사는 코스를 개설하고 학습자의 학습을 지도할 수 있습니다.
              <br />
              3. 모든 회원은 타인의 권리를 침해하지 않는 범위 내에서 서비스를 이용해야
              합니다.
            </p>

            <h4 className="font-semibold">제7조 (책임제한)</h4>
            <p>
              플랫폼은 천재지변 또는 이에 준하는 불가항력으로 서비스를 제공할 수 없는 경우
              서비스 제공에 관한 책임이 면제됩니다.
            </p>
          </div>
        </ScrollArea>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
            disabled={isSubmitting}
          />
          <Label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            위 이용약관에 동의합니다
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!agreed || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              처리 중...
            </>
          ) : (
            '완료'
          )}
        </Button>
      </div>
    </form>
  );
}