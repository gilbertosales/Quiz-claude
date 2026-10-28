import { z } from 'zod'
import { LEVELS } from '../types/quiz'

export const questionSchema = z.object({
  id: z.string().regex(/^[a-z]{3}-\d{2}$/),
  level: z.enum(LEVELS),
  statement: z.string().min(10),
  answer: z.boolean(),
  explanation: z.string().min(10),
  docUrl: z.string().startsWith('https://'),
  tags: z.array(z.string()).optional(),
})

export const questionBankSchema = z.array(questionSchema)
