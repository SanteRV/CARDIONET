import { useState } from 'react';

export function BodyHeartIllustration() {
  const [heartHovered, setHeartHovered] = useState(false);
  const [tooltip, setTooltip] = useState<string | null>(null);

  const handleHeartHover = (enter: boolean) => {
    setHeartHovered(enter);
    setTooltip(enter ? 'CARDIONET estima el riesgo cardíaco a partir de variables clínicas' : null);
  };

  return (
    <div
      className="body-heart-illustration body-heart-svg-large"
      onMouseEnter={() => handleHeartHover(true)}
      onMouseLeave={() => handleHeartHover(false)}
    >
      <svg
        viewBox="0 0 400 520"
        className="body-heart-svg"
        role="img"
        aria-label="Dibujo anatómico del torso humano con el corazón destacado"
      >
        <defs>
          <linearGradient id="torsoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(119, 27, 30, 0.04)" />
            <stop offset="100%" stopColor="rgba(119, 27, 30, 0.01)" />
          </linearGradient>
          <linearGradient id="heartGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6d1619" />
            <stop offset="40%" stopColor="#771b1e" />
            <stop offset="100%" stopColor="#9c2529" />
          </linearGradient>
          <linearGradient id="heartShine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Cabeza */}
        <ellipse cx="200" cy="65" rx="40" ry="46" fill="none" stroke="rgba(119, 27, 30, 0.5)" strokeWidth="2.5" strokeLinecap="round" />

        {/* Cuello */}
        <path d="M 168 108 L 165 142 L 200 148 L 235 142 L 232 108" fill="url(#torsoGrad)" stroke="rgba(119, 27, 30, 0.45)" strokeWidth="2" strokeLinejoin="round" />

        {/* Hombros y brazos */}
        <path d="M 128 148 Q 88 165 80 205 Q 75 245 95 270" stroke="rgba(119, 27, 30, 0.5)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 272 148 Q 312 165 320 205 Q 325 245 305 270" stroke="rgba(119, 27, 30, 0.5)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Torso - silueta humana: pecho, cintura, cadera */}
        <path
          d="M 95 270 
             Q 88 310 92 355 
             Q 98 400 115 440 
             L 150 465 L 200 478 L 250 465 L 285 440 
             Q 302 400 308 355 Q 312 310 305 270
             Q 275 220 240 195 L 200 185 L 160 195
             Q 125 220 95 270 Z"
          fill="url(#torsoGrad)"
          stroke="rgba(119, 27, 30, 0.5)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Costillas - dibujo anatómico */}
        <path d="M 130 190 Q 165 175 200 178 Q 235 175 270 190" stroke="rgba(119, 27, 30, 0.3)" strokeWidth="1.5" fill="none" />
        <path d="M 125 235 Q 162 218 200 222 Q 238 218 275 235" stroke="rgba(119, 27, 30, 0.3)" strokeWidth="1.5" fill="none" />
        <path d="M 120 280 Q 160 262 200 266 Q 240 262 280 280" stroke="rgba(119, 27, 30, 0.3)" strokeWidth="1.5" fill="none" />
        <path d="M 145 195 L 145 320 M 255 195 L 255 320" stroke="rgba(119, 27, 30, 0.2)" strokeWidth="1" fill="none" />

        {/* Esternón línea central */}
        <path d="M 200 175 L 200 340" stroke="rgba(119, 27, 30, 0.15)" strokeWidth="1" fill="none" />

        {/* Corazón anatómico - forma clásica con más detalle */}
        <g
          onMouseEnter={() => handleHeartHover(true)}
          onMouseLeave={() => handleHeartHover(false)}
          className="heart-zone"
          tabIndex={0}
        >
          {/* Sombra bajo el corazón */}
          <path
            d="M200 215 C 160 192 130 205 130 240 C 130 278 200 335 200 335 C 200 335 270 278 270 240 C 270 205 240 192 200 215 Z"
            fill="rgba(0,0,0,0.08)"
            transform="translate(3, 4)"
          />
          {/* Corazón principal */}
          <path
            d="M200 215 
               C 160 192 130 205 130 240 
               C 130 278 200 335 200 335 
               C 200 335 270 278 270 240 
               C 270 205 240 192 200 215 Z"
            fill="url(#heartGrad)"
            stroke="#4a0f11"
            strokeWidth="2.5"
            className={`heart-shape ${heartHovered ? 'heart-active' : ''}`}
          />
          {/* Surco entre ventrículos - detalle anatómico */}
          <path d="M 200 245 L 200 320" stroke="rgba(0,0,0,0.25)" strokeWidth="1" fill="none" />
          {/* Brillo superior */}
          <path
            d="M 168 218 Q 182 208 200 213 Q 218 208 232 218 Q 218 228 200 230 Q 182 228 168 218 Z"
            fill="url(#heartShine)"
            opacity="0.9"
          />
          <circle cx="200" cy="270" r="100" fill="transparent" className="heart-hitarea" />
        </g>

        {heartHovered && (
          <circle cx="200" cy="270" r="100" className="heart-pulse" fill="none" stroke="currentColor" strokeWidth="2" />
        )}
      </svg>
      {tooltip && (
        <div className="heart-tooltip">
          {tooltip}
        </div>
      )}
    </div>
  );
}
