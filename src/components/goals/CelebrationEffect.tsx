/**
 * src/components/goals/CelebrationEffect.tsx
 * Canvas Confetti milestone celebrations for 25%, 50%, 75%, and 100% savings goals.
 */

import confetti from 'canvas-confetti';

export function triggerMilestoneCelebration(milestone: number) {
  try {
    if (milestone >= 100) {
      // 100% Grand Finale Celebration
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;

      const interval: ReturnType<typeof setInterval> = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 40 * (timeLeft / duration);
        confetti({
          particleCount,
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          origin: { x: Math.random(), y: Math.random() - 0.2 },
          colors: ['#A3C9A8', '#F4A28C', '#F9E29C', '#D8C2E8', '#F2C6CE'],
        });
      }, 250);
    } else if (milestone >= 75) {
      // 75% Major Milestone
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#A3C9A8', '#F9E29C', '#D8C2E8'],
      });
    } else if (milestone >= 50) {
      // 50% Halfway Milestone
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#F9E29C', '#F4A28C'],
      });
    } else if (milestone >= 25) {
      // 25% Encouragement Spark
      confetti({
        particleCount: 35,
        spread: 45,
        origin: { y: 0.7 },
        colors: ['#A3C9A8', '#F9E29C'],
      });
    }
  } catch (err) {
    // Graceful fallback in environments without canvas (e.g. testing)
    console.debug('Confetti celebration skipped:', err);
  }
}
