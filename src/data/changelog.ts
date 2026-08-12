export type ChangelogItem = {
  version: string;
  highlights: string[];
};

export const CHANGELOG_DATA: ChangelogItem[] = [
  {
    version: "1.4.0",
    highlights: [
      "Lembretes diários para o plano de leitura, com horário configurável",
      "Pausar e retomar planos de leitura sem perder o progresso",
      "Sequência de dias seguidos de leitura (streak) no plano ativo",
      "Indicadores visuais de status do plano: atrasado, adiantado, pausado ou concluído",
      "Atalho para ir direto à leitura do dia no plano ativo",
      "Melhoria na acessibilidade da comparação de versões bíblicas em tela dividida",
      "Novo recurso de anotações vinculadas a versículos",
      "Melhoria na configuração do leitor permitindo mostrar ou não o título dos capítulos",
      "Melhoria na transição de versículos",
      "Melhorias nas pesquisas",
    ],
  },
  {
    version: "1.3.0",
    highlights: [
      "Planos de leitura com acompanhamento de progresso",
      "Títulos de seções e capítulos bíblicos integrados",
      "Busca textual completa e histórico de navegação",
    ],
  },
  {
    version: "1.2.0",
    highlights: [
      "Seleção múltipla de versículos e menu de ações",
      "Melhorias na marcação colorida de versículos (destaques)",
      "Melhorias no histórico de pesquisas e navegação",
      "Melhorias no feedback tátil",
    ],
  },
  {
    version: "1.1.0",
    highlights: [
      "Busca na Bíblia com destaque de termos",
      "Seleção ágil de livros e capítulos",
      "Configurações de tamanho de fonte e modo escuro",
    ],
  },
  {
    version: "1.0.0",
    highlights: [
      "Lançamento inicial da Bíblia Sagrada",
      "Leitura offline com múltiplas versões",
      "Interface responsiva e navegação intuitiva",
      "Estudos bíblicos com editor de texto formatado",
      "Exportação de estudos em PDF e backup manual",
      "Lixeira de estudos e gerenciamento de armazenamento",
      "Backup automático, restauração e exportação",
      "Compartilhamento e cópia rápida de textos",
    ],
  },
];
