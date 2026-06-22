// Horário de funcionamento do estabelecimento.
// Estrutura salva em pizzarias.horarios (jsonb):
//   { seg: { aberto: true, abre: '18:00', fecha: '23:00' }, ter: {...}, ... }
// As chaves seguem Date.getDay(): 0=dom ... 6=sab.

const INDICE_PARA_CHAVE = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']

// Ordem de exibição no admin (começando na segunda).
export const DIAS = [
  { chave: 'seg', label: 'Segunda-feira', nome: 'Segunda', curto: 'seg' },
  { chave: 'ter', label: 'Terça-feira', nome: 'Terça', curto: 'ter' },
  { chave: 'qua', label: 'Quarta-feira', nome: 'Quarta', curto: 'qua' },
  { chave: 'qui', label: 'Quinta-feira', nome: 'Quinta', curto: 'qui' },
  { chave: 'sex', label: 'Sexta-feira', nome: 'Sexta', curto: 'sex' },
  { chave: 'sab', label: 'Sábado', nome: 'Sábado', curto: 'sáb' },
  { chave: 'dom', label: 'Domingo', nome: 'Domingo', curto: 'dom' },
]

export function horariosPadrao() {
  const base = {}
  for (const d of DIAS) {
    base[d.chave] = { aberto: false, abre: '18:00', fecha: '23:00' }
  }
  return base
}

function paraMinutos(hhmm) {
  const [h, m] = (hhmm ?? '').split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

function diaValido(dia) {
  return Boolean(dia?.aberto) && paraMinutos(dia?.abre) != null && paraMinutos(dia?.fecha) != null
}

// Retorna o status de abertura num instante.
//   { configurado:false }                                   -> nenhum horário definido
//   { configurado:true, aberto:true, fechaAs:'23:00' }      -> aberto agora
//   { configurado:true, aberto:false, proxima:{quando,hora} } -> fechado (com a próxima abertura, se houver)
export function statusAbertura(horarios, agora = new Date()) {
  if (!horarios || typeof horarios !== 'object') return { configurado: false }
  if (!DIAS.some((d) => diaValido(horarios[d.chave]))) return { configurado: false }

  const nowMin = agora.getHours() * 60 + agora.getMinutes()
  const idxHoje = agora.getDay()
  const hoje = horarios[INDICE_PARA_CHAVE[idxHoje]]
  const ontem = horarios[INDICE_PARA_CHAVE[(idxHoje + 6) % 7]]

  // Aberto pelo intervalo de hoje
  if (diaValido(hoje)) {
    const abre = paraMinutos(hoje.abre)
    const fecha = paraMinutos(hoje.fecha)
    if (fecha > abre) {
      if (nowMin >= abre && nowMin < fecha) return { configurado: true, aberto: true, fechaAs: hoje.fecha }
    } else if (nowMin >= abre) {
      // intervalo que cruza a meia-noite: aberto de "abre" até o fim do dia
      return { configurado: true, aberto: true, fechaAs: hoje.fecha }
    }
  }

  // Aberto pela "sobra" do intervalo de ontem que cruzou a meia-noite
  if (diaValido(ontem)) {
    const abre = paraMinutos(ontem.abre)
    const fecha = paraMinutos(ontem.fecha)
    if (fecha <= abre && nowMin < fecha) return { configurado: true, aberto: true, fechaAs: ontem.fecha }
  }

  // Fechado: procurar a próxima abertura (até 7 dias à frente)
  for (let i = 0; i < 7; i++) {
    const idx = (idxHoje + i) % 7
    const dia = horarios[INDICE_PARA_CHAVE[idx]]
    if (!diaValido(dia)) continue
    const abre = paraMinutos(dia.abre)

    if (i === 0) {
      if (nowMin < abre) return { configurado: true, aberto: false, proxima: { quando: 'hoje', hora: dia.abre } }
      continue // hoje já passou do horário; olhar os próximos dias
    }

    const quando =
      i === 1 ? 'amanhã' : DIAS.find((d) => d.chave === INDICE_PARA_CHAVE[idx])?.curto
    return { configurado: true, aberto: false, proxima: { quando, hora: dia.abre } }
  }

  return { configurado: true, aberto: false, proxima: null }
}

// Agrupa dias consecutivos (Seg→Dom) com o mesmo horário, para exibir a tabela.
// Retorna [{ dias: 'Segunda a Sexta', valor: '18:00 às 23:00', fechado: false }, ...]
export function agruparHorarios(horarios) {
  if (!horarios || typeof horarios !== 'object') return []

  const assinatura = (d) => {
    const dia = horarios[d.chave]
    if (!diaValido(dia)) return 'fechado'
    return `${dia.abre}-${dia.fecha}`
  }

  const grupos = []
  for (const dia of DIAS) {
    const sig = assinatura(dia)
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.sig === sig) {
      ultimo.fim = dia
    } else {
      grupos.push({ sig, inicio: dia, fim: dia })
    }
  }

  return grupos.map((g) => {
    const dias = g.inicio === g.fim ? g.inicio.nome : `${g.inicio.nome} a ${g.fim.nome}`
    const fechado = g.sig === 'fechado'
    const valor = fechado ? 'Fechado' : g.sig.replace('-', ' às ')
    return { dias, valor, fechado }
  })
}
