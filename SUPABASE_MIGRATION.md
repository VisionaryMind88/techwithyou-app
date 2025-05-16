# Migratie naar Supabase en Railway Handleiding

Deze handleiding helpt je bij het migreren van je huidige database naar Supabase en het deployen van je applicatie op Railway.

## Stap 1: Supabase Instellen

1. Ga naar [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Maak een account aan als je die nog niet hebt
3. Klik op "New Project" om een nieuw project aan te maken
4. Vul de volgende gegevens in:
   - **Name**: Kies een naam voor je project (bijv. "tech-with-you")
   - **Database Password**: Kies een sterk wachtwoord (bewaar dit goed!)
   - **Region**: Kies een regio die dicht bij je gebruikers ligt (bijv. eu-west-1 voor Europa)
5. Klik op "Create new project" en wacht tot het project is aangemaakt

## Stap 2: Supabase Database Credentials Verkrijgen

1. Nadat je project is aangemaakt, ga naar "Settings" in het linkermenu
2. Klik op "Database" in het submenu
3. Scroll naar beneden naar de sectie "Connection string"
4. Kopieer de URI onder "Connection pooling"
5. Vervang `[YOUR-PASSWORD]` in de connection string met het wachtwoord dat je eerder hebt ingesteld

## Stap 3: Data Migreren naar Supabase

1. Open een terminal of command prompt
2. Stel de volgende omgevingsvariabelen in:

```bash
# Voor Linux/macOS
export SUPABASE_DB_URL="jouw-supabase-connection-string"

# Voor Windows (Command Prompt)
set SUPABASE_DB_URL=jouw-supabase-connection-string

# Voor Windows (PowerShell)
$env:SUPABASE_DB_URL="jouw-supabase-connection-string"
```

3. Voer het migratiescript uit:

```bash
npx tsx scripts/migrate-to-supabase.ts
```

4. Het script zal:
   - Gegevens uit je huidige database exporteren
   - Een lokale backup maken in de `backups` map
   - De tabellen in Supabase aanmaken (indien nodig)
   - De gegevens importeren in Supabase

## Stap 4: Applicatie Configureren voor Supabase

De code is al voorbereid om met Supabase te werken. Zorg ervoor dat:

1. De omgevingsvariabele `DATABASE_URL` wijst naar je Supabase connection string
2. De applicatie gebruikt nu automatisch de Supabase database

## Stap 5: Railway instellen

1. Ga naar [Railway](https://railway.app/) en maak een account aan
2. Klik op "New Project" en kies "Deploy from GitHub repo"
3. Kies je GitHub repository en wacht tot Railway deze heeft gecloned
4. Configureer de volgende omgevingsvariabelen in Railway:
   
   ```
   DATABASE_URL=jouw-supabase-connection-string
   NODE_ENV=production
   SESSION_SECRET=een-willekeurige-lange-string
   ```

5. Railway zal automatisch je applicatie builden en deployen

## Stap 6: Controleer of Alles Werkt

1. Navigeer naar de gedeployde applicatie URL die Railway je geeft
2. Log in om te controleren of de authenticatie werkt
3. Controleer of alle functies werken zoals verwacht
4. Controleer of de data correct is gemigreerd

## Extra Tips

### Database Backup

Het migratiescript maakt automatisch een backup van je data in de map `backups`. Bewaar deze bestanden als extra veiligheid.

### Monitoren

- Supabase biedt een dashboard om je database te monitoren
- Railway biedt logs en metrics voor je applicatie

### Scaling

- Supabase kan worden opgeschaald naarmate je behoeften groeien
- Railway maakt het gemakkelijk om meer resources toe te wijzen aan je applicatie

## Troubleshooting

### Connectiefouten

Als je connectieproblemen tegenkomt:
- Controleer of je het juiste wachtwoord gebruikt in de connection string
- Controleer of je IP-adres niet geblokkeerd wordt door de Supabase firewall
- Zorg ervoor dat SSL is ingeschakeld in je databaseconfiguratie

### Data Migratieproblemen

Als je problemen ondervindt tijdens de datamigratie:
- Controleer de lokale backups in de `backups` map
- Voer het script opnieuw uit met debug logging ingeschakeld:
  ```
  DEBUG=1 npx tsx scripts/migrate-to-supabase.ts
  ```

### Railway Deployment Problemen

Als je deployment problemen ondervindt:
- Controleer de deployment logs in Railway
- Zorg ervoor dat alle omgevingsvariabelen correct zijn ingesteld
- Verifieer dat je build commando's correct zijn