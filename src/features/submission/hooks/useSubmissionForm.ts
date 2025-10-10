'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitAssignmentSchema, type SubmitAssignmentDto } from '../lib/dto';

const DRAFT_PREFIX = 'submission-draft';

export function useSubmissionForm(assignmentId: string) {
  const [isDirty, setIsDirty] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  const form = useForm<SubmitAssignmentDto>({
    resolver: zodResolver(SubmitAssignmentSchema),
    defaultValues: {
      content_text: '',
      content_link: '',
    },
  });

  // Watch for changes
  const watchedValues = form.watch();

  // Auto-save to localStorage
  useEffect(() => {
    if (isDirty && autoSaveEnabled) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(
          `${DRAFT_PREFIX}-${assignmentId}`,
          JSON.stringify(form.getValues())
        );
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [watchedValues, isDirty, autoSaveEnabled, assignmentId, form]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(`${DRAFT_PREFIX}-${assignmentId}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        form.reset(parsed);
      } catch (error) {
        console.error('Failed to parse draft:', error);
      }
    }
  }, [assignmentId, form]);

  // Track dirty state
  useEffect(() => {
    const subscription = form.watch(() => {
      setIsDirty(true);
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const clearDraft = () => {
    localStorage.removeItem(`${DRAFT_PREFIX}-${assignmentId}`);
    setIsDirty(false);
  };

  const saveDraft = () => {
    localStorage.setItem(
      `${DRAFT_PREFIX}-${assignmentId}`,
      JSON.stringify(form.getValues())
    );
  };

  return {
    form,
    isDirty,
    autoSaveEnabled,
    setAutoSaveEnabled,
    clearDraft,
    saveDraft,
  };
}