// Helper to reset state back to lesson 1
import { clearState } from "./state-engine";

export function resetToLessonOne() {
  const confirmed = window.confirm(
    "Reset your progress back to Lesson 1? This will clear all completed lessons but keep your archetype."
  );
  
  if (confirmed) {
    clearState();
    window.location.href = "/dashboard";
  }
}
