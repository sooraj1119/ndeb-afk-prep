import { LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';

export interface Topic {
  id: string;
  name: string;
  icon: LucideIcon | ((props: ComponentProps<'svg'>) => JSX.Element);
}

export interface Question {
  id: number;
  topicId: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  question: string;
  imageUrl?: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}
