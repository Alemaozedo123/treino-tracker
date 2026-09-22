# Treino · Tracker

App simples para registrar o treino de 4 dias (Upper 1 / Lower / Upper 2 / Full Body),
com séries, repetições, cargas e progressão por faixa de repetições.

Roda no navegador do celular, funciona offline e pode ser instalado como app (PWA).
Sem conta, sem servidor: os dados ficam salvos no próprio aparelho.

## O que dá pra fazer

- **Registrar o treino série a série** — peso e reps de cada série, com o valor da sessão
  anterior sempre visível como referência.
- **Marcar a série como feita** (✓) para acompanhar quanto já saiu do treino.
- **Progressão automática por faixa** — quando você bate o topo da faixa em *todas* as
  séries de um exercício, o app marca `↑ subir carga` na próxima vez que abrir aquele dia.
- **Próximo treino sugerido** — rotaciona Dia 1 → 2 → 3 → 4 a partir do último registrado.
- **Histórico** de todas as sessões, com volume total (kg) por treino.
- **Progresso** por exercício: gráfico do maior peso por sessão e a variação desde o começo.
- **Treino em andamento** fica salvo — pode fechar o app no meio e continuar depois.
- **Backup** — exportar/importar tudo em `.json` (menu ⚙ no topo).

## Programa

Compostos: 6–10 reps · Isoladores: 10–15 reps

| Dia 1 — Upper 1 | Dia 2 — Lower | Dia 3 — Upper 2 | Dia 4 — Full Body |
|---|---|---|---|
| Barbell OHP `3×6–10` | Bulgarian Split Squat `3×6–10` | Lying Cable Lat. Raise `4×10–15` | Pendulum Squat `4×6–10` |
| Weighted Pull-up `3×6–10` | Weighted Hyperextension `3×10–15` | Plate-Loaded Row (Flat) `3×6–10` | Seated Leg Curl `3×10–15` |
| Parallel Bar Dip `3×6–10` | Leg Extension `3×10–15` | Incline DB Press `3×6–10` | Cable Straight-arm Pulldown `3×10–15` |
| Machine Lat. Raise `3×10–15` | Smith Calf Raise `4×10–15` | Seated DB Incline Curl `3×10–15` | DB Hammer Curl `3×10–15` |
| Cable Overhead Tri. Ext. `3×10–15` | Reverse Incline Crunch `3×10–15` | Lying DB Tricep Ext. `3×10–15` | Cable Rope Extension `3×10–15` |
| EZ Preacher Curl `3×10–15` | | | Kneeling Cable Crunch `3×10–15` |

**Progressão:** quando fizer o topo da faixa em todas as séries, aumente a carga e volte
para o início da faixa.

## Instalar no celular

1. Abra o link no Chrome (Android) ou Safari (iPhone).
2. Menu do navegador → **Adicionar à tela de início**.
3. Pronto: abre em tela cheia e funciona sem internet.

## Rodar local

Não tem build nem dependência — é HTML, CSS e JS puro.

```bash
python -m http.server 8777
```

Depois abra `http://localhost:8777`.

## Onde ficam os dados

Tudo no `localStorage` do navegador, só neste aparelho. Não sincroniza entre celular e
computador, e limpar os dados do site apaga o histórico — por isso o botão de backup
no menu ⚙.

## Mudar o programa

Os treinos estão no topo de [`app.js`](app.js), na constante `PROGRAM`:

```js
{ n: 'Barbell OHP', s: 3, lo: 6, hi: 10 }
//   nome            séries  faixa de reps (mín–máx)
```

Edite, salve, recarregue. O histórico é ligado ao nome do exercício, então renomear um
exercício começa o gráfico dele do zero.
