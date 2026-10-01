type Key = { label: string; grow?: number };

function row(...items: (string | Key)[]): Key[] {
  return items.map((item) => (typeof item === "string" ? { label: item } : item));
}

export const MAC_KEYS: readonly Key[][] = [
  row({ label: "esc", grow: 1.35 }, "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", { label: "delete", grow: 1.6 }),
  row({ label: "tab", grow: 1.45 }, "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", { label: "\\", grow: 1.35 }),
  row({ label: "caps", grow: 1.7 }, "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", { label: "return", grow: 1.85 }),
  row({ label: "shift", grow: 2.15 }, "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", { label: "shift", grow: 2.15 }),
  row(
    { label: "fn", grow: 1.15 },
    { label: "ctrl", grow: 1.25 },
    { label: "opt", grow: 1.15 },
    { label: "cmd", grow: 1.35 },
    { label: "", grow: 5.4 },
    { label: "cmd", grow: 1.25 },
    { label: "opt", grow: 1.1 },
    { label: "◀", grow: 1 },
    { label: "▲", grow: 1 },
    { label: "▶", grow: 1 },
  ),
];
