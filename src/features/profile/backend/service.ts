import { SupabaseClient } from '@supabase/supabase-js';
import { ProfileErrors } from './error';
import type {
  CompleteProfileRequest,
  ProfileResponse,
  ProfileStatus,
  TermsAgreement
} from './schema';

export class ProfileService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * 프로필 완성 처리 (트랜잭션)
   */
  async completeProfile(
    userId: string,
    userEmail: string,
    request: CompleteProfileRequest
  ): Promise<ProfileResponse> {
    try {
      // 기존 프로필 확인
      const { data: existingProfile } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (existingProfile) {
        throw ProfileErrors.PROFILE_ALREADY_EXISTS;
      }

      // 트랜잭션으로 프로필과 약관 동의 동시 저장
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userEmail,
          name: request.name,
          phone: request.phone,
          role: request.role
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw ProfileErrors.PROFILE_UPDATE_FAILED;
      }

      // 약관 동의 저장
      const { error: termsError } = await this.supabase
        .from('terms_agreements')
        .insert({
          user_id: userId,
          version: '1.0.0'
        });

      if (termsError) {
        // 프로필 생성은 성공했지만 약관 동의 저장 실패
        // 프로필 롤백
        await this.supabase
          .from('profiles')
          .delete()
          .eq('id', userId);

        console.error('Terms agreement error:', termsError);
        throw ProfileErrors.TERMS_AGREEMENT_FAILED;
      }

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        role: profile.role,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw ProfileErrors.PROFILE_UPDATE_FAILED;
    }
  }

  /**
   * 프로필 완성도 확인
   */
  async checkProfileCompletion(userId: string): Promise<ProfileStatus> {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile) {
        return {
          isComplete: false,
          hasProfile: false,
          profile: null,
          missingFields: ['name', 'phone', 'role']
        };
      }

      const missingFields: string[] = [];
      if (!profile.name) missingFields.push('name');
      if (!profile.phone) missingFields.push('phone');
      if (!profile.role) missingFields.push('role');

      return {
        isComplete: missingFields.length === 0,
        hasProfile: true,
        profile: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          phone: profile.phone,
          role: profile.role,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at
        },
        missingFields
      };
    } catch (error) {
      console.error('Profile status check error:', error);
      return {
        isComplete: false,
        hasProfile: false,
        profile: null,
        missingFields: ['name', 'phone', 'role']
      };
    }
  }

  /**
   * 사용자 역할 조회
   */
  async getUserRole(userId: string): Promise<string | null> {
    try {
      const { data } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      return data?.role || null;
    } catch (error) {
      console.error('Get user role error:', error);
      return null;
    }
  }

  /**
   * 프로필 조회
   */
  async getProfile(userId: string): Promise<ProfileResponse | null> {
    try {
      const { data } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!data) return null;

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: data.role,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  }

  /**
   * 약관 동의 여부 확인
   */
  async hasAgreedToTerms(userId: string): Promise<boolean> {
    try {
      const { data } = await this.supabase
        .from('terms_agreements')
        .select('id')
        .eq('user_id', userId)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * 최신 약관 버전 조회
   */
  async getLatestTermsVersion(): Promise<string> {
    return '1.0.0'; // 현재는 하드코딩, 향후 설정 관리 시스템으로 이동
  }
}