import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function Celebration({ isVisible, onNext }) {
  useEffect(() => {
    if (!isVisible) return;

    // Create multiple confetti bursts for dramatic effect
    const celebrateMultiple = () => {
      // Burst from center
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#CE422B', '#F46623', '#10b981', '#f59e0b', '#3b82f6'],
      });

      // Burst from left
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#CE422B', '#F46623', '#10b981'],
        });
      }, 100);

      // Burst from right
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#CE422B', '#F46623', '#f59e0b'],
        });
      }, 200);

      // Large pieces falling
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 360,
          ticks: 200,
          shapes: ['circle'],
          origin: { y: -0.1 },
          colors: ['#CE422B', '#F46623', '#10b981', '#f59e0b'],
          scalar: 1.2,
          zIndex: 10000,
        });
      }, 300);
    };

    celebrateMultiple();
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      <div className="celebration-backdrop" />
      <div className="celebration-modal">
        <div className="celebration-content">
          <h1 className="celebration-title">Exercise Completed!</h1>
          <p className="celebration-subtitle">Great job!</p>

          <div className="celebration-actions">
            <button onClick={onNext} className="btn-next-modal">
              Next Exercise
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
