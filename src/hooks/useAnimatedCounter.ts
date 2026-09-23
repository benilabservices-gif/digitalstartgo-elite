import { useEffect, useRef, useState } from "react";

/**
 * Animate un nombre vers sa cible avec un easing cubique.
 * Ne fait rien si l'élément n'est pas visible (le parent gère le déclenchement).
 */
export function useAnimatedCounter(
  target: number,
  isVisible: boolean,
  duration = 1400
) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (!isVisible) return;

    startRef.current = performance.now();

    function easeOutCubic(t: number): number {
      return 1 - Math.pow(1 - t, 3);
    }

    function animate(now: number) {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(easeOutCubic(progress) * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isVisible, target, duration]);

  return value;
}
