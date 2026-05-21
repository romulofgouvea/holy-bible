import { BiblePlanMonth, BiblePlanTemplate } from '../../models/BiblePlanModels';
import cronologicalData from './cronological-month.json';
import monthData from './year-month.json';
import yearData from './year.json';

const cronologicalMonths = cronologicalData as BiblePlanMonth[];
const monthPlan = monthData as BiblePlanMonth[];
const yearPlan = yearData as BiblePlanMonth[];

export const BIBLE_PLAN_TEMPLATES: BiblePlanTemplate[] = [
  {
    id: 'cronological-month-plan',
    title: 'Leitura Anual - Cronológica',
    description: 'Leitura cronológica da Bíblia dividida em meses.',
    icon: 'calendar',
    months: cronologicalMonths,
  },
  {
    id: 'year-month-plan',
    title: 'Leitura Anual - Dividida em Meses',
    description: 'Leitura completa da Bíblia dividida em meses.',
    icon: 'book',
    months: monthPlan,
  },
  {
    id: 'year-plan',
    title: 'Leitura Anual - Por Ano',
    description: 'Leitura da Bíblia dividida por ano.',
    icon: 'list',
    months: yearPlan,
  }
];

export function getBiblePlanTemplate(id: string): BiblePlanTemplate | undefined {
  return BIBLE_PLAN_TEMPLATES.find(t => t.id === id);
}
