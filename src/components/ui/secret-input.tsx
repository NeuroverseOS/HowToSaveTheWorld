import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

// Masks like a password field WITHOUT being one. Browser password managers
// (Google Passwords, 1Password, LastPass, Bitwarden) key on type="password"
// and offer to save the value as a login credential — exactly the wrong
// place for an AI API key. Masking via CSS text-security keeps the dots and
// loses the save-prompt; browsers without support fall back to
// type="password" (still guarded by the ignore attributes below).

const supportsTextSecurity =
  typeof CSS !== "undefined" && !!CSS.supports && CSS.supports("-webkit-text-security", "disc");

export interface SecretInputProps
  extends Omit<React.ComponentProps<typeof Input>, "type"> {
  /** Show the value in the clear (wire to an eye toggle). */
  reveal?: boolean;
}

export const SecretInput = React.forwardRef<HTMLInputElement, SecretInputProps>(
  ({ reveal = false, className, ...props }, ref) => (
    <Input
      {...props}
      ref={ref}
      type={reveal || supportsTextSecurity ? "text" : "password"}
      className={cn(!reveal && supportsTextSecurity && "secret-mask", className)}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      data-1p-ignore
      data-lpignore="true"
      data-bwignore="true"
      data-form-type="other"
    />
  )
);
SecretInput.displayName = "SecretInput";
