"use client";

import { Opening } from "../welcome/opening";
import { finishIntro } from "../welcome/actions";

export function OpeningFilm() {
  return (
    <div className="welcome-shell welcome-stage">
      <Opening onDone={() => { void finishIntro(); }} />
    </div>
  );
}
