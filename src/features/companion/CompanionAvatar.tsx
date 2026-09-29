import React from 'react';
import { Companion } from '../../types/game';

interface CompanionAvatarProps {
  companion: Companion;
  size?: number;
  interactive?: boolean;
  onPet?: () => void;
}

export const CompanionAvatar: React.FC<CompanionAvatarProps> = ({
  companion,
  size = 180,
  interactive = true,
  onPet,
}) => {
  const isHungry = companion.hunger < 35;
  const isSleepy = companion.energy < 25;
  const isExcited = companion.happiness > 80;

  // Evolution specific head ornament
  const renderEvolutionHeadpiece = () => {
    switch (companion.evolutionForm) {
      case 'Scout':
        // Compass feather
        return (
          <path
            d="M 100 45 Q 85 15 100 5 Q 115 15 100 45 Z"
            fill="#38bdf8"
            stroke="#0284c7"
            strokeWidth="2"
          />
        );
      case 'Charmer':
        // Pink blossoming flower
        return (
          <g>
            <circle cx="100" cy="30" r="14" fill="#ec4899" />
            <circle cx="86" cy="35" r="10" fill="#f43f5e" />
            <circle cx="114" cy="35" r="10" fill="#f43f5e" />
            <circle cx="100" cy="30" r="6" fill="#fef08a" />
          </g>
        );
      case 'Moon':
        // Glowing lunar crescent
        return (
          <path
            d="M 95 10 A 18 18 0 1 0 115 35 A 14 14 0 1 1 95 10 Z"
            fill="#c084fc"
            stroke="#a855f7"
          />
        );
      case 'Moss':
        // Verdant ferns
        return (
          <path
            d="M 100 40 Q 75 20 85 5 Q 105 20 100 40 Z"
            fill="#22c55e"
            stroke="#15803d"
          />
        );
      case 'Neon':
        // Cyber bloom spikes
        return (
          <path
            d="M 90 40 L 100 10 L 110 40 Z"
            fill="#06b6d4"
            stroke="#67e8f9"
            strokeWidth="2"
          />
        );
      default:
        // Seedling leaf sprout
        return (
          <path
            d="M 100 42 Q 85 22 100 12 Q 115 22 100 42 Z"
            fill="#4ade80"
            stroke="#16a34a"
            strokeWidth="1.5"
          />
        );
    }
  };

  return (
    <div
      onClick={interactive ? onPet : undefined}
      className={`relative inline-flex items-center justify-center select-none ${
        interactive ? 'cursor-pointer active:scale-95 transition-transform' : ''
      }`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="overflow-visible animate-companion-idle"
      >
        <defs>
          {/* Body gradient */}
          <radialGradient id="pipBodyGrad" cx="45%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="60%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ea580c" />
          </radialGradient>
          <filter id="pipGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient aura glow */}
        <circle
          cx="100"
          cy="115"
          r="65"
          fill="none"
          stroke="#f97316"
          strokeOpacity="0.25"
          strokeWidth="6"
          className="animate-pulse"
        />

        {/* Shadow */}
        <ellipse cx="100" cy="172" rx="46" ry="10" fill="#000000" fillOpacity="0.35" />

        {/* Little stubby feet */}
        <ellipse cx="78" cy="162" rx="14" ry="10" fill="#ea580c" />
        <ellipse cx="122" cy="162" rx="14" ry="10" fill="#ea580c" />

        {/* Headpiece (Sprout / Evolution) */}
        {renderEvolutionHeadpiece()}

        {/* Main round fluffy body */}
        <circle
          cx="100"
          cy="115"
          r="54"
          fill="url(#pipBodyGrad)"
          filter="url(#pipGlow)"
        />

        {/* Rosy Cheeks */}
        <circle cx="70" cy="122" r="8" fill="#f43f5e" fillOpacity="0.5" />
        <circle cx="130" cy="122" r="8" fill="#f43f5e" fillOpacity="0.5" />

        {/* Eyes */}
        {isSleepy ? (
          // Sleeping curved closed eyes (-_-)
          <g stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" fill="none">
            <path d="M 76 112 Q 86 118 92 112" />
            <path d="M 108 112 Q 114 118 124 112" />
          </g>
        ) : (
          // Sparkling expressive eyes
          <g>
            <ellipse cx="84" cy="110" rx="7.5" ry="11" fill="#0f172a" />
            <ellipse cx="116" cy="110" rx="7.5" ry="11" fill="#0f172a" />
            {/* Eye glints */}
            <circle cx="86" cy="106" r="3.2" fill="#ffffff" />
            <circle cx="118" cy="106" r="3.2" fill="#ffffff" />
            <circle cx="82" cy="113" r="1.5" fill="#ffffff" />
            <circle cx="114" cy="113" r="1.5" fill="#ffffff" />
          </g>
        )}

        {/* Mouth */}
        {isHungry ? (
          // Hungry mouth
          <path
            d="M 94 130 Q 100 124 106 130"
            stroke="#0f172a"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        ) : isExcited ? (
          // Big joyful open smile
          <g>
            <path
              d="M 92 124 Q 100 138 108 124 Z"
              fill="#be123c"
              stroke="#0f172a"
              strokeWidth="2.5"
            />
            <path d="M 96 128 Q 100 133 104 128" fill="#fb7185" />
          </g>
        ) : (
          // Gentle sweet curve
          <path
            d="M 94 124 Q 100 131 106 124"
            stroke="#0f172a"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Tiny hands / paws */}
        <ellipse cx="64" cy="130" rx="9" ry="7" fill="#fb923c" />
        <ellipse cx="136" cy="130" rx="9" ry="7" fill="#fb923c" />
      </svg>
    </div>
  );
};
