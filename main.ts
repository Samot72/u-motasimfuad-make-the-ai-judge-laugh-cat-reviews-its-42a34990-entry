// "The Waiter Who Never Leaves" — entry for
// u-motasimfuad-make-the-ai-judge-laugh-cat-reviews-its-42a34990.
//
// A tiny, dependency-free Node 22 program. It holds the single line a house
// cat would leave as a one-star review of its human, checks it against the
// competition gate (1 to 200 Unicode code points, one line, never blank,
// no leading/trailing whitespace or control characters), proves the
// output is deterministic by writing it twice and byte-comparing,
// then writes it to entry.txt inside the harness output directory and
// re-reads the file to prove the bytes survived the round trip. The line
// keeps the deadpan shape of a real review — stars, complaint, verdict —
// while the complaint itself is one only a cat would make.

import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// The review, exactly as it will be judged: the bowl is full, the service
// is the problem — a waiter who hovers over the table while the cat eats.
const LINE =
  "One star. The human refilled the bowl but stood there watching me eat, like a waiter who never leaves the table. Rude.";

const GATE_MIN = 1;
const GATE_MAX = 200;

/** Enforce the gate: one line, length counted in code points, not blank. */
function assertValid(line: string): number {
  if (line.includes("\n") || line.includes("\r")) {
    throw new Error("review must stay on a single line");
  }
  const count = Array.from(line).length;
  if (count < GATE_MIN || count > GATE_MAX) {
    throw new Error(
      `review must be ${GATE_MIN}-${GATE_MAX} characters, got ${count}`,
    );
  }
  if (line.trim() === "") {
    throw new Error("review must not be blank");
  }
  if (line !== line.trim()) {
    throw new Error("review must not start or end with whitespace");
  }
  for (const ch of line) {
    // Control characters (other than the newline/carriage-return already
    // rejected above) must never reach the judged output.
    if (ch.codePointAt(0)! < 0x20 || ch.codePointAt(0) === 0x7f) {
      throw new Error("review must not contain control characters");
    }
  }
  return count;
}

/** Write the line to two fresh temp dirs and prove both bytes match. */
function assertDeterministic(line: string): void {
  const first = mkdtempSync(join(tmpdir(), "cat-review-a-"));
  const second = mkdtempSync(join(tmpdir(), "cat-review-b-"));
  try {
    const a = resolve(first, "entry.txt");
    const b = resolve(second, "entry.txt");
    writeFileSync(a, line, { encoding: "utf8" });
    writeFileSync(b, line, { encoding: "utf8" });
    if (readFileSync(a, "utf8") !== readFileSync(b, "utf8")) {
      throw new Error("determinism check failed: two writes differ");
    }
  } finally {
    rmSync(first, { recursive: true, force: true });
    rmSync(second, { recursive: true, force: true });
  }
}

function run(): void {
  const count = assertValid(LINE);
  assertDeterministic(LINE);

  const dir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  const target = resolve(dir, "entry.txt");

  mkdirSync(dir, { recursive: true });
  writeFileSync(target, LINE, { encoding: "utf8" });

  const reread = readFileSync(target, "utf8");
  if (reread !== LINE) {
    throw new Error("verification failed: file content differs from the review");
  }

  console.log(`wrote ${target} (${count} characters)`);
  console.log(LINE);
}

run();
