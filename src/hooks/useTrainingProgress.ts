import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { phraseService, TrainingPhase } from '@/services/phraseService';

interface TrainingProgress {
  phase: TrainingPhase;
  goldenIndex: number;
  completedPhrases: string[];
}

interface TrainingProgressRow {
  user_id: string;
  phase: string;
  golden_index: number;
  completed_phrases: string[];
  updated_at: string;
}

export const useTrainingProgress = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load progress from Supabase for authenticated users
  const loadProgress = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Use untyped query since table may not exist in generated types yet
      const { data, error } = await (supabase as any)
        .from('training_progress')
        .select('phase, golden_index, completed_phrases')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        // Table might not exist yet - this is expected
        if (error.code === '42P01') {
          console.log('Training progress table not yet created');
        } else {
          console.error('Error loading training progress:', error);
        }
        setIsLoading(false);
        return;
      }

      if (data) {
        const row = data as TrainingProgressRow;
        const progress: TrainingProgress = {
          phase: row.phase as TrainingPhase,
          goldenIndex: row.golden_index,
          completedPhrases: row.completed_phrases || []
        };
        phraseService.loadProgress(progress);
        console.log('Loaded training progress from database');
      }
    } catch (err) {
      console.error('Error in loadProgress:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Save progress to Supabase for authenticated users
  const saveProgress = useCallback(async () => {
    if (!user) {
      return; // Only save for authenticated users
    }

    setIsSaving(true);
    try {
      const progress = phraseService.getProgress();
      
      // Use untyped query since table may not exist in generated types yet
      const { error } = await (supabase as any)
        .from('training_progress')
        .upsert({
          user_id: user.id,
          phase: progress.phase,
          golden_index: progress.goldenIndex,
          completed_phrases: progress.completedPhrases,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        if (error.code === '42P01') {
          console.log('Training progress table not yet created - skipping save');
        } else {
          console.error('Error saving training progress:', error);
        }
      } else {
        console.log('Training progress saved');
      }
    } catch (err) {
      console.error('Error in saveProgress:', err);
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  // Load progress on mount
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    isLoading,
    isSaving,
    saveProgress,
    isAuthenticated: !!user
  };
};
