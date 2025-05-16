import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configureer WebSocket voor Supabase/Neon pooled connections
neonConfig.webSocketConstructor = ws;

// Databron instellingen
const SOURCE_DB_URL = process.env.DATABASE_URL || '';  // Huidige database
const TARGET_DB_URL = process.env.SUPABASE_DB_URL || ''; // Supabase database

// De tabellen die we willen migreren
const TABLES_TO_MIGRATE = [
  'users',
  'projects',
  'files',
  'messages',
  'activities',
  'payments',
  'tracking_items',
  'help_questions',
  'help_feedback',
  'sessions'
];

// Controle voordat we beginnen
if (!SOURCE_DB_URL) {
  console.error('ERROR: Bron database URL is niet ingesteld (DATABASE_URL)');
  process.exit(1);
}

if (!TARGET_DB_URL) {
  console.error('ERROR: Doel database URL is niet ingesteld (SUPABASE_DB_URL)');
  console.error('Stel deze in door uit te voeren: export SUPABASE_DB_URL="postgresql://postgres:jouw-wachtwoord@db.abcdefghijk.supabase.co:5432/postgres"');
  process.exit(1);
}

// Functie om gegevens van een tabel te exporteren
async function exportTable(pool: Pool, tableName: string): Promise<any[]> {
  console.log(`Exporteren van tabel: ${tableName}`);
  
  try {
    // Controleer of de tabel bestaat
    const checkTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [tableName]);
    
    const tableExists = checkTableResult.rows[0].exists;
    if (!tableExists) {
      console.log(`Tabel ${tableName} bestaat niet in de brondatabase, wordt overgeslagen.`);
      return [];
    }
    
    // Haal de data op
    const result = await pool.query(`SELECT * FROM "${tableName}"`);
    console.log(`  ${result.rows.length} rijen geëxporteerd.`);
    
    return result.rows;
  } catch (error) {
    console.error(`Fout bij exporteren van tabel ${tableName}:`, error);
    return [];
  }
}

// Functie om een tabel te importeren in de doeldatabase
async function importTable(pool: NeonPool, tableName: string, data: any[]): Promise<void> {
  console.log(`Importeren naar tabel: ${tableName}, ${data.length} rijen`);
  
  if (data.length === 0) {
    console.log(`  Geen gegevens om te importeren voor ${tableName}`);
    return;
  }
  
  const client = await pool.connect();
  
  try {
    // Begin een transactie
    await client.query('BEGIN');
    
    // Controleer of de tabel bestaat in de doeldatabase
    const checkTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [tableName]);
    
    const tableExists = checkTableResult.rows[0].exists;
    if (!tableExists) {
      console.log(`  Tabel ${tableName} bestaat niet in de doeldatabase, creëren op basis van data...`);
      
      // We hebben het schema van de tabel nodig
      const sourceSchema = await getTableSchema(client, tableName);
      
      // Maak de tabel aan
      await createTable(client, tableName, sourceSchema);
    }
    
    // Maak een lijst van kolomnamen
    const columns = Object.keys(data[0]);
    
    // Importeer elke rij
    for (const row of data) {
      const values = columns.map(col => row[col]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        INSERT INTO "${tableName}" (${columns.map(col => `"${col}"`).join(', ')})
        VALUES (${placeholders})
        ON CONFLICT DO NOTHING
      `;
      
      await client.query(query, values);
    }
    
    // Commit de transactie
    await client.query('COMMIT');
    console.log(`  Data succesvol geïmporteerd in ${tableName}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Fout bij importeren in tabel ${tableName}:`, error);
  } finally {
    client.release();
  }
}

// Functie om het schema van een tabel te verkrijgen
async function getTableSchema(client: any, tableName: string): Promise<any[]> {
  const schemaQuery = `
    SELECT column_name, data_type, character_maximum_length, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  `;
  
  const result = await client.query(schemaQuery, [tableName]);
  return result.rows;
}

// Functie om een tabel te creëren op basis van schema
async function createTable(client: any, tableName: string, schema: any[]): Promise<void> {
  // Bouw CREATE TABLE query op basis van schema
  let createTableQuery = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
  
  // Voeg kolommen toe
  const columnDefinitions = schema.map(column => {
    let columnDef = `  "${column.column_name}" ${column.data_type}`;
    
    // Voeg lengte toe voor VARCHAR
    if (column.character_maximum_length && column.data_type.includes('char')) {
      columnDef += `(${column.character_maximum_length})`;
    }
    
    // Voeg NULL of NOT NULL toe
    columnDef += column.is_nullable === 'YES' ? ' NULL' : ' NOT NULL';
    
    return columnDef;
  });
  
  createTableQuery += columnDefinitions.join(',\n');
  
  // Voeg PRIMARY KEY toe voor 'id' kolom als deze bestaat
  if (schema.some(col => col.column_name === 'id')) {
    createTableQuery += ',\n  PRIMARY KEY ("id")';
  }
  
  createTableQuery += '\n)';
  
  // Probeer de tabel te maken
  await client.query(createTableQuery);
  console.log(`  Tabel ${tableName} aangemaakt`);
}

// Hoofdfunctie om de migratie uit te voeren
async function migrateDatabase() {
  console.log('Start database migratie naar Supabase...');
  console.log('Bron: Huidige database');
  console.log('Doel: Supabase');
  
  // Maak connecties naar de databases
  const sourcePool = new Pool({
    connectionString: SOURCE_DB_URL,
    ssl: process.env.NODE_ENV === 'production'
  });
  
  const targetPool = new NeonPool({
    connectionString: TARGET_DB_URL,
    ssl: true
  });
  
  // Maak een backup directory als deze nog niet bestaat
  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  
  // Exporteer alle tabellen en sla ze op in geheugen en als JSON-bestanden
  const exportedData: Record<string, any[]> = {};
  
  for (const tableName of TABLES_TO_MIGRATE) {
    const data = await exportTable(sourcePool, tableName);
    
    if (data.length > 0) {
      exportedData[tableName] = data;
      
      // Sla op als JSON-bestand als backup
      const backupFile = path.join(backupDir, `${tableName}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
      console.log(`  Backup opgeslagen in: ${backupFile}`);
    }
  }
  
  // Importeer de gegevens in Supabase
  console.log('\nStarten met importeren van gegevens in Supabase...');
  
  for (const tableName of TABLES_TO_MIGRATE) {
    if (exportedData[tableName] && exportedData[tableName].length > 0) {
      await importTable(targetPool, tableName, exportedData[tableName]);
    }
  }
  
  // Sluit database-verbindingen
  await sourcePool.end();
  await targetPool.end();
  
  console.log('\nDatabase migratie voltooid!');
  console.log('Controleer de data in Supabase om te verifiëren dat alles correct is overgezet.');
}

// Start de migratie
migrateDatabase().catch(error => {
  console.error('Migratie mislukt:', error);
  process.exit(1);
});