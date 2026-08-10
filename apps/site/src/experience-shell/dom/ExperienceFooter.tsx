export function ExperienceFooter({ active }: { active: boolean }) {
  return (
    <footer className="bcExperienceFooter" aria-label="BlackCrown information">
      <a href="/privacy" tabIndex={active ? undefined : -1}>PRIVACY</a>
      <a href="/terms" tabIndex={active ? undefined : -1}>TERMS</a>
      <a href="/support" tabIndex={active ? undefined : -1}>SUPPORT</a>
      <span>LOCAL EXPERIENCE / V2</span>
    </footer>
  );
}

