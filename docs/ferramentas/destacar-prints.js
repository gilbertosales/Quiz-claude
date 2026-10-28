/*
 * Destacar Prints
 * ----------------
 * Ferramenta para anotar páginas da web antes de tirar um print: caixas vermelhas
 * numeradas com etiqueta, desfoque de áreas e troca de textos sensíveis por "••••".
 *
 * Tudo é só visual e temporário: nada é enviado nem salvo no site. Recarregar a
 * página (F5) desfaz tudo.
 *
 * Como usar: veja docs/FERRAMENTA-PRINTS.md. Em resumo, instale o favorito pelo
 * docs/ferramentas/instalar.html ou cole este arquivo no Console (F12).
 */
;(() => {
  // Rodar de novo (ex.: clicar no favorito outra vez) só mostra o painel.
  if (window.__destacarPrints) {
    window.__destacarPrints.mostrarPainel()
    return
  }

  const COR = '#ff3b30'
  const NUMEROS = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'
  const POSICOES = ['abaixo', 'acima', 'direita', 'esquerda']
  const Z = 2147483646
  const MARCA = 'data-destacar-prints'

  const estado = {
    modo: null, // 'destacar' | 'borrar' | null
    alvo: null, // elemento sob o mouse no modo atual
    contador: 0,
    numerar: true,
    historico: [], // funções para desfazer, na ordem
  }

  // ---------- utilidades ----------

  const criar = (tag, estilo = {}, texto) => {
    const el = document.createElement(tag)
    el.setAttribute(MARCA, '')
    Object.assign(el.style, estilo)
    if (texto !== undefined) el.textContent = texto
    return el
  }

  const ehDaFerramenta = (el) => !!el?.closest?.(`[${MARCA}]`)

  /** Aceita um elemento, um seletor CSS ou um texto visível na página. */
  function resolverAlvo(alvo) {
    if (alvo instanceof Element) return alvo
    if (typeof alvo !== 'string') return null
    try {
      const porSeletor = document.querySelector(alvo)
      if (porSeletor) return porSeletor
    } catch {
      // não era um seletor CSS válido: tenta como texto
    }
    const texto = (e) => (e.innerText ?? e.textContent ?? '').trim()
    const candidatos = [...document.querySelectorAll('body *')].filter(
      (e) => !ehDaFerramenta(e) && e.offsetParent !== null && texto(e) === alvo,
    )
    candidatos.sort((a, b) => texto(a).length - texto(b).length)
    return candidatos[0] ?? null
  }

  /** Retângulo do elemento em coordenadas do documento (acompanha a rolagem). */
  function retangulo(el) {
    const r = el.getBoundingClientRect()
    return { left: r.left + scrollX, top: r.top + scrollY, width: r.width, height: r.height }
  }

  /** Escolhe onde a etiqueta cabe melhor, se a posição não foi informada. */
  function posicaoAutomatica(r) {
    const espacoAbaixo = innerHeight - (r.top - scrollY + r.height)
    if (espacoAbaixo > 50) return 'abaixo'
    if (r.top - scrollY > 50) return 'acima'
    return 'direita'
  }

  function posicionarEtiqueta(etiqueta, r, posicao) {
    Object.assign(etiqueta.style, { top: '', bottom: '', left: '', right: '' })
    const pertoDaBorda = r.left - scrollX + 260 > innerWidth
    if (posicao === 'abaixo' || posicao === 'acima') {
      etiqueta.style[posicao === 'abaixo' ? 'top' : 'bottom'] = r.height + 16 + 'px'
      etiqueta.style[pertoDaBorda ? 'right' : 'left'] = '-3px'
    } else {
      etiqueta.style.top = '2px'
      etiqueta.style[posicao === 'direita' ? 'left' : 'right'] = r.width + 22 + 'px'
    }
  }

  // ---------- ações ----------

  /**
   * Desenha uma caixa vermelha em volta do alvo, com etiqueta.
   * posicao: 'abaixo' | 'acima' | 'direita' | 'esquerda' (padrão: automática)
   */
  function destacar(alvo, texto = '', posicao) {
    const el = resolverAlvo(alvo)
    if (!el) {
      console.warn('[Destacar Prints] Não encontrei:', alvo)
      return null
    }
    const r = retangulo(el)
    const caixa = criar('div', {
      position: 'absolute',
      left: r.left - 6 + 'px',
      top: r.top - 6 + 'px',
      width: r.width + 12 + 'px',
      height: r.height + 12 + 'px',
      border: `3px solid ${COR}`,
      borderRadius: '10px',
      boxShadow: '0 0 0 4px rgba(255,59,48,.25)',
      boxSizing: 'border-box',
      pointerEvents: 'none',
      zIndex: Z,
    })
    if (texto) {
      if (estado.numerar) {
        texto = `${NUMEROS[estado.contador] ?? estado.contador + 1 + '.'} ${texto}`
        estado.contador++
      }
      const etiqueta = criar(
        'div',
        {
          position: 'absolute',
          background: COR,
          color: '#fff',
          font: '700 15px/1.2 system-ui, sans-serif',
          padding: '5px 12px',
          borderRadius: '999px',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,.35)',
        },
        texto,
      )
      posicionarEtiqueta(
        etiqueta,
        { ...r, height: r.height + 12, width: r.width + 12 },
        posicao ?? posicaoAutomatica(r),
      )
      caixa.appendChild(etiqueta)
    }
    document.body.appendChild(caixa)
    estado.historico.push(() => {
      caixa.remove()
      if (texto && estado.numerar) estado.contador--
    })
    return caixa
  }

  /** Desfoca o alvo (avatar, nomes, dados pessoais). */
  function borrar(alvo, intensidade = 6) {
    const el = resolverAlvo(alvo)
    if (!el) return null
    const anterior = el.style.filter
    el.style.filter = `blur(${intensidade}px)`
    estado.historico.push(() => (el.style.filter = anterior))
    return el
  }

  /**
   * Troca, em toda a página, um texto (ou expressão regular) por outro.
   * Útil para esconder e-mails, chaves e nomes antes do print.
   */
  function mascarar(procurar, trocarPor = '••••••••') {
    const re =
      procurar instanceof RegExp
        ? new RegExp(
            procurar.source,
            procurar.flags.includes('g') ? procurar.flags : procurar.flags + 'g',
          )
        : new RegExp(procurar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    const desfazer = []
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    while (w.nextNode()) {
      const no = w.currentNode
      if (ehDaFerramenta(no.parentElement)) continue
      const original = no.nodeValue
      const novo = original.replace(re, trocarPor)
      if (novo !== original) {
        no.nodeValue = novo
        desfazer.push(() => (no.nodeValue = original))
      }
    }
    document.querySelectorAll('input, textarea').forEach((campo) => {
      if (ehDaFerramenta(campo)) return
      const original = campo.value
      const novo = original.replace(re, trocarPor)
      if (novo !== original) {
        campo.value = novo
        desfazer.push(() => (campo.value = original))
      }
    })
    if (desfazer.length) estado.historico.push(() => desfazer.forEach((f) => f()))
    return desfazer.length
  }

  /** Atalho: esconde qualquer endereço de e-mail visível. */
  const mascararEmails = () => mascarar(/[\w.+-]+@[\w-]+\.[\w.-]+/g, 'seu-email@exemplo.com')

  function desfazer() {
    const f = estado.historico.pop()
    if (f) f()
  }

  function limpar() {
    while (estado.historico.length) desfazer()
    estado.contador = 0
  }

  // ---------- modo clique (para quem não programa) ----------

  const contornoHover = criar('div', {
    position: 'absolute',
    border: `2px dashed ${COR}`,
    borderRadius: '8px',
    background: 'rgba(255,59,48,.08)',
    pointerEvents: 'none',
    zIndex: Z,
    display: 'none',
  })
  const dicaHover = criar('div', {
    position: 'fixed',
    left: '50%',
    top: '12px',
    transform: 'translateX(-50%)',
    background: '#141413',
    color: '#fff',
    font: '600 13px system-ui, sans-serif',
    padding: '8px 14px',
    borderRadius: '999px',
    zIndex: Z + 1,
    display: 'none',
    boxShadow: '0 4px 14px rgba(0,0,0,.3)',
  })

  /** Fundo da página e áreas quase do tamanho da tela não são alvos úteis. */
  function grandeDemais(el) {
    if (el === document.body || el === document.documentElement) return true
    const r = el.getBoundingClientRect()
    return r.width * r.height > innerWidth * innerHeight * 0.75
  }

  function mostrarContorno(el) {
    if (el && grandeDemais(el)) el = null
    estado.alvo = el
    if (!el) return (contornoHover.style.display = 'none')
    const r = retangulo(el)
    Object.assign(contornoHover.style, {
      display: 'block',
      left: r.left - 4 + 'px',
      top: r.top - 4 + 'px',
      width: r.width + 8 + 'px',
      height: r.height + 8 + 'px',
    })
  }

  function entrarModo(modo) {
    sairModo()
    estado.modo = modo
    dicaHover.textContent =
      modo === 'destacar'
        ? 'Clique no que quer destacar  ·  ↑ pega a área maior  ·  Esc sai'
        : 'Clique no que quer borrar  ·  ↑ pega a área maior  ·  Esc sai'
    dicaHover.style.display = 'block'
    document.documentElement.style.cursor = 'crosshair'
    atualizarBotoes()
  }

  function sairModo() {
    estado.modo = null
    mostrarContorno(null)
    dicaHover.style.display = 'none'
    document.documentElement.style.cursor = ''
    caixaTexto.style.display = 'none'
    atualizarBotoes()
  }

  // Caixa para digitar a etiqueta depois do clique.
  const caixaTexto = criar('div', {
    position: 'absolute',
    zIndex: Z + 1,
    background: '#141413',
    padding: '10px',
    borderRadius: '12px',
    boxShadow: '0 6px 20px rgba(0,0,0,.35)',
    display: 'none',
    font: '13px system-ui, sans-serif',
    color: '#fff',
  })
  const campoEtiqueta = criar('input', {
    width: '280px',
    padding: '8px 10px',
    borderRadius: '8px',
    border: `2px solid ${COR}`,
    font: '600 14px system-ui, sans-serif',
    outline: 'none',
    color: '#141413',
    background: '#fff',
  })
  campoEtiqueta.placeholder = 'Texto da etiqueta (ex.: Clique em Salvar)'
  const ajudaEtiqueta = criar('div', { marginTop: '6px', opacity: '.85' })
  caixaTexto.append(campoEtiqueta, ajudaEtiqueta)
  let posicaoEscolhida = null
  let alvoEtiqueta = null

  function atualizarAjuda() {
    ajudaEtiqueta.textContent = `Enter confirma · Tab muda a posição (${posicaoEscolhida ?? 'automática'}) · Esc cancela`
  }

  function pedirEtiqueta(el) {
    alvoEtiqueta = el
    posicaoEscolhida = null
    const r = retangulo(el)
    Object.assign(caixaTexto.style, {
      display: 'block',
      left: Math.min(r.left, scrollX + innerWidth - 320) + 'px',
      top:
        (r.top + r.height + 70 < scrollY + innerHeight ? r.top + r.height + 12 : r.top - 80) + 'px',
    })
    campoEtiqueta.value = ''
    atualizarAjuda()
    setTimeout(() => campoEtiqueta.focus(), 0)
  }

  campoEtiqueta.addEventListener('keydown', (e) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      caixaTexto.style.display = 'none'
      mostrarContorno(null)
      destacar(alvoEtiqueta, campoEtiqueta.value.trim(), posicaoEscolhida ?? undefined)
    } else if (e.key === 'Escape') {
      caixaTexto.style.display = 'none'
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const i = POSICOES.indexOf(posicaoEscolhida)
      posicaoEscolhida = POSICOES[(i + 1) % POSICOES.length]
      atualizarAjuda()
    }
  })

  // Capturamos os eventos antes do site: no modo ativo, clicar não aciona botões/links.
  document.addEventListener(
    'mousemove',
    (e) => {
      if (!estado.modo || caixaTexto.style.display === 'block') return
      if (ehDaFerramenta(e.target)) return mostrarContorno(null)
      mostrarContorno(e.target)
    },
    true,
  )
  document.addEventListener(
    'click',
    (e) => {
      if (!estado.modo || ehDaFerramenta(e.target)) return
      e.preventDefault()
      e.stopPropagation()
      const el = estado.alvo ?? (grandeDemais(e.target) ? null : e.target)
      if (!el) return
      if (estado.modo === 'borrar') {
        borrar(el)
        mostrarContorno(null)
      } else {
        pedirEtiqueta(el)
      }
    },
    true,
  )
  document.addEventListener(
    'keydown',
    (e) => {
      if (!estado.modo || e.target === campoEtiqueta) return
      if (e.key === 'Escape') {
        e.preventDefault()
        sairModo()
      } else if (
        e.key === 'ArrowUp' &&
        estado.alvo?.parentElement &&
        estado.alvo.parentElement !== document.body
      ) {
        e.preventDefault()
        mostrarContorno(estado.alvo.parentElement)
      }
    },
    true,
  )

  // ---------- painel ----------

  const painel = criar('div', {
    position: 'fixed',
    right: '16px',
    bottom: '16px',
    zIndex: Z + 2,
    background: '#141413',
    color: '#faf9f5',
    borderRadius: '14px',
    padding: '12px',
    width: '230px',
    font: '13px system-ui, sans-serif',
    boxShadow: '0 10px 30px rgba(0,0,0,.4)',
    border: '1px solid #3d3d3a',
  })
  const titulo = criar(
    'div',
    {
      fontWeight: '700',
      fontSize: '14px',
      marginBottom: '8px',
      display: 'flex',
      justifyContent: 'space-between',
    },
    '',
  )
  titulo.append(criar('span', {}, '🖍️ Destacar Prints'))
  const fechar = criar(
    'button',
    { all: 'unset', cursor: 'pointer', opacity: '.7', padding: '0 4px' },
    '✕',
  )
  fechar.title = 'Fechar a ferramenta (os destaques continuam)'
  titulo.append(fechar)

  const estiloBotao = {
    all: 'unset',
    boxSizing: 'border-box',
    display: 'block',
    width: '100%',
    padding: '8px 10px',
    marginTop: '6px',
    borderRadius: '8px',
    background: '#30302e',
    cursor: 'pointer',
    font: '600 13px system-ui, sans-serif',
    color: '#faf9f5',
    textAlign: 'left',
  }
  const botao = (texto, titulo, acao) => {
    const b = criar('button', estiloBotao, texto)
    b.title = titulo
    b.addEventListener('click', (e) => {
      e.stopPropagation()
      acao()
    })
    return b
  }

  const btnDestacar = botao(
    '🟥 Destacar (clique na página)',
    'Clique num elemento e escreva a etiqueta',
    () => (estado.modo === 'destacar' ? sairModo() : entrarModo('destacar')),
  )
  const btnBorrar = botao(
    '🌫️ Borrar (clique na página)',
    'Clique num elemento para desfocar',
    () => (estado.modo === 'borrar' ? sairModo() : entrarModo('borrar')),
  )

  const linhaMascara = criar('div', { display: 'flex', gap: '6px', marginTop: '6px' })
  const campoMascara = criar('input', {
    flex: '1',
    minWidth: '0',
    padding: '7px 8px',
    borderRadius: '8px',
    border: '1px solid #3d3d3a',
    background: '#262624',
    color: '#faf9f5',
    font: '13px system-ui, sans-serif',
  })
  campoMascara.placeholder = 'Texto a esconder'
  const btnMascarar = criar('button', { ...estiloBotao, width: 'auto', marginTop: '0' }, '••')
  btnMascarar.title = 'Troca esse texto por •••• em toda a página'
  const aplicarMascara = () => {
    if (campoMascara.value.trim()) mascarar(campoMascara.value.trim())
    campoMascara.value = ''
  }
  btnMascarar.addEventListener('click', aplicarMascara)
  campoMascara.addEventListener('keydown', (e) => {
    e.stopPropagation()
    if (e.key === 'Enter') aplicarMascara()
  })
  linhaMascara.append(campoMascara, btnMascarar)

  const btnEmails = botao('✉️ Esconder e-mails', 'Troca todos os e-mails visíveis', mascararEmails)

  const linhaNumerar = criar('label', {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '8px',
    cursor: 'pointer',
  })
  const chkNumerar = criar('input')
  chkNumerar.type = 'checkbox'
  chkNumerar.checked = true
  chkNumerar.addEventListener('change', () => (estado.numerar = chkNumerar.checked))
  linhaNumerar.append(chkNumerar, criar('span', {}, 'Numerar etiquetas (①②③)'))

  const linhaAcoes = criar('div', { display: 'flex', gap: '6px' })
  linhaAcoes.append(
    botao('↶ Desfazer', 'Desfaz a última ação', desfazer),
    botao('🧹 Limpar', 'Remove tudo o que foi feito', limpar),
  )

  const btnOcultar = botao(
    '📸 Esconder painel para o print',
    'Clique no favorito de novo para trazer o painel de volta',
    ocultarPainel,
  )
  Object.assign(btnOcultar.style, {
    background: COR,
    color: '#fff',
    marginTop: '10px',
    textAlign: 'center',
  })

  painel.append(
    titulo,
    btnDestacar,
    btnBorrar,
    linhaMascara,
    btnEmails,
    linhaNumerar,
    linhaAcoes,
    btnOcultar,
  )

  function atualizarBotoes() {
    btnDestacar.style.outline = estado.modo === 'destacar' ? `2px solid ${COR}` : 'none'
    btnBorrar.style.outline = estado.modo === 'borrar' ? `2px solid ${COR}` : 'none'
  }

  function ocultarPainel() {
    sairModo()
    painel.style.display = 'none'
  }
  function mostrarPainel() {
    painel.style.display = 'block'
  }
  fechar.addEventListener('click', (e) => {
    e.stopPropagation()
    ocultarPainel()
  })

  document.body.append(contornoHover, dicaHover, caixaTexto, painel)

  window.__destacarPrints = {
    destacar,
    borrar,
    mascarar,
    mascararEmails,
    desfazer,
    limpar,
    mostrarPainel,
    ocultarPainel,
    ajuda() {
      console.log(
        [
          'Destacar Prints, comandos para o Console:',
          "  __destacarPrints.destacar('Texto do botão' | 'seletor CSS' | elemento, 'Etiqueta', 'abaixo'|'acima'|'direita'|'esquerda')",
          "  __destacarPrints.borrar('Texto' | 'seletor' | elemento)",
          "  __destacarPrints.mascarar('texto a esconder', 'troca por')",
          '  __destacarPrints.mascararEmails()',
          '  __destacarPrints.desfazer() / limpar() / mostrarPainel() / ocultarPainel()',
        ].join('\n'),
      )
    },
  }
  console.log('[Destacar Prints] pronto. Digite __destacarPrints.ajuda() para ver os comandos.')
})()
