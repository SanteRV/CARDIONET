import { useState, useEffect } from 'react';

export function LandingBackground() {
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setOffsetY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="landing-background"
      aria-hidden
      style={{
        backgroundImage: 'url(/hheart.png)',
        backgroundPosition: `right ${50 + offsetY * 0.03}%`,
        backgroundSize: '75%',
        backgroundRepeat: 'no-repeat',
        opacity: 0.7,
      }}
    />
  );
}
