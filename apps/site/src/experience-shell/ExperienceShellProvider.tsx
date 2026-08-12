import type { ReactNode } from "react";
import { ExperienceProvider } from "../experience/ExperienceProvider";

export function ExperienceShellProvider({ children }: { children: ReactNode }) {
  return <ExperienceProvider>{children}</ExperienceProvider>;
}

