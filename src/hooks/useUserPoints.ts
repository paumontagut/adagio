import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserPoints {
  totalPoints: number;
  feedbackCount: number;
  correctionsCount: number;
}

const EMPTY: UserPoints = {
  totalPoints: 0,
  feedbackCount: 0,
  correctionsCount: 0,
};

/**
 * Lee y suscribe los puntos del usuario actual desde `user_points`.
 * El trigger en BD se encarga de incrementarlos al guardar feedback.
 */
export function useUserPoints() {
  const { user } = useAuth();
  const [points, setPoints] = useState<UserPoints>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setPoints(EMPTY);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('user_points')
      .select('total_points, feedback_count, corrections_count')
      .eq('user_id', user.id)
      .maybeSingle();

    setPoints({
      totalPoints: data?.total_points ?? 0,
      feedbackCount: data?.feedback_count ?? 0,
      correctionsCount: data?.corrections_count ?? 0,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Suscripción realtime para actualizar el badge en vivo
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`user_points:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_points',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  return { ...points, loading, refresh };
}
