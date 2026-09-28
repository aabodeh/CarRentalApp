import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * True when the user has asked the OS to reduce motion. Every animation must check this and
 * skip itself (or use a duration of 0) when it is true — see src/theme/motion.ts.
 *
 * Unlike Reanimated's own `useReducedMotion`, this one listens for changes, so toggling the
 * setting while the app is open takes effect straight away.
 *
 * Starts as `false` until the OS answers. That first answer arrives before any user-triggered
 * animation could run.
 */
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
