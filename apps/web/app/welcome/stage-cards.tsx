import { WELCOME_SUPPORT, type OnboardingRole } from "../../lib/onboarding";
import { Chevron } from "./mark";
import { RoleGlyph, UserMark } from "./stage-icons";
import cards from "./stage-cards.module.css";

export function StageNotes({
  role,
  title,
  body,
  pending,
  onContinue,
}: {
  role: OnboardingRole;
  title: string;
  body: string;
  pending: boolean;
  onContinue: () => void;
}) {
  return (
    <div className={cards.row}>
      <RolePanel role={role} title={title} body={body} />
      <ContinueCard title={title} pending={pending} onContinue={onContinue} />
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

