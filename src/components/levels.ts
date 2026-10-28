import type { Level } from '../types/quiz'

// Cor sempre acompanhada do rótulo em texto (RNF02).
export const LEVEL_STYLES: Record<Level, { badge: string; bar: string }> = {
  negocio: {
    badge: 'bg-green-100 text-green-900 ring-green-600/30 dark:bg-green-900/40 dark:text-green-200',
    bar: 'bg-green-600 dark:bg-green-500',
  },
  basico: {
    badge: 'bg-blue-100 text-blue-900 ring-blue-600/30 dark:bg-blue-900/40 dark:text-blue-200',
    bar: 'bg-blue-600 dark:bg-blue-500',
  },
  intermediario: {
    badge:
      'bg-orange-100 text-orange-900 ring-orange-600/30 dark:bg-orange-900/40 dark:text-orange-200',
    bar: 'bg-orange-600 dark:bg-orange-500',
  },
  avancado: {
    badge:
      'bg-purple-100 text-purple-900 ring-purple-600/30 dark:bg-purple-900/40 dark:text-purple-200',
    bar: 'bg-purple-600 dark:bg-purple-500',
  },
}

export const LEVEL_DESCRIPTIONS: Record<Level, string> = {
  negocio: 'O que é o Claude Code, para que serve e quais são seus limites.',
  basico: 'Comandos e fluxos essenciais do dia a dia.',
  intermediario: 'Configuração, Plan Mode, MCP, subagents e skills.',
  avancado: 'Hooks, SDK, permissões e automação.',
}
