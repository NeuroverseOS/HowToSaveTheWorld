import { z } from "zod";

export const LessonImportSchema = z.object({
  phase: z.string().min(1, "Phase is required"),
  section_id: z.number().int().positive(),
  section_name: z.string().min(1, "Section name is required"),
  lesson_number: z.number().int().positive(),
  lesson_title: z.string().min(1, "Lesson title is required"),
  tone: z.string().optional().nullable(),
  lesson_summary: z.string().optional().nullable(),
  read_block: z.string().min(1, "Read block is required"),
  systems_lesson: z.string().optional().nullable(),
  mini_framework: z.string().optional().nullable(),
  think_prompts: z.string().optional().nullable(),
  think_reflection: z.string().optional().nullable(),
  mission_drill: z.string().optional().nullable(),
  echelon_opening: z.string().optional().nullable(),
  echelon_closing: z.string().optional().nullable(),
  fog_level: z.number().int().min(0).max(5).default(0),
  story_beat: z.string().optional().nullable(),
  mission_badge_description: z.string().optional().nullable(),
  field_guide_prompt: z.string().optional().nullable(),
  // Mission Engine Stage Fields
  video_url: z.string().optional().nullable(),
  briefing: z.string().optional().nullable(),
  drill1_prompt: z.string().optional().nullable(),
  head: z.string().optional().nullable(),
  practical: z.string().optional().nullable(),
  drill2_prompt: z.string().optional().nullable(),
  debrief: z.string().optional().nullable(),
  final_question: z.string().optional().nullable(),
});

export type LessonImport = z.infer<typeof LessonImportSchema>;
