import React from "react";

// Helper function to calculate brightness and return black or white for text contrast
function getContrastColor(hexColor: string) {
  if (!hexColor) return '#FFFFFF';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 2), 16);
  const b = parseInt(hex.substring(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
}

interface GuardianCardProps {
  name: string;
  config: {
    color: string;
    avatarUrl: string;
    bannerUrl: string;
    bannerOpacity: number;
    quote: string;
  };
  onClick?: () => void;
}

export function GuardianCard({ name, config, onClick }: GuardianCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center text-center transform transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:brightness-110 group relative overflow-hidden h-48 md:h-56 border border-white/10 ${onClick ? 'cursor-pointer' : ''}`}
      style={{ backgroundColor: config.color || 'var(--color-primary)' }}
    >
      {/* Avatar Circle */}
      <div 
        className="w-24 h-24 md:w-28 md:h-28 rounded-full mb-4 md:mb-5 flex flex-col items-center justify-center bg-black/10 backdrop-blur-sm overflow-hidden border-2 border-white/20 shadow-inner group-hover:scale-105 transition-transform duration-300"
      >
        {config.avatarUrl ? (
          <img src={config.avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl md:text-2xl font-bold text-muted-foreground/50">
            {name.substring(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      
      {/* Guardian Name */}
      <h3 
        className="font-bold text-sm md:text-base tracking-widest uppercase w-full px-1 z-10 drop-shadow-sm leading-tight break-words whitespace-normal"
        style={{ color: getContrastColor(config.color || '#0A1942') }}
      >
        {name}
      </h3>
    </div>
  );
}
