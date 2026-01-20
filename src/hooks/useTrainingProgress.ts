import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { phraseService, TrainingPhase } from '@/services/phraseService';

interface TrainingProgress {
  phase: TrainingPhase;
  goldenIndex: number;
  completedPhrases: string[];
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
      const { data, error } = await supabase
        .from('training_progress')
        .select('phase, golden_index, completed_phrases')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading training progress:', error);
        setIsLoading(false);
        return;
      }

      if (data) {
        const progress: TrainingProgress = {
          phase: data.phase as TrainingPhase,
          goldenIndex: data.golden_index,
          completedPhrases: data.completed_phrases || []
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
      
      const { error } = await supabase
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
        console.error('Error saving training progress:', error);
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
