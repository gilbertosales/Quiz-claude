import { expect, test, type Page, type Route } from '@playwright/test'

const RPC = '**/rest/v1/rpc/'

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
}

function leaderboardRows(meName: string) {
  return [
    {
      position: 1,
      name: 'Bia',
      score: 48,
      correct_count: 19,
      duration_ms: 300_000,
      created_at: '2026-10-01T10:00:00Z',
      is_me: false,
    },
    {
      position: 2,
      name: meName,
      score: 30,
      correct_count: 14,
      duration_ms: 200_000,
      created_at: '2026-10-27T10:00:00Z',
      is_me: true,
    },
  ]
}

async function identify(page: Page, email = 'ana@empresa.com') {
  await page.goto('/')
  await page.getByRole('button', { name: 'Começar', exact: true }).click()
  await page.getByLabel('Nome', { exact: true }).fill('Ana Souza')
  await page.getByLabel('E-mail corporativo').fill(email)
  await page.getByLabel(/Concordo/).check()
  await page.getByRole('button', { name: 'Começar o quiz' }).click()
}

/** Responde `count` perguntas pelo teclado, passando pelas telas de transição. */
async function answer(page: Page, count: number, key = 'v') {
  for (let i = 1; i <= count; i++) {
    await expect(page.getByRole('heading', { name: `Pergunta ${i} de 20` })).toBeVisible()
    await page.keyboard.press(key)
    await expect(page.getByText(/(Correto!|Incorreto)$/)).toBeVisible()
    await page.keyboard.press('Enter')
    if (i % 5 === 0 && i < 20) {
      await expect(page.getByRole('heading', { name: /concluído: \d\/5/ })).toBeVisible()
      await page.keyboard.press('Enter')
    }
  }
}

test('partida completa pelo teclado, envio e ranking sem e-mails', async ({ page }) => {
  const submitted: Record<string, unknown>[] = []
  await page.route(RPC + 'submit_result', async (route) => {
    submitted.push(route.request().postDataJSON())
    await json(route, 'b6f0a1d2-0000-4000-8000-000000000000')
  })
  const leaderboardCalls: Record<string, unknown>[] = []
  await page.route(RPC + 'get_leaderboard', (route) => {
    leaderboardCalls.push(route.request().postDataJSON())
    return json(route, leaderboardRows('Ana Souza'))
  })

  await identify(page)
  await answer(page, 20)

  await expect(page.getByRole('heading', { name: 'Resultado' })).toBeVisible()
  await expect(page.getByText(/Resultado salvo no ranking/)).toBeVisible()
  await expect(page.getByText('2º', { exact: true })).toBeVisible()
  expect(submitted).toHaveLength(1)
  expect(submitted[0]).toMatchObject({
    p_name: 'Ana Souza',
    p_email: 'ana@empresa.com',
    p_app_version: 'e2e',
  })
  expect(submitted[0].p_question_ids).toHaveLength(20)
  expect(submitted[0].p_client_game_id).toMatch(/^[0-9a-f-]{36}$/)
  // O ranking identifica a pessoa pelo id devolvido no envio, nunca pelo e-mail.
  expect(leaderboardCalls.at(-1)).toEqual({
    p_limit: 50,
    p_result_ids: ['b6f0a1d2-0000-4000-8000-000000000000'],
  })

  await page.getByRole('button', { name: 'Ver ranking' }).click()
  const table = page.getByRole('table')
  await expect(table).toBeVisible()
  await expect(table.getByRole('row', { name: /Ana Souza/ })).toHaveAttribute(
    'aria-current',
    'true',
  )
  await expect(page.locator('body')).not.toContainText('@')
})

test('rejeita e-mail fora dos domínios permitidos', async ({ page }) => {
  await identify(page, 'ana@gmail.com')
  await expect(page.getByText(/Use seu e-mail corporativo/)).toBeVisible()
  await expect(page.getByLabel('E-mail corporativo')).toHaveAttribute('aria-invalid', 'true')
})

test('retoma a partida depois de recarregar a página', async ({ page }) => {
  await identify(page)
  await answer(page, 3)
  await expect(page.getByRole('heading', { name: 'Pergunta 4 de 20' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Pergunta 4 de 20' })).toBeVisible()
})

test('falha no envio guarda o resultado e permite reenviar', async ({ page }) => {
  let calls = 0
  await page.route(RPC + 'submit_result', (route) => {
    calls++
    return calls === 1
      ? route.abort('internetdisconnected')
      : json(route, 'b6f0a1d2-0000-4000-8000-000000000001')
  })
  await page.route(RPC + 'get_leaderboard', (route) => json(route, leaderboardRows('Ana Souza')))

  await identify(page)
  await answer(page, 20, 'f')
  await expect(page.getByText(/Não foi possível conectar/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Resultado' })).toBeVisible()

  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByText(/Resultado salvo no ranking/)).toBeVisible()
  expect(calls).toBe(2)
})

test('ranking mostra estado de erro com nova tentativa', async ({ page }) => {
  let fail = true
  await page.route(RPC + 'get_leaderboard', (route) =>
    fail ? json(route, { message: 'boom' }, 500) : json(route, leaderboardRows('Outra Pessoa')),
  )
  await page.goto('/ranking')
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar o ranking')
  fail = false
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('table')).toBeVisible()
})

test('não há scroll horizontal', async ({ page }) => {
  await page.route(RPC + 'get_leaderboard', (route) => json(route, leaderboardRows('Ana Souza')))
  for (const path of ['/', '/ranking']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  }
  await identify(page)
  await page.keyboard.press('v')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})

test('ao terminar a partida, o foco vai para o título do resultado', async ({ page }) => {
  await page.route(RPC + 'submit_result', (route) =>
    json(route, 'b6f0a1d2-0000-4000-8000-000000000002'),
  )
  await page.route(RPC + 'get_leaderboard', (route) => json(route, leaderboardRows('Ana Souza')))
  await identify(page)
  await expect(page).toHaveTitle('Pergunta 1 de 20 · Quiz Claude Code')
  await answer(page, 20)
  await expect(page.getByRole('heading', { level: 1, name: 'Resultado' })).toBeFocused()
  await expect(page).toHaveTitle('Resultado · Quiz Claude Code')
})

test('falha ao carregar uma tela mostra erro recuperável em vez de tela em branco', async ({
  page,
}) => {
  await page.route('**/assets/RankingPage-*.js', (route) => route.abort())
  await page.goto('/')
  await page.getByRole('button', { name: 'Ver ranking' }).click()
  await expect(page.getByRole('alert')).toContainText('Algo deu errado')
  await page.getByRole('button', { name: 'Voltar ao início' }).click()
  await expect(page.getByRole('heading', { level: 1, name: /Verdadeiro ou Falso/ })).toBeVisible()
})
