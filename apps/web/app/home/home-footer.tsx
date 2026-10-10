import Link from "next/link";
import styles from "./home-footer.module.css";

const LINKS = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/#explore-categories", label: "Explore" },
  { href: "/account/seller", label: "Sell" },
  { href: "/#about", label: "About" },
] as const;

export function HomeFooter() {
  return (
    <footer className={styles.footer}>
      <p>NOESIS</p>
      <nav aria-label="Footer">
        {LINKS.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
      </nav>
    </footer>
  );
}
