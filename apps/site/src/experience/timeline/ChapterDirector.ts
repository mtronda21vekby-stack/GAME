import type { ScrollSnapshot } from "../types";
import { evaluateExperienceTimeline } from "./timeline";

export class ChapterDirector {
  evaluate(snapshot: ScrollSnapshot) {
    return evaluateExperienceTimeline(snapshot.progress, snapshot.reducedMotion);
  }
}
