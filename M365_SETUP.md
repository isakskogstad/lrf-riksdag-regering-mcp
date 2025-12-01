# LRF Riksdag & Regering - M365 Copilot Studio Setup

## Microsoft 365 Copilot Integration Guide

Detta är den **enklaste** metoden att koppla LRF Riksdag & Regering MCP-servern till Microsoft 365 Copilot tack vare native MCP-stöd i Copilot Studio.

---

## Förutsättningar

### För Klienten (LRF):
- ✅ Microsoft 365 Copilot Premium-prenumeration
- ✅ Tillgång till Copilot Studio
- ✅ Behörighet att skapa agents och tools
- ✅ Deployed MCP-server (se [DEPLOYMENT.md](./DEPLOYMENT.md))

### Server URL:
```
https://lrf-riksdag-regering-mcp.onrender.com/mcp
```

---

## Setup: Steg-för-Steg

### Steg 1: Öppna Copilot Studio

1. Gå till [Microsoft Copilot Studio](https://copilotstudio.microsoft.com)
2. Logga in med ditt M365-konto
3. Välj rätt miljö/workspace

### Steg 2: Skapa eller Välj Agent

**Alternativ A: Ny Agent**
1. Klicka **"Create"** → **"New agent"**
2. Namnge agenten: `LRF Riksdag & Regering`
3. Beskrivning: `Swedish government data assistant - Access data from Riksdagen and Regeringskansliet`

**Alternativ B: Befintlig Agent**
1. Gå till **"Agents"**
2. Välj den agent du vill utöka

### Steg 3: Lägg till MCP Server som Tool

1. **Navigera till Tools:**
   - I din agent, gå till **"Tools"** eller **"Actions"** i sidomenyn

2. **Lägg till ny Tool:**
   - Klicka **"Add tool"** → **"New tool"** → **"Model Context Protocol"**

3. **Konfigurera MCP Connection:**

   ```
   Name: LRF Riksdag & Regering

   Server URL: https://lrf-riksdag-regering-mcp.onrender.com/mcp

   Description: Swedish government data - Riksdagen and Regeringskansliet

   Transport: StreamableHTTP (auto-detected)
   ```

### Steg 4: Konfigurera Autentisering

**För Test/Development:**
```
Authentication: None (Anonymous)
```

**För Production (Rekommenderat):**

**Option A: API Key**
```
Authentication Type: API key
Header Name: X-API-Key
API Key: [din-nyckel-här]
```

*Lägg till API key validation i server.ts om du väljer detta.*

**Option B: OAuth 2.0**
```
Authentication Type: OAuth 2.0
Authorization URL: [din-oauth-url]
Token URL: [din-token-url]
Client ID: [ditt-client-id]
Client Secret: [ditt-secret]
Scope: [required-scopes]
```

*Kräver OAuth-implementation på servern.*

### Steg 5: Skapa Connection

1. Klicka **"Create connection"**
2. Om authentication är konfigurerad, fyll i credentials
3. Copilot Studio testar anslutningen automatiskt

### Steg 6: Välj Tools att Aktivera

Copilot Studio läser automatiskt alla 27 tools från servern:

**Riksdagen Tools** (17 st):
- `search_ledamoter` - Sök ledamöter
- `search_dokument` - Sök dokument
- `search_voteringar` - Sök voteringar
- `get_calendar` - Hämta kalender
- m.fl.

**Regeringen Tools** (10 st):
- `search_government_docs` - Sök regeringsdokument
- `get_ministers` - Hämta ministrar
- `search_legislation` - Sök lagstiftning
- m.fl.

**Välj:**
- ✅ **"Select all"** för att aktivera alla tools
- Eller välj specifika tools baserat på use case

### Steg 7: Testa Integrationen

1. **Gå till Test Canvas:**
   - Klicka **"Test"** i top bar

2. **Prova exempel-prompts:**

   ```
   "Vilka ledamöter finns från Socialdemokraterna?"
   ```

   ```
   "Sök dokument om klimat från 2024"
   ```

   ```
   "Visa kommande kalenderhändelser för utskotten"
   ```

   ```
   "Hur röstade riksdagen i votering AU1?"
   ```

3. **Verifiera:**
   - Agenten kallar rätt tools
   - Svar innehåller korrekt data
   - Inga errors visas

### Steg 8: Publish Agent (Production)

1. **Klicka "Publish"**
2. Välj kanal:
   - Microsoft Teams
   - Web chat
   - Power Virtual Agents
   - Direct integration

3. **Konfigurera permissions:**
   - Vilka användare har access?
   - Grupp-baserad access?

4. **Publish och Dela:**
   - Få en shareable link
   - Eller integrera i Teams

---

## Användning i Microsoft 365 Copilot

### I Teams Chat

```
@LRF Riksdag & Regering vilka ledamöter finns från Göteborg?
```

### I Copilot Chat

```
Using LRF Riksdag & Regering, find all documents about education from 2024
```

### I Power Apps

Integrera agenten i Power Apps canvas för custom UI.

---

## Troubleshooting

### Problem: "Connection failed"

**Orsak:** Server ej nåbar eller fel URL

**Lösning:**
1. Verifiera server är uppe: `curl https://lrf-riksdag-regering-mcp.onrender.com/health`
2. Kontrollera URL är korrekt (inklusive `/mcp`)
3. Om Free tier på Render: Vänta 30-60 sek (cold start)

### Problem: "No tools found"

**Orsak:** Server returnerar inga tools

**Lösning:**
1. Testa manuellt:
   ```bash
   curl -X POST https://lrf-riksdag-regering-mcp.onrender.com/mcp \
     -H "Content-Type: application/json" \
     -H "Accept: application/json, text/event-stream" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
   ```
2. Om tomt resultat: Kontakta server admin
3. Om error: Kolla server logs på Render

### Problem: "Authentication failed"

**Orsak:** Fel API key eller OAuth credentials

**Lösning:**
1. Verifiera credentials i Copilot Studio
2. Kontrollera server logs för auth errors
3. Testa utan auth först (None)

### Problem: Tools timeout

**Orsak:** Server svarar långsamt

**Lösning:**
1. Uppgradera Render tier till Starter (always-on)
2. Optimera server performance
3. Konfigurera caching på servern

### Problem: Rate limit errors

**Orsak:** För många requests

**Lösning:**
1. Servern har rate limit: 100 req/15min per IP
2. Kontakta admin för att höja limit
3. Implementera request batching

---

## Best Practices

### 1. Skriv Tydliga Instruktioner till Agenten

I agent settings, lägg till system instructions:

```
Du är en assistent för svensk regeringsdata. Du kan:
- Söka ledamöter, dokument och voteringar i Riksdagen
- Hitta regeringsdokument och ministrar
- Visa kalenderhändelser

Svara alltid på svenska. Ge koncisa, faktabaserade svar.
```

### 2. Konfigurera Tool Selection

**Auto:** Låt Copilot välja tools automatiskt (rekommenderat)

**Manual:** Specificera vilka tools som ska användas för olika intents

### 3. Använd Citations

Aktivera citations så att Copilot visar källhänvisningar:
- `Settings` → `Citations` → `Enabled`

### 4. Monitor Usage

- Kolla Copilot Studio Analytics
- Övervaka server logs på Render
- Identifiera vanligaste queries

### 5. Iterera och Förbättra

- Samla feedback från användare
- Justera system instructions
- Lägg till fler tools vid behov
- Optimera response format

---

## Exempel Use Cases

### 1. Ledamotsinformation
```
"Vilka ledamöter från Moderaterna sitter i finansutskottet?"
```
→ Använder: `search_ledamoter`, `get_ledamot_details`

### 2. Dokumentanalys
```
"Sammanfatta alla propositioner om AI från 2024"
```
→ Använder: `search_dokument`, `get_dokument_content`

### 3. Voteringshistorik
```
"Hur röstade Socialdemokraterna i voteringar om energi?"
```
→ Använder: `search_voteringar`, `get_voting_results`

### 4. Kalenderspaning
```
"Vilka utskott har möten nästa vecka?"
```
→ Använder: `get_calendar`, `filter_by_committee`

### 5. Regeringsdata
```
"Visa alla regeringsbeslut om klimat från senaste året"
```
→ Använder: `search_government_docs`, `filter_by_date`

---

## Säkerhet & Compliance

### Data Residency
- MCP-servern hostas på Render (Frankfurt eller annan EU-region)
- Data från Riksdagen och Regeringen är öppen data
- Inga personuppgifter lagras på servern

### Logging
- Server loggar endast:
  - Request method och timestamp
  - Inga query parameters eller känslig data
- Logs raderas automatiskt efter 7 dagar på Render

### GDPR Compliance
- Öppen data från offentliga källor
- Ingen tracking av användare
- Inga cookies

### Access Control
- Konfigurera i Copilot Studio vem som har access
- Baserat på Azure AD groups
- Audit logs för all usage

---

## Support

### Server Issues
- Kontakta server admin
- Kolla Render status: [status.render.com](https://status.render.com)

### Copilot Studio Issues
- Microsoft Support
- [Copilot Studio Docs](https://learn.microsoft.com/en-us/microsoft-copilot-studio/)

### MCP Protocol Issues
- [MCP Specification](https://modelcontextprotocol.io/)
- GitHub Issues på server repo

---

## Kostnader

| Komponent | Kostnad | Notering |
|-----------|---------|----------|
| MCP Server | $0-7/månad | Render Free eller Starter |
| M365 Copilot Premium | ~$30/user/månad | Kräver Enterprise E3/E5 |
| Copilot Studio | Inkluderat i Premium | |
| Data från Riksdagen/Regeringen | Gratis | Öppen data |

---

## Nästa Steg

✅ **Setup klar!**

Nu kan LRF-teamet:
1. Söka svensk regeringsdata via Copilot
2. Integrera i Teams workflows
3. Bygga custom Power Apps med data
4. Skapa automatiserade rapporter

För vidareutveckling, se [ROADMAP.md](./ROADMAP.md) för planerade features.
