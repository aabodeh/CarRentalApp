/**
 * docs/requirements-coverage.md claims that each requirement is implemented in certain files and
 * proved by certain tests. This test keeps those claims true: every path it cites must exist, every
 * test it cites must be in the file it names, and the counts in its summary table must match.
 *
 * Node's `fs` is loaded through `jest.requireActual` with just the two functions used here typed,
 * because this project does not depend on @types/node. Paths are relative to the repo root, which
 * is where Jest runs.
 */
const { existsSync, readFileSync } = jest.requireActual<{
  existsSync(path: string): boolean;
  readFileSync(path: string, encoding: 'utf8'): string;
}>('fs');

const doc = readFileSync('docs/requirements-coverage.md', 'utf8');

/** "## K2 — Queued writes with retry" … up to the next "## " heading. */
const sections = [...doc.matchAll(/^## (F\d|K\d) — .*$/gm)].map((match, i, all) => {
  const start = match.index ?? 0;
  const end = all[i + 1]?.index ?? doc.indexOf('\n---\n', start + 1);
  return { id: match[1], text: doc.slice(start, end === -1 ? undefined : end) };
});

/** Evidence lines look like: - `__tests__/x/y.test.ts` › the test's title */
const evidenceOf = (text: string) =>
  [...text.matchAll(/^- `(__tests__\/[^`]+)` › (.+)$/gm)].map((m) => ({ file: m[1], title: m[2] }));

const allEvidence = sections.flatMap((section) =>
  evidenceOf(section.text).map((e) => ({ ...e, section: section.id }))
);

describe('docs/requirements-coverage.md', () => {
  it('has a section for each of the five functional requirements and three kernel NFRs', () => {
    expect(sections.map((s) => s.id)).toEqual(['F1', 'F2', 'F3', 'F4', 'F5', 'K1', 'K2', 'K3']);
  });

  it('gives every requirement at least one implementing file and one test', () => {
    for (const section of sections) {
      expect([section.id, evidenceOf(section.text).length > 0]).toEqual([section.id, true]);
      expect([section.id, /`src\/[^`]+`/.test(section.text)]).toEqual([section.id, true]);
    }
  });

  it('only cites files that exist', () => {
    const paths = [...doc.matchAll(/`((?:src|__tests__|docs)\/[^`\s]+)`/g)].map((m) => m[1]);
    const missing = [...new Set(paths)].filter((path) => !existsSync(path));

    expect(missing).toEqual([]);
  });

  it('only cites tests that are really in the file it names', () => {
    const missing = allEvidence.filter(({ file, title }) => {
      const source = readFileSync(file, 'utf8').replace(/\\'/g, "'");
      return !source.includes(title);
    });

    expect(missing).toEqual([]);
  });

  it('states, in the summary table, the same number of tests as it lists for each requirement', () => {
    for (const section of sections) {
      const row = doc.split('\n').find((line) => line.startsWith(`| ${section.id} `));
      const stated = Number(/\| (\d+) (?:screen )?tests? \(/.exec(row ?? '')?.[1]);

      expect([section.id, stated]).toEqual([section.id, evidenceOf(section.text).length]);
    }
  });
});
