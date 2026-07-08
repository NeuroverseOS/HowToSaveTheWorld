import { supabase } from "@/integrations/supabase/client";

export interface Lesson {
  id: number;
  phase: string;
  section_id: number;
  section_name: string;
  lesson_number: number;
  lesson_title: string;
  tone?: string;
  lesson_summary?: string;
  read_block: string;
  systems_lesson?: string;
  mini_framework?: string;
  think_prompts?: string;
  think_reflection?: string;
  mission_drill?: string;
  echelon_opening?: string;
  echelon_closing?: string;
  fog_level?: number;
  reflection_prompt?: string | null;
  video_intro?: string | null;
  // Harvested real footage metadata (title/channel/description) — grounds
  // the Visual Intel bridge in what the video actually shows.
  video_description?: string | null;
  story_beat?: string;
  mission_badge_description?: string;
  field_guide_prompt?: string;
  // Mission Engine Stage Fields
  video_url?: string;
  briefing?: string;
  drill1_prompt?: string;
  head?: string;
  practical?: string;
  drill2_prompt?: string;
  debrief?: string;
  final_question?: string;
}

export async function getLessonByNumber(lessonNumber: number): Promise<Lesson | null> {
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("lesson_number", lessonNumber)
    .maybeSingle();

  if (error) {
    console.error("Error fetching lesson:", error);
    return null;
  }

  return data;
}

export async function saveReflection(
  userId: string,
  lessonId: number,
  content: string,
  missionChoice?: string
) {
  const { error } = await supabase.from("user_reflections").insert({
    user_id: userId,
    lesson_id: lessonId,
    reflection_content: content,
    mission_choice: missionChoice,
  });

  if (error) {
    console.error("Error saving reflection:", error);
    throw error;
  }
}

export async function getEchelonConversation(userId: string, lessonId: number) {
  const { data, error } = await supabase
    .from("echelon_conversations")
    .select("*")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching conversation:", error);
    return [];
  }

  return data;
}