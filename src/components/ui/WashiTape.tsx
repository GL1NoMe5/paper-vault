import React from 'react';

export type WashiColor = 'sage' | 'coral' | 'butter' | 'lavender' | 'rose' | 'sticky';

export interface WashiTapeProps {
  children: React.ReactNode;
  color?: WashiColor;
  className?: string;
  rotate?: 'none' | 'left' | 'right';
}

const COLOR_CLASSES: Record<WashiColor, { bg: string; text: string; border: string }> = {
  sage: { bg: 'bg-[#A3C9A8]/35', text: 'text-[#2F5233]', border: 'border-[#A3C9A8]/40' },
  coral: { bg: 'bg-[#F4A28C]/35', text: 'text-[#7A2E1D]', border: 'border-[#F4A28C]/40' },
  butter: { bg: 'bg-[#F9E29C]/45', text: 'text-[#6E5611]', border: 'border-[#F9E29C]/50' },
  lavender: { bg: 'bg-[#D8C2E8]/35', text: 'text-[#4A3362]', border: 'border-[#D8C2E8]/40' },
  rose: { bg: 'bg-[#F2C6CE]/35', text: 'text-[#6E2D38]', border: 'border-[#F2C6CE]/40' },
  sticky: { bg: 'bg-[#FFF6D6]', text: 'text-[#524322]', border: 'border-[#F2E2A6]' },
};

const ROTATION_CLASSES = {
  none: '',
  left: '-rotate-1',
  right: 'rotate-1',
};

export const WashiTape: React.FC<WashiTapeProps> = ({
  children,
  color = 'sage',
  className = '',
  rotate = 'none',
}) => {
  const styles = COLOR_CLASSES[color] || COLOR_CLASSES.sage;
  const rot = ROTATION_CLASSES[rotate] || '';

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-heading font-bold
        border shadow-[0_1px_3px_rgba(139,115,85,0.08)] select-none transition-transform
        ${styles.bg} ${styles.text} ${styles.border} ${rot} ${className}
      `}
    >
      {children}
    </span>
  );
};
