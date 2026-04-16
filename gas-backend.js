/**
 * GOOGLE APPS SCRIPT — Backend MEC Summit 2026
 * ─────────────────────────────────────────────
 * Como usar:
 *  1. Acesse script.google.com e crie um novo projeto
 *  2. Cole todo este código
 *  3. Substitua SHEET_ID pelo ID da sua planilha Google Sheets
 *  4. Vá em Implantações > Nova implantação > Aplicativo da Web
 *     - Executar como: Eu mesmo
 *     - Quem tem acesso: Qualquer pessoa
 *  5. Copie a URL gerada e cole em admin.html > Configuração
 *
 * Estrutura da planilha (crie as abas abaixo):
 *  Aba "Inscritos":  | email | nome | telefone | data_inscricao | presente | horario_checkin |
 *  Aba "Presencas":  | email | nome | horario | origem |
 */

const SHEET_ID = 'COLE_AQUI_O_ID_DA_SUA_PLANILHA';
const ABA_INSCRITOS = 'Inscritos';
const ABA_PRESENCAS = 'Presencas';

// ── ROTEADOR ──────────────────────────────────────────────────────────────────

function doGet(e) {
  const action = (e.parameter && e.parameter.action) || '';

  const handlers = {
    list:    listarInscritos,
    stats:   getStats,
    search:  () => buscarInscrito(e.parameter.q || ''),
  };

  const handler = handlers[action];
  if (!handler) return jsonResponse({ error: 'Ação inválida' });

  try {
    return jsonResponse(handler());
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || '';

    if (action === 'checkin')    return jsonResponse(registrarPresenca(data));
    if (action === 'add')        return jsonResponse(adicionarInscrito(data));
    if (action === 'webhook_rd') return jsonResponse(webhookRDStation(data));

    return jsonResponse({ error: 'Ação inválida' });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// ── LISTAR INSCRITOS ──────────────────────────────────────────────────────────

function listarInscritos() {
  const sheet = getSheet(ABA_INSCRITOS);
  const rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  return rows.slice(1).map(r => ({
    email:           r[0],
    nome:            r[1],
    telefone:        r[2],
    data_inscricao:  r[3],
    presente:        r[4] === true || r[4] === 'TRUE',
    horario_checkin: r[5],
  }));
}

// ── BUSCA ─────────────────────────────────────────────────────────────────────

function buscarInscrito(q) {
  if (!q) return [];
  const q_lower = q.toLowerCase();
  return listarInscritos().filter(i =>
    (i.email || '').toLowerCase().includes(q_lower) ||
    (i.nome  || '').toLowerCase().includes(q_lower)
  );
}

// ── STATS ─────────────────────────────────────────────────────────────────────

function getStats() {
  const inscritos = listarInscritos();
  const presentes = inscritos.filter(i => i.presente).length;
  return {
    total:    inscritos.length,
    presentes,
    pendentes: inscritos.length - presentes,
    taxa:      inscritos.length > 0
                 ? Math.round((presentes / inscritos.length) * 100) + '%'
                 : '0%',
  };
}

// ── REGISTRAR PRESENÇA ────────────────────────────────────────────────────────

function registrarPresenca(data) {
  const email = (data.email || '').toLowerCase().trim();
  if (!email) return { ok: false, error: 'E-mail obrigatório' };

  const sheet  = getSheet(ABA_INSCRITOS);
  const rows   = sheet.getDataRange().getValues();
  const horario = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  let encontrado = false;

  for (let i = 1; i < rows.length; i++) {
    if ((rows[i][0] || '').toLowerCase() === email) {
      if (rows[i][4] === true || rows[i][4] === 'TRUE') {
        return { ok: false, error: 'Já fez check-in', nome: rows[i][1] };
      }
      sheet.getRange(i + 1, 5).setValue(true);
      sheet.getRange(i + 1, 6).setValue(horario);
      encontrado = true;

      // Registra também na aba de presenças
      getSheet(ABA_PRESENCAS).appendRow([
        email,
        data.nome || rows[i][1],
        horario,
        data.origem || 'admin',
      ]);

      return { ok: true, nome: rows[i][1], horario };
    }
  }

  // Não encontrou na lista → registra mesmo assim (walk-in)
  getSheet(ABA_PRESENCAS).appendRow([email, data.nome || '', horario, 'walk-in']);
  return { ok: true, walkin: true, nome: data.nome || email, horario };
}

// ── ADICIONAR INSCRITO ────────────────────────────────────────────────────────

function adicionarInscrito(data) {
  const email = (data.email || '').toLowerCase().trim();
  if (!email) return { ok: false, error: 'E-mail obrigatório' };

  const sheet = getSheet(ABA_INSCRITOS);
  const rows  = sheet.getDataRange().getValues();

  // Evita duplicatas
  for (let i = 1; i < rows.length; i++) {
    if ((rows[i][0] || '').toLowerCase() === email) {
      return { ok: false, error: 'Já inscrito' };
    }
  }

  const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  sheet.appendRow([email, data.nome || '', data.telefone || '', agora, false, '']);

  return { ok: true };
}

// ── WEBHOOK RD STATION ────────────────────────────────────────────────────────
// Configure no RD Station: Automações > Webhook > POST para a URL deste script
// Payload esperado: { "leads": [{ "email": "...", "name": "...", "mobile_phone": "..." }] }

function webhookRDStation(data) {
  const leads = data.leads || (data.lead ? [data.lead] : []);
  const resultados = leads.map(lead => adicionarInscrito({
    email:    lead.email || '',
    nome:     lead.name  || lead.nome || '',
    telefone: lead.mobile_phone || lead.telephone || '',
  }));
  return { ok: true, processados: resultados.length };
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function getSheet(nome) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(nome);

  if (!sheet) {
    sheet = ss.insertSheet(nome);
    if (nome === ABA_INSCRITOS) {
      sheet.appendRow(['email', 'nome', 'telefone', 'data_inscricao', 'presente', 'horario_checkin']);
    } else if (nome === ABA_PRESENCAS) {
      sheet.appendRow(['email', 'nome', 'horario', 'origem']);
    }
  }

  return sheet;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
