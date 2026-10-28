import { describe, expect, it } from 'vitest'
import { isEmailDomainAllowed, makeIdentitySchema, parseAllowedDomains } from './validation'

const domains = ['empresa.com', 'empresa.com.br']
const schema = makeIdentitySchema(domains)
const valid = { name: 'Ana Souza', email: 'ana@empresa.com', consent: true }

function errorsOf(input: unknown) {
  const r = schema.safeParse(input)
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]))
}

describe('parseAllowedDomains', () => {
  it('separa por vírgula, normaliza e ignora vazios', () => {
    expect(parseAllowedDomains(' Empresa.com, @empresa.com.br ,,')).toEqual(domains)
    expect(parseAllowedDomains('')).toEqual([])
    expect(parseAllowedDomains(undefined)).toEqual([])
  })
})

describe('isEmailDomainAllowed', () => {
  it('aceita só os domínios exatos da lista', () => {
    expect(isEmailDomainAllowed('a@empresa.com', domains)).toBe(true)
    expect(isEmailDomainAllowed('A@EMPRESA.COM.BR ', domains)).toBe(true)
    expect(isEmailDomainAllowed('a@gmail.com', domains)).toBe(false)
    expect(isEmailDomainAllowed('a@sub.empresa.com', domains)).toBe(false)
    expect(isEmailDomainAllowed('a@empresa.com.evil', domains)).toBe(false)
  })

  it('lista vazia aceita qualquer domínio', () => {
    expect(isEmailDomainAllowed('a@gmail.com', [])).toBe(true)
  })
})

describe('identity schema', () => {
  it('aceita dados válidos e normaliza nome e e-mail', () => {
    expect(schema.parse({ ...valid, name: '  Ana Souza ', email: ' Ana@Empresa.COM ' })).toEqual(
      valid,
    )
  })

  it('valida o tamanho do nome', () => {
    expect(errorsOf({ ...valid, name: ' A ' })).toHaveProperty('name')
    expect(errorsOf({ ...valid, name: 'x'.repeat(61) })).toHaveProperty('name')
    expect(errorsOf({ ...valid, name: 'x'.repeat(60) })).toEqual({})
  })

  it('rejeita e-mail inválido ou de outro domínio', () => {
    expect(errorsOf({ ...valid, email: 'ana' })).toHaveProperty(
      'email',
      'Informe um e-mail válido.',
    )
    expect(errorsOf({ ...valid, email: 'ana@gmail.com' }).email).toMatch(/corporativo/)
  })

  it('exige consentimento', () => {
    expect(errorsOf({ ...valid, consent: false })).toHaveProperty('consent')
  })
})
