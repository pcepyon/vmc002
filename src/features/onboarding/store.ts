import { create } from 'zustand';
import type { ProfileFormData } from '@/components/profile/ProfileForm';

type Step = 'role' | 'profile' | 'terms' | 'complete';
type UserRole = 'learner' | 'instructor';

interface OnboardingStore {
  step: Step;
  role: UserRole | null;
  profileData: ProfileFormData | null;
  termsAgreed: boolean;

  setStep: (step: Step) => void;
  setRole: (role: UserRole) => void;
  setProfileData: (data: ProfileFormData) => void;
  setTermsAgreed: (agreed: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  step: 'role',
  role: null,
  profileData: null,
  termsAgreed: false,

  setStep: (step) => set({ step }),

  setRole: (role) => set({ role }),

  setProfileData: (data) => set({ profileData: data }),

  setTermsAgreed: (agreed) => set({ termsAgreed: agreed }),

  nextStep: () => {
    const { step } = get();
    const steps: Step[] = ['role', 'profile', 'terms', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      set({ step: steps[currentIndex + 1] });
    }
  },

  prevStep: () => {
    const { step } = get();
    const steps: Step[] = ['role', 'profile', 'terms', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      set({ step: steps[currentIndex - 1] });
    }
  },

  reset: () => set({
    step: 'role',
    role: null,
    profileData: null,
    termsAgreed: false
  })
}));