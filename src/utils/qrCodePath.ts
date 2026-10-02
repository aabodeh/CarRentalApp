import createQrCode from 'qrcode-generator';

/** Light modules around the code. The QR standard asks for four; scanners need them. */
export const QR_QUIET_ZONE = 4;

/**
 * A QR code for `data` as one SVG path: a 1×1 square per dark module, offset by the quiet zone.
 * `size` is the side of the whole drawing in modules, quiet zone included, for the `viewBox`.
 *
 * `qrcode-generator` does the encoding. Type number 0 lets it pick the smallest version that
 * fits; error correction 'M' survives about 15% damage, e.g. a cracked screen or glare.
 */
export function qrCodePath(data: string): { size: number; path: string } {
  const qr = createQrCode(0, 'M');
  qr.addData(data);
  qr.make();

  const modules = qr.getModuleCount();
  let path = '';
  for (let row = 0; row < modules; row += 1) {
    for (let col = 0; col < modules; col += 1) {
      if (qr.isDark(row, col)) {
        path += `M${col + QR_QUIET_ZONE} ${row + QR_QUIET_ZONE}h1v1h-1z`;
      }
    }
  }
  return { size: modules + 2 * QR_QUIET_ZONE, path };
}
