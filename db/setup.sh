#!/bin/bash
# Database setup script for Replit
# This script will set up the PostgreSQL database and run migrations

echo "🔄 Setting up database for TechWithYou app..."

# Define environment variables
DB_NAME="techwithyou"
DB_USER="postgres"
DB_PASSWORD="postgres"
MIGRATION_FILE="./db/migration.sql"

# Check if PostgreSQL is running
pg_status=$(pg_ctl status 2>&1)
if [[ $pg_status == *"server is running"* ]]; then
    echo "✅ PostgreSQL server is running."
else
    echo "🚀 Starting PostgreSQL server..."
    pg_ctl start -l /tmp/pg.log -o "-h 127.0.0.1"
    sleep 2
fi

# Check if database exists, if not create it
if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "✅ Database $DB_NAME already exists."
else
    echo "🏗️ Creating database $DB_NAME..."
    createdb $DB_NAME
    echo "✅ Database $DB_NAME created successfully."
fi

# Run migrations
echo "🔄 Running database migrations..."
if [ -f "$MIGRATION_FILE" ]; then
    psql -d $DB_NAME -f "$MIGRATION_FILE"
    if [ $? -eq 0 ]; then
        echo "✅ Database migrations applied successfully."
    else
        echo "❌ Error applying migrations."
        exit 1
    fi
else
    echo "❌ Migration file $MIGRATION_FILE not found."
    exit 1
fi

# Set environment variables
echo "🔄 Setting environment variables..."
echo "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME" > .env
echo "PGDATABASE=$DB_NAME" >> .env
echo "PGUSER=$DB_USER" >> .env
echo "PGPASSWORD=$DB_PASSWORD" >> .env
echo "PGHOST=localhost" >> .env
echo "PGPORT=5432" >> .env

echo "✅ Database setup complete!"
echo "📋 Your database connection details:"
echo "   - Host: localhost"
echo "   - Port: 5432"
echo "   - Database: $DB_NAME"
echo "   - User: $DB_USER"

# Instructions for using the database in your application
echo ""
echo "🚀 To use this database in your application:"
echo "1. Access environment variables from .env file"
echo "2. Set app.current_user_id session variable when a user logs in"
echo "   - In Node.js: 'SET LOCAL app.current_user_id = $user_auth_id'"
echo "3. Test the database connection in your application"
echo ""
echo "📝 Example Node.js code to set current user:"
echo "------------------------------------------------"
echo "const { Pool } = require('pg');"
echo "const pool = new Pool({connectionString: process.env.DATABASE_URL});"
echo ""
echo "// When a user logs in:"
echo "async function setCurrentUser(client, userId) {"
echo "  await client.query('SET LOCAL app.current_user_id = $1', [userId]);"
echo "}"
echo ""
echo "// Example usage in an Express middleware:"
echo "app.use(async (req, res, next) => {"
echo "  if (req.user?.id) {"
echo "    const client = await pool.connect();"
echo "    try {"
echo "      await setCurrentUser(client, req.user.id);"
echo "      // Make client available to route handlers"
echo "      req.dbClient = client;"
echo "      next();"
echo "    } catch (err) {"
echo "      client.release();"
echo "      next(err);"
echo "    }"
echo "  } else {"
echo "    next();"
echo "  }"
echo "});"
echo "------------------------------------------------"

