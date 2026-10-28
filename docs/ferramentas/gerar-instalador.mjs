// Gera docs/ferramentas/instalar.html a partir de destacar-prints.js.
// Rode de novo sempre que mudar a ferramenta:  node docs/ferramentas/gerar-instalador.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pasta = dirname(fileURLToPath(import.meta.url))
const codigo = readFileSync(join(pasta, 'destacar-prints.js'), 'utf8')
const bookmarklet = 'javascript:' + encodeURIComponent(codigo)
const escaparHtml = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Instalar Destacar Prints</title>
    <style>
      :root { color-scheme: light dark; --bg: #faf9f5; --ink: #141413; --muted: #5e5d59; --line: #e8e6dc; --card: #fff; }
      @media (prefers-color-scheme: dark) { :root { --bg: #1f1e1d; --ink: #faf9f5; --muted: #b0aea5; --line: #3d3d3a; --card: #262624; } }
      body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.6 system-ui, sans-serif; }
      main { max-width: 720px; margin: 0 auto; padding: 48px 16px; }
      h1 { font-family: Georgia, serif; font-weight: 500; font-size: 2.2rem; margin: 0 0 8px; }
      p.lead { color: var(--muted); margin-top: 0; }
      .card { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 24px; margin-top: 24px; }
      .bookmarklet { display: inline-block; background: #ff3b30; color: #fff; text-decoration: none; font-weight: 700;
        padding: 12px 22px; border-radius: 999px; cursor: grab; box-shadow: 0 4px 14px rgba(255,59,48,.35); }
      ol { padding-left: 1.2rem; }
      li { margin: 6px 0; }
      kbd { border: 1px solid var(--line); border-bottom-width: 2px; border-radius: 6px; padding: 1px 6px; font-size: .85em; }
      textarea { width: 100%; height: 90px; box-sizing: border-box; font: 12px ui-monospace, monospace; border-radius: 10px;
        border: 1px solid var(--line); background: var(--bg); color: var(--ink); padding: 8px; }
      button { font: 600 14px system-ui; padding: 8px 16px; border-radius: 8px; border: 1px solid var(--line);
        background: var(--card); color: var(--ink); cursor: pointer; margin-top: 8px; }
    </style>
  </head>
  <body>
    <main>
      <h1>🖍️ Destacar Prints</h1>
      <p class="lead">Anote páginas da web antes de tirar um print: caixas vermelhas numeradas, desfoque e textos escondidos.</p>

      <section class="card" id="arrastar">
        <h2>Jeito 1: arrastar para a barra de favoritos</h2>
        <ol>
          <li>Mostre a barra de favoritos: <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd>.</li>
          <li><strong>Arraste</strong> o botão vermelho abaixo até a barra de favoritos e solte.</li>
        </ol>
        <p><a class="bookmarklet" href="${escaparHtml(bookmarklet)}" title="Arraste para a barra de favoritos">🖍️ Destacar Prints</a></p>
        <p style="color: var(--muted)">Pronto. Em qualquer site, clique no favorito <strong>🖍️ Destacar Prints</strong> para abrir o painel.</p>
      </section>

      <section class="card" id="copiar">
        <h2>Jeito 2: criar o favorito à mão</h2>
        <ol>
          <li>Clique em <strong>Copiar código</strong>.</li>
          <li>Botão direito na barra de favoritos → <strong>Adicionar página…</strong></li>
          <li>Nome: <code>🖍️ Destacar Prints</code>. Em <strong>URL</strong>, cole (<kbd>Ctrl</kbd> + <kbd>V</kbd>) e salve.</li>
        </ol>
        <textarea id="codigo" readonly>${escaparHtml(bookmarklet)}</textarea>
        <button id="copiarBtn" type="button">Copiar código</button>
        <span id="copiado" style="margin-left: 8px; color: var(--muted)"></span>
      </section>
    </main>
    <script>
      document.getElementById('copiarBtn').addEventListener('click', async () => {
        const campo = document.getElementById('codigo')
        try { await navigator.clipboard.writeText(campo.value) } catch { campo.select(); document.execCommand('copy') }
        document.getElementById('copiado').textContent = '✓ Copiado!'
      })
    </script>
  </body>
</html>
`

writeFileSync(join(pasta, 'instalar.html'), html)
console.log(
  `instalar.html gerado (favorito com ${bookmarklet.length.toLocaleString('pt-BR')} caracteres)`,
)
