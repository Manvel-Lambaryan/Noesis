import type { OnboardingStep } from "../../lib/onboarding";
import styles from "./welcome.module.css";

const STEPS: { id: OnboardingStep; label: string }[] = [
  { id: 1, label: "Your role" },
  { id: 2, label: "Your goals" },
  { id: 3, label: "Get started" },
];

export function Progress({ step, onBack }: { step: OnboardingStep; onBack: (step: OnboardingStep) => void }) {
  return (
    <ol className={styles.track} aria-label="Onboarding progress">
      {STEPS.map((item) => (
        <ProgressStep key={item.id} item={item} step={step} onBack={onBack} />
      ))}
    </ol>
  );
}

function ProgressStep({
  item,
  step,
  onBack,
}: {
  item: { id: OnboardingStep; label: string };
  step: OnboardingStep;
  onBack: (step: OnboardingStep) => void;
}) {
  const status = item.id < step ? "complete" : item.id === step ? "current" : "upcoming";
  const marker = (
    <>
      <span className={styles.bubble} aria-hidden="true">{item.id}</span>
      <span className={styles.stepLabel}>{item.label}</span>
    </>
  );
  return (
    <li className={styles.step} data-state={status} aria-current={status === "current" ? "step" : undefined}>
      {status === "complete" ? (
        <button type="button" className={styles.stepButton} aria-label={`Back to ${item.label}`} onClick={() => onBack(item.id)}>
          {marker}
        </button>
      ) : marker}
    </li>
  );
}
