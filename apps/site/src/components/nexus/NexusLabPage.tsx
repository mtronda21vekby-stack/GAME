import React from "react";
import { nav } from "../../lib/nav";
import "../../experience/experience.css";

const chapters = [
  { id: "awakening", index: "01", label: "AWAKENING", title: "BLACKCROWN SYSTEM ONLINE", copy: "A protected signal wakes inside the network." },
  { id: "assembly", index: "02", label: "ASSEMBLY", title: "THE CROWN ASSEMBLES", copy: "Titanium segments converge around a living compute core." },
  { id: "inspection", index: "03", label: "INSPECTION", title: "DIGITAL CROWN NEXUS", copy: "One artifact coordinates identity, worlds and player progression." },
  { id: "core-reveal", index: "04", label: "CORE", title: "OPEN THE REACTOR", copy: "The shell parts. Energy channels align with the inner rings." },
  { id: "crown-front", index: "05", label: "CROWN//FRONT", title: "TACTICAL HEIST EXPERIENCE", copy: "A black-and-orange operation forms beyond the portal axis." },
  { id: "ecosystem", index: "06", label: "ECOSYSTEM", title: "ONE CROWN. MANY WORLDS.", copy: "Game, Lobby, Store, Arsenal, Network and Account orbit one identity." },
  { id: "enter", index: "07", label: "ENTER", title: "ENTER THE BLACKCROWN", copy: "Choose the world. The system waits for your command." },
] as const;

export function NexusLabPage() {
  const [activeChapter, setActiveChapter] = React.useState("awakening");

  React.useEffect(() => {
    const elements = chapters
      .map((chapter) => document.getElementById(`bc-nexus-${chapter.id}`))
      .filter((element): element is HTMLElement => Boolean(element));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = visible?.target.getAttribute("data-chapter");
        if (id) setActiveChapter(id);
      },
      { rootMargin: "-35% 0px -35%", threshold: [0.1, 0.5, 0.9] },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bcNexusLab" data-bc-nexus-shell="ready" data-active-chapter={activeChapter}>
      <div className="bcNexusLab__staticScene" aria-hidden="true">
        <div className="bcNexusLab__horizon" />
        <div className="bcNexusLab__ring bcNexusLab__ring--outer" />
        <div className="bcNexusLab__ring bcNexusLab__ring--inner" />
        <div className="bcNexusLab__core" />
      </div>

      <header className="bcNexusHud" aria-label="Nexus navigation">
        <button className="bcNexusHud__brand" type="button" onClick={() => nav("/")}>BLACKCROWN</button>
        <nav className="bcNexusHud__chapters" aria-label="Experience chapters">
          {chapters.map((chapter) => (
            <a
              key={chapter.id}
              href={`#bc-nexus-${chapter.id}`}
              aria-current={activeChapter === chapter.id ? "step" : undefined}
            >
              {chapter.index}
            </a>
          ))}
        </nav>
        <div className="bcNexusHud__status"><span>NEXUS LAB</span><span>SOUND OFF</span></div>
      </header>

      <main className="bcNexusStory">
        {chapters.map((chapter) => (
          <section
            key={chapter.id}
            id={`bc-nexus-${chapter.id}`}
            className="bcNexusChapter"
            data-chapter={chapter.id}
            aria-label={`${chapter.index} ${chapter.label}`}
          >
            <div className="bcNexusChapter__copy">
              <span>{chapter.index} / {chapter.label}</span>
              <h1>{chapter.title}</h1>
              <p>{chapter.copy}</p>
              {chapter.id === "inspection" ? (
                <div className="bcNexusChapter__actions">
                  <a className="bcNexusAction bcNexusAction--primary" href="#bc-nexus-core-reveal">EXPLORE THE NEXUS</a>
                  <a className="bcNexusAction" href="/games/crown-front/">ENTER CROWN//FRONT</a>
                </div>
              ) : null}
              {chapter.id === "crown-front" ? (
                <div className="bcNexusChapter__actions">
                  <a className="bcNexusAction bcNexusAction--orange" href="/games/crown-front/">ENTER THE OPERATION</a>
                  <span className="bcNexusChapter__development">DEVELOPMENT STATUS / LOCAL PROTOTYPE</span>
                </div>
              ) : null}
              {chapter.id === "ecosystem" ? (
                <div className="bcNexusModules" aria-label="BlackCrown ecosystem">
                  {[
                    ["GAME", "/game/"], ["LOBBY", "/lobby/"], ["STORE", "/store"], ["ARSENAL", "/store"],
                    ["COSMETICS", "/store"], ["ROADMAP", "/about"], ["NETWORK", "/about"], ["ACCOUNT", "/account"],
                  ].map(([label, href]) => <a key={label} href={href}>{label}</a>)}
                </div>
              ) : null}
              {chapter.id === "enter" ? (
                <div className="bcNexusChapter__actions">
                  <a className="bcNexusAction bcNexusAction--primary" href="/game/">ENTER GAME</a>
                  <a className="bcNexusAction" href="/store">OPEN STORE</a>
                  <a className="bcNexusAction" href="/account">PROFILE</a>
                </div>
              ) : null}
            </div>
          </section>
        ))}
      </main>

      <div className="bcNexusChapterMeter" aria-hidden="true">
        <span>{chapters.find((chapter) => chapter.id === activeChapter)?.index ?? "01"}</span>
        <i />
        <small>{chapters.find((chapter) => chapter.id === activeChapter)?.label ?? "AWAKENING"}</small>
      </div>
    </div>
  );
}

export default NexusLabPage;
