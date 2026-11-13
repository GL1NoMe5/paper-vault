import React from 'react';
import * as LucideIcons from 'lucide-react';

export interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

const ICON_MAP: Record<string, LucideIcons.LucideIcon> = {
  ShoppingCart: LucideIcons.ShoppingCart,
  Coffee: LucideIcons.Coffee,
  Bus: LucideIcons.Bus,
  Home: LucideIcons.Home,
  Smile: LucideIcons.Smile,
  CreditCard: LucideIcons.CreditCard,
  Sparkles: LucideIcons.Sparkles,
  ShoppingBag: LucideIcons.ShoppingBag,
  Briefcase: LucideIcons.Briefcase,
  Clock: LucideIcons.Clock,
  Laptop: LucideIcons.Laptop,
  Gift: LucideIcons.Gift,
  BookOpen: LucideIcons.BookOpen,
  Heart: LucideIcons.Heart,
  Dumbbell: LucideIcons.Dumbbell,
  Music: LucideIcons.Music,
  PawPrint: LucideIcons.PawPrint,
  Film: LucideIcons.Film,
  GraduationCap: LucideIcons.GraduationCap,
  Utensils: LucideIcons.Utensils,
  Plane: LucideIcons.Plane,
  Car: LucideIcons.Car,
  Activity: LucideIcons.Activity,
  FolderPlus: LucideIcons.FolderPlus,
  Tag: LucideIcons.Tag,
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  className = 'w-4 h-4',
  size = 18,
  strokeWidth = 2,
}) => {
  const IconComponent = ICON_MAP[name] || LucideIcons.Tag;
  return <IconComponent className={className} size={size} strokeWidth={strokeWidth} />;
};
