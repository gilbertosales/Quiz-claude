import type { Level } from '../types/quiz'

// Cores dos níveis a partir dos acentos da marca (verde, azul, laranja + um roxo suave para
// Avançado, como pede o PRD). Sempre acompanhadas do rótulo em texto (RNF02).
// Pares texto/fundo conferidos para WCAG AA nos dois temas.
export const LEVEL_STYLES: Record<Level, { badge: string; bar: string }> = {
  negocio: {
    badge: 'bg-[#e9ede0] text-[#3f4d2f] dark:bg-[#2e3527] dark:text-[#c9d6b4]',
    bar: 'bg-[#788c5d]',
  },
  basico: {
    badge: 'bg-[#e3ecf5] text-[#2c4f73] dark:bg-[#25303c] dark:text-[#b9d0e8]',
    bar: 'bg-[#6a9bcc]',
  },
  intermediario: {
    badge: 'bg-[#f7e6df] text-[#8a3d22] dark:bg-[#3b2a23] dark:text-[#f2b8a4]',
    bar: 'bg-[#d97757]',
  },
  avancado: {
    badge: 'bg-[#ece5f3] text-[#553c75] dark:bg-[#332c3d] dark:text-[#d5c4ea]',
    bar: 'bg-[#9a7ab8]',
  },
}

export const LEVEL_DESCRIPTIONS: Record<Level, string> = {
  negocio: 'O que é o Claude Code, para que serve e quais são seus limites.',
  basico: 'Comandos e fluxos essenciais do dia a dia.',
  intermediario: 'Configuração, Plan Mode, MCP, subagents e skills.',
  avancado: 'Hooks, SDK, permissões e automação.',
}
