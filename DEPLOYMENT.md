# LRF Riksdag & Regering - Deployment Guide

## Deployment till Render.com

### Förutsättningar
- GitHub repository med koden
- Render.com-konto

### Steg 1: Förbered Repository

Kontrollera att dessa filer finns:

**render.yaml** (om du vill använda Infrastructure as Code):
```yaml
services:
  - type: web
    name: lrf-riksdag-regering-mcp
    env: node
    buildCommand: cd mcp && npm install && npm run build
    startCommand: cd mcp && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: LOG_LEVEL
        value: info
```

Eller skapa manuellt via Render Dashboard (se nedan).

### Steg 2: Skapa Web Service på Render

1. **Logga in på** [render.com](https://render.com)

2. **New → Web Service**

3. **Connect Repository:**
   - Koppla GitHub-kontot
   - Välj repositoryt
   - Branch: `main` eller `master`

4. **Konfigurera Service:**
   ```
   Name: lrf-riksdag-regering-mcp
   Region: Frankfurt (eller närmaste)
   Branch: main
   Runtime: Node
   Build Command: cd mcp && npm install && npm run build
   Start Command: cd mcp && npm start
   Instance Type: Free (eller Starter för bättre prestanda)
   ```

5. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3000
   LOG_LEVEL=info
   ```

6. **Klicka "Create Web Service"**

### Steg 3: Vänta på Deploy

- Första deployn tar ~5-10 minuter
- Render bygger och startar servern automatiskt
- Du får en URL: `https://lrf-riksdag-regering-mcp.onrender.com`

### Steg 4: Verifiera Deployment

Testa endpoints:

```bash
# Health check
curl https://lrf-riksdag-regering-mcp.onrender.com/health

# Server info
curl https://lrf-riksdag-regering-mcp.onrender.com/mcp

# MCP tools/list (med rätt headers)
curl -X POST https://lrf-riksdag-regering-mcp.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Steg 5: Custom Domain (Valfritt)

1. Gå till **Settings → Custom Domain**
2. Lägg till din domän
3. Uppdatera DNS-records enligt Render's instruktioner

---

## Auto-Deploy från GitHub

Render deploar automatiskt när du pushar till `main`:

```bash
git add .
git commit -m "Update server"
git push origin main
```

Render detectar ändringen och deploar inom 1-2 minuter.

---

## Troubleshooting

### Build Fails

**Problem:** `npm install` misslyckas

**Lösning:**
- Kontrollera att `package.json` är korrekt
- Verifiera Node-version: `"node": ">=20.0.0"`
- Kör lokalt först: `npm install && npm run build`

### Server Startar Inte

**Problem:** Health check misslyckas

**Lösning:**
- Kolla logs i Render Dashboard
- Verifiera att PORT=3000 är satt
- Kontrollera att `npm start` fungerar lokalt

### "Not Acceptable" Error

**Problem:** MCP requests returnerar 406

**Lösning:**
- StreamableHTTP kräver header: `Accept: application/json, text/event-stream`
- M365 Copilot skickar automatiskt rätt headers
- För manuella tester, inkludera headern

### Free Tier Sleep

**Problem:** Server "sover" efter inaktivitet

**Lösning:**
- Free tier på Render sover efter 15 min inaktivitet
- Första requesten tar ~30-60 sekunder (cold start)
- Uppgradera till Starter ($7/månad) för always-on
- Eller använd uptime monitor (Uptime Robot, cron-job.org)

---

## Monitoring

### Render Dashboard

- **Logs:** Real-time server logs
- **Metrics:** CPU, memory, response time
- **Events:** Deploy history, errors

### External Monitoring

Konfigurera uptime monitoring:

**Uptime Robot** (gratis):
1. Gå till [uptimerobot.com](https://uptimerobot.com)
2. Ny monitor: `https://lrf-riksdag-regering-mcp.onrender.com/health`
3. Interval: 5 minuter
4. Notiser: Email/Slack

**Cron-job.org** (gratis):
1. Gå till [cron-job.org](https://cron-job.org)
2. Skapa job som kallar `/health` var 5:e minut
3. Håller servern vaken på Free tier

---

## Säkerhet

### Environment Variables

Lägg ALDRIG till secrets i koden. Använd Render Environment Variables:

```
DATABASE_URL=postgresql://...
API_KEY=secret123
```

### Rate Limiting

Servern har inbyggd rate limiting:
- 100 requests per 15 minuter per IP
- Konfigureras i `server.ts`

### CORS

Servern tillåter alla origins (för MCP-klienter).
För production, begränsa CORS:

```typescript
app.use(cors({
  origin: ['https://your-domain.com', 'https://copilot.microsoft.com']
}));
```

---

## Kostnader

| Tier | Pris | Features |
|------|------|----------|
| Free | $0 | 750h/månad, sleep after 15min, 512MB RAM |
| Starter | $7/månad | Always-on, 512MB RAM, custom domain |
| Standard | $25/månad | 2GB RAM, auto-scaling |

**Rekommendation:** Starta med Free, uppgradera till Starter vid behov.

---

## Nästa Steg

När deployn är klar, se [M365_SETUP.md](./M365_SETUP.md) för att koppla servern till Microsoft 365 Copilot Studio.
