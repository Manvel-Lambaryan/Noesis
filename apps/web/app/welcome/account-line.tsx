"use client";

import { motion, useReducedMotion } from "motion/react";
import { Chevron } from "./mark";
import styles from "./account-line.module.css";

const EASE = [0.22, 1, 0.36, 1] as const;

export function AccountLine({
  signedIn,
  pending,
  onSignIn,
}: {
  signedIn: boolean;
  pending: boolean;
  onSignIn: () => void;
}) {
  const reduce = useReducedMotion();
  if (signedIn) return <p className={styles.signedIn}>You&apos;re signed in.</p>;

  return (
    <motion.div
      className={styles.bar}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <p className={styles.prompt}>Already have an account?</p>
      <motion.button
        className={styles.signIn}
        type="button"
        onClick={onSignIn}
        disabled={pending}
        whileHover={reduce ? undefined : { y: -1 }}
        whileTap={reduce ? undefined : { scale: 0.98 }}
      >
        <span>Sign in</span>
        <Chevron />
      </motion.button>
    </motion.div>
  );
}
