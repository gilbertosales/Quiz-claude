import { describe, expect, it } from 'vitest'
import { STORAGE_KEYS } from '../../lib/storage'
import { addMyResultId, loadMyResultIds } from './myResults'

describe('ids das minhas partidas', () => {
  it('guarda o mais recente primeiro, sem repetir', () => {
    addMyResultId('a')
    addMyResultId('b')
    addMyResultId('a')
    expect(loadMyResultIds()).toEqual(['a', 'b'])
  })

  it('mantém no máximo 50 ids', () => {
    for (let i = 0; i < 60; i++) addMyResultId(`id-${i}`)
    const ids = loadMyResultIds()
    expect(ids).toHaveLength(50)
    expect(ids[0]).toBe('id-59')
  })

  it('ignora dados corrompidos', () => {
    localStorage.setItem(STORAGE_KEYS.myResults, '{"x":1}')
    expect(loadMyResultIds()).toEqual([])
  })
})
