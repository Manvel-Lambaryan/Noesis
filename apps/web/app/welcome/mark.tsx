import { ChevronRight } from "lucide-react";
import chrome from "./chrome.module.css";

export function Monogram() {
  return <img className={chrome.mark} src="/brand/noesis-mark.png" width={40} height={40} alt="" />;
}

export function Chevron() {
  return <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />;
}
