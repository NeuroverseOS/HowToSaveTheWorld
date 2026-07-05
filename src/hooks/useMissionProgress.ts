import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MissionProgress {
  id: string;
  user_id: string;
  lesson_id: number;
  current_stage: string;
  started_at: string;
  completed_at: string | null;
  field_guide_generated: boolean;
  traits_unlocked: string[];
}

const MISSION_STAGES = [
  "briefing",
  "drill1",
  "video",
  "hp",
  "drill2",
  "debrief",
  "final",
  "complete"
];

export function useMissionProgress(lessonId: number | null) {
  const [progress, setProgress] = useState<MissionProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!lessonId) {
      setIsLoading(false);
      return;
    }
    loadProgress();
  }, [lessonId]);

  const loadProgress = async () => {
    try {
      if (!lessonId) return;

      // Load from localStorage first (local-first architecture)
      const localKey = `nv:mission:${lessonId}`;
      const localData = localStorage.getItem(localKey);
      
      if (localData) {
        setProgress(JSON.parse(localData));
        setIsLoading(false);
        return;
      }

      // Optional: Try cloud sync if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("user_lesson_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("lesson_id", lessonId)
          .maybeSingle();

        if (!error && data) {
          setProgress(data as MissionProgress | null);
          // Cache to localStorage
          localStorage.setItem(localKey, JSON.stringify(data));
        }
      }
    } catch (error) {
      console.error("Failed to load progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startMission = async () => {
    if (!lessonId) return;

    try {
      // Create local mission progress (local-first)
      const localProgress: MissionProgress = {
        id: crypto.randomUUID(),
        user_id: "local",
        lesson_id: lessonId,
        current_stage: "briefing",
        started_at: new Date().toISOString(),
        completed_at: null,
        field_guide_generated: false,
        traits_unlocked: [],
      };

      // Save to localStorage
      const localKey = `nv:mission:${lessonId}`;
      localStorage.setItem(localKey, JSON.stringify(localProgress));
      setProgress(localProgress);

      // Optional: Sync to cloud if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("user_lesson_progress")
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            current_stage: "briefing",
          })
          .select()
          .single();

        if (data) {
          const updatedProgress = data as MissionProgress;
          localStorage.setItem(localKey, JSON.stringify(updatedProgress));
          setProgress(updatedProgress);
        }
      }
      
      return localProgress;
    } catch (error) {
      console.error("Failed to start mission:", error);
      return null;
    }
  };

  const advanceStage = async () => {
    if (!progress) return;

    const currentIndex = MISSION_STAGES.indexOf(progress.current_stage);
    if (currentIndex === -1 || currentIndex >= MISSION_STAGES.length - 1) {
      return;
    }

    const nextStage = MISSION_STAGES[currentIndex + 1];

    try {
      const updates: any = {
        current_stage: nextStage,
      };

      // If moving to complete stage, mark as completed
      if (nextStage === "complete") {
        updates.completed_at = new Date().toISOString();
      }

      const updatedProgress = { ...progress, ...updates };
      
      // Save to localStorage
      const localKey = `nv:mission:${progress.lesson_id}`;
      localStorage.setItem(localKey, JSON.stringify(updatedProgress));
      setProgress(updatedProgress);

      // Optional: Sync to cloud if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("user_lesson_progress")
          .update(updates)
          .eq("id", progress.id);
      }
      
      return updatedProgress;
    } catch (error) {
      console.error("Failed to advance stage:", error);
      return null;
    }
  };

  const completeMission = async (traitsUnlocked: string[] = []) => {
    if (!progress) return;

    try {
      const updatedProgress = {
        ...progress,
        completed_at: new Date().toISOString(),
        current_stage: "complete",
        traits_unlocked: traitsUnlocked,
      };

      // Save to localStorage
      const localKey = `nv:mission:${progress.lesson_id}`;
      localStorage.setItem(localKey, JSON.stringify(updatedProgress));
      setProgress(updatedProgress);

      // Optional: Sync to cloud if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("user_lesson_progress")
          .update({
            completed_at: updatedProgress.completed_at,
            current_stage: "complete",
            traits_unlocked: traitsUnlocked,
          })
          .eq("id", progress.id);
      }
      
      return updatedProgress;
    } catch (error) {
      console.error("Failed to complete mission:", error);
      return null;
    }
  };

  const markFieldGuideGenerated = async () => {
    if (!progress) return;

    try {
      const updatedProgress = {
        ...progress,
        field_guide_generated: true,
      };

      // Save to localStorage
      const localKey = `nv:mission:${progress.lesson_id}`;
      localStorage.setItem(localKey, JSON.stringify(updatedProgress));
      setProgress(updatedProgress);

      // Optional: Sync to cloud if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("user_lesson_progress")
          .update({ field_guide_generated: true })
          .eq("id", progress.id);
      }
    } catch (error) {
      console.error("Failed to mark Field Guide generated:", error);
    }
  };

  return {
    progress,
    isLoading,
    startMission,
    advanceStage,
    completeMission,
    markFieldGuideGenerated,
    currentStage: progress?.current_stage || "briefing",
    isComplete: progress?.completed_at !== null,
  };
}
