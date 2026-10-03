import { WELCOME_SUPPORT, type OnboardingRole } from "../../lib/onboarding";
import { display } from "./display-font";
import { Chevron } from "./mark";
import { RoleGlyph, UserMark } from "./stage-icons";
import cards from "./stage-cards.module.css";

export function StageNotes({
  role,
  title,
  body,
  pending,
  ready,
  onContinue,
}: {
  role: OnboardingRole;
  title: string;
  body: string;
  pending: boolean;
  ready: boolean;
  onContinue: () => void;
}) {
  return (
    <div className={cards.row}>
      <RolePanel role={role} title={title} body={body} />
      {ready ? <ScrollCue /> : <ContinueCard title={title} pending={pending} onContinue={onContinue} />}
    </div>
  );
}

function RolePanel({ role, title, body }: { role: OnboardingRole; title: string; body: string }) {
  return (
    <aside className={cards.panel}>
      <span className={cards.badge}><RoleGlyph role={role} /></span>
      <div className={cards.copy}>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
    </aside>
  );
}

function ContinueCard({ title, pending, onContinue }: { title: string; pending: boolean; onContinue: () => void }) {
  return (
    <aside className={`${cards.panel} ${cards.wide}`}>
      <span className={cards.badge}><UserMark /></span>
      <div className={cards.copy}>
        <h2>Continue</h2>
        <p>{WELCOME_SUPPORT}</p>
      </div>
      <button className={cards.cta} type="button" aria-label={`Continue as ${title}`} disabled={pending} onClick={onContinue}>
        <Chevron />
      </button>
    </aside>
  );
}

function ScrollCue() {
  return (
    <aside className={`${cards.panel} ${cards.wide} ${cards.cue}`} role="status">
      <span className={cards.track} aria-hidden="true"><span className={cards.pearl} /></span>
      <div className={cards.cueCopy}>
        <p className={cards.kicker}>The home page</p>
        <h2 className={display.className}>Scroll down</h2>
      </div>
      <span className={`${cards.whisper} ${display.className}`} aria-hidden="true">↓</span>
    </aside>
  );
}
