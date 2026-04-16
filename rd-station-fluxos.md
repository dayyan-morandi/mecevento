# Fluxos de Automação — RD Station
## MEC Summit 2026

---

## Configuração inicial

### 1. Redirect pós-formulário
No formulário `evento-marketing-esporte-clube-8ecddb510e9fe280419c`:
- Vá em **Editar formulário > Configurações > Após envio**
- Escolha **Redirecionar para URL**
- URL: `https://dayyan-morandi.github.io/mecevento/obrigado.html?email={{email}}&nome={{nome}}`

---

## Fluxo 1 — Confirmação imediata

**Gatilho:** Lead converte no formulário do evento

**Ação 1 — E-mail de confirmação (envio imediato)**
- Assunto: `✅ Sua vaga no MEC Summit 2026 está confirmada!`
- Corpo:
  ```
  Olá, {{nome}}!

  Sua inscrição no MEC Summit 2026 foi confirmada com sucesso.

  📅 25 de Maio de 2026 — Segunda-feira
  🕖 19h00 (portas abrem às 18h30)
  📍 ESPM São Paulo — R. Dr. Álvaro Alvim, 123
  🎟️ Entrada gratuita

  → Acesse seu QR code de entrada:
  https://dayyan-morandi.github.io/mecevento/checkin.html?email={{email}}&nome={{nome}}

  Guarde este e-mail. Você precisará do QR code na entrada do evento.

  Até lá!
  Equipe Marketing Esporte Clube
  ```

**Ação 2 — Tag no lead:** `inscrito-mec-summit-2026`

**Ação 3 — Webhook para Google Apps Script:**
- URL: `[URL do seu Apps Script]`
- Método: POST
- Body: `{"action":"add","email":"{{email}}","nome":"{{nome}}","telefone":"{{telefone}}"}`

---

## Fluxo 2 — Nutrição pré-evento

**Gatilho:** Lead tem a tag `inscrito-mec-summit-2026`

### E-mail 1 — 7 dias antes (18/05/2026)
- Assunto: `Faltam 7 dias para o MEC Summit 2026 🏆`
- Conteúdo: Destaque os palestrantes confirmados, o que esperar, como chegar

### E-mail 2 — 3 dias antes (22/05/2026)
- Assunto: `Você está pronto para o MEC Summit? ⚽`
- Conteúdo: Programação do evento, dicas de networking, lembrete do QR code

### E-mail 3 — 1 dia antes (24/05/2026)
- Assunto: `Amanhã é o MEC Summit 2026 — Tudo pronto? 🎯`
- Conteúdo:
  - Lembrete de horário e local
  - Link para o QR code: `https://dayyan-morandi.github.io/mecevento/checkin.html?email={{email}}&nome={{nome}}`
  - Como chegar (mapa do Google Maps)

### E-mail 4 — No dia (25/05/2026, às 10h)
- Assunto: `Hoje é o dia! MEC Summit 2026 — 19h na ESPM 🏟️`
- Conteúdo:
  - Lembrete final
  - QR code de acesso (link direto)
  - Instruções de estacionamento / transporte

---

## Fluxo 3 — Pós-evento

**Gatilho:** Tag `presente-mec-summit-2026` (adicionada pelo check-in) OU data = 26/05/2026

### Segmento A: Quem foi (tag `presente-mec-summit-2026`)

**E-mail — 1 dia depois (26/05/2026)**
- Assunto: `Obrigado por estar no MEC Summit 2026! 🙌`
- Conteúdo:
  - Agradecimento
  - Fotos / highlights do evento
  - Próximos conteúdos da plataforma MEC
  - CTA: Seguir nas redes / assinar newsletter

### Segmento B: Quem não foi (não tem tag `presente-mec-summit-2026`)

**E-mail — 2 dias depois (27/05/2026)**
- Assunto: `Você perdeu o MEC Summit, mas não perde o conteúdo 📲`
- Conteúdo:
  - Resumo do evento
  - Destaques e quotes dos palestrantes
  - CTA: Acessar conteúdo / próximo evento

---

## Segmentações recomendadas

| Tag | Quando aplicar | Uso |
|---|---|---|
| `inscrito-mec-summit-2026` | No momento da inscrição | Gatilho dos e-mails de nutrição |
| `presente-mec-summit-2026` | No check-in (via admin.html) | Segmenta quem foi vs. quem não foi |
| `lead-frio-mec` | Abriu e-mail mas não foi | Reengajamento futuro |
| `interesse-marketing-esportivo` | Todos os inscritos | Segmento permanente da base |

---

## Webhook RD Station → Google Sheets

Configure em: **Automações > Webhook**
- URL: `[URL do Google Apps Script]`
- Evento: **Conversão**
- Formulário: `evento-marketing-esporte-clube-8ecddb510e9fe280419c`
- Método: POST

O Apps Script (`gas-backend.js`) recebe o webhook e salva o inscrito automaticamente na planilha.
