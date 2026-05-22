import { BiblePlanMonth, BiblePlanTemplate } from '../../models/BiblePlanModels';
import monthData from './classic-month.json';
import sixMonthsData from './classic-six-months.json';
import threeMonthsData from './classic-three-months.json';
import yearData from './classic.json';
import cronologicalData from './cronological-month.json';
import ntSixMonthsData from './nt-six-months.json';
import ntThreeMonthsData from './nt-three-months.json';

const cronologicalMonths = cronologicalData as BiblePlanMonth[];
const monthPlan = monthData as BiblePlanMonth[];
const yearPlan = yearData as BiblePlanMonth[];
const threeMonthsPlan = threeMonthsData as BiblePlanMonth[];
const ntThreeMonthsPlan = ntThreeMonthsData as BiblePlanMonth[];
const ntSixMonthsPlan = ntSixMonthsData as BiblePlanMonth[];
const sixMonthsPlan = sixMonthsData as BiblePlanMonth[];

export const BIBLE_PLAN_TEMPLATES: BiblePlanTemplate[] = [
  {
    id: 'cronological-month-plan',
    title: 'Cronológica - Mês a Mês',
    description: 'Leitura cronológica dividida em MESES.',
    icon: 'calendar',
    months: cronologicalMonths,
  },
  {
    id: 'three-months-plan',
    title: 'Clássica',
    description: 'Leitura completa em 3 MESES.',
    icon: 'fast-forward',
    months: threeMonthsPlan,
  },
  {
    id: 'six-months-plan',
    title: 'Clássica',
    description: 'Leitura completa em 6 MESES.',
    icon: 'play-circle',
    months: sixMonthsPlan,
  },
  {
    id: 'year-month-plan',
    title: 'Clássica',
    description: 'Leitura completa dividida Mês a Mês.',
    icon: 'book',
    months: monthPlan,
  },
  {
    id: 'year-plan',
    title: 'Clássica',
    description: 'Leitura completa.',
    icon: 'list',
    months: yearPlan,
  },
  {
    id: 'nt-three-months-plan',
    title: 'Novo Testamento',
    description: 'Novo Testamento em 3 MESES.',
    icon: 'bookmark',
    months: ntThreeMonthsPlan,
  },
  {
    id: 'nt-six-months-plan',
    title: 'Novo Testamento',
    description: 'Novo Testamento em 6 MESES.',
    icon: 'bookmark',
    months: ntSixMonthsPlan,
  },
];

export function getBiblePlanTemplate(id: string): BiblePlanTemplate | undefined {
  return BIBLE_PLAN_TEMPLATES.find(t => t.id === id);
}
