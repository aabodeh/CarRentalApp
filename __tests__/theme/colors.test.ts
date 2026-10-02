import { darkColors, lightColors, type ColorTokens } from '../../src/theme';

/**
 * WCAG 2.2 contrast, computed here rather than imported so the maths is reviewable evidence for
 * the design document's accessibility audit. Run with `--verbose` to see every ratio.
 * https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio
 */
function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

/** AA thresholds: normal text, and non-text UI (component boundaries, large text). */
const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;

const INK = '#12120F';
const PAPER = '#FAF8F4';

type Pair = [label: string, foreground: string, background: string, minimum: number];

function pairsFor(c: ColorTokens): Pair[] {
  const pairs: Pair[] = [];
  for (const [bgName, bg] of [
    ['background', c.background],
    ['surface', c.surface],
  ] as const) {
    pairs.push(
      [`text on ${bgName}`, c.text, bg, AA_TEXT],
      [`textMuted on ${bgName}`, c.textMuted, bg, AA_TEXT],
      [`accent on ${bgName}`, c.accent, bg, AA_TEXT],
      [`borderStrong on ${bgName}`, c.borderStrong, bg, AA_NON_TEXT],
      [`status.pending on ${bgName}`, c.status.pending, bg, AA_TEXT],
      [`status.failed on ${bgName}`, c.status.failed, bg, AA_TEXT],
      [`status.completed on ${bgName}`, c.status.completed, bg, AA_TEXT]
    );
  }
  pairs.push(['onAccent on accent', c.onAccent, c.accent, AA_TEXT]);
  // The My bookings tab badge: a count on the failed-status colour.
  pairs.push(['surface on status.failed (tab badge)', c.surface, c.status.failed, AA_TEXT]);
  // The booking QR code. Text-level contrast, though it is not text: scanners need a strong one.
  pairs.push(['qr.foreground on qr.background', c.qr.foreground, c.qr.background, AA_TEXT]);
  return pairs;
}

describe.each([
  ['light', lightColors],
  ['dark', darkColors],
] as const)('%s theme meets WCAG AA', (_scheme, tokens) => {
  it.each(
    pairsFor(tokens).map(([label, fg, bg, min]) => {
      const ratio = contrastRatio(fg, bg);
      return [`${label}: ${ratio.toFixed(2)}:1 (needs ${min}:1)`, ratio, min] as const;
    })
  )('%s', (_label, ratio, min) => {
    expect(ratio).toBeGreaterThanOrEqual(min);
  });
});

describe('accent against both paper and ink', () => {
  it('uses the ink and paper values from the design direction', () => {
    expect(lightColors.background).toBe(PAPER);
    expect(darkColors.background).toBe(INK);
  });

  it(`light accent passes AA text contrast on paper (${contrastRatio(lightColors.accent, PAPER).toFixed(2)}:1)`, () => {
    expect(contrastRatio(lightColors.accent, PAPER)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it(`dark accent passes AA text contrast on ink (${contrastRatio(darkColors.accent, INK).toFixed(2)}:1)`, () => {
    expect(contrastRatio(darkColors.accent, INK)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  /**
   * Why there are two accents. A single colour's worst-case contrast against both paper and ink
   * peaks where the two ratios are equal: (Lp + .05)/(x) = x/(Li + .05), so x = √((Lp+.05)(Li+.05)).
   * That ceiling is below 4.5, so no one colour can be AA body text on both backgrounds.
   */
  it('no single colour can reach 4.5:1 on both paper and ink', () => {
    const ceiling = Math.sqrt((relativeLuminance(PAPER) + 0.05) / (relativeLuminance(INK) + 0.05));
    expect(ceiling).toBeLessThan(AA_TEXT);
    expect(ceiling).toBeGreaterThan(AA_NON_TEXT);
  });
});
