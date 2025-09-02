# Supabase Migration Guide for FarmaGenius

## Current Status ✅
- Project is already configured for Supabase
- Dependencies installed (`@supabase/supabase-js`, `@prisma/client`)
- Environment variables properly set
- Database schema files ready (`supabase-migration.sql` and `prisma/schema.prisma`)

## Next Steps to Complete Migration

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project: `yhtnlxnntpipnshtivqx`
3. Go to **SQL Editor**
4. Copy the content from `supabase-migration.sql` file
5. Execute the SQL script
6. Verify all tables are created successfully

### Option 2: Using Service Role Key (Advanced)
1. Get your Service Role Key from Supabase Dashboard:
   - Go to Settings → API
   - Copy the `service_role` key (not the `anon` key)
2. Update your `.env` file:
   ```env
   SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
   ```
3. Use a script with elevated permissions to run the migration

### Option 3: Using Prisma (If DB password is correct)
1. Ensure the DATABASE_URL has the correct password
2. Run: `npx prisma db push`

## Verification Steps
After applying the schema, verify the setup by:

1. **Check tables created:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

2. **Test application connection:**
   ```bash
   npm run dev
   ```
   Then test if the authentication and database operations work.

## Important Tables That Should Be Created
- users
- accounts
- sessions  
- reports
- report_items
- mappings
- daily_observations
- production_metrics
- inventory_items
- digital_prescriptions
- defaulters
- audit_logs
- medication_alerts
- And more...

## Current Configuration
- **Project URL**: https://yhtnlxnntpipnshtivqx.supabase.co
- **Project ID**: yhtnlxnntpipnshtivqx
- **Anon Key**: Already configured in .env
- **Database**: PostgreSQL with Row Level Security enabled

## Authentication Setup
The project uses NextAuth.js with Supabase adapter. User data shows successful email authentication for: adriel.borguezao@gmail.com

## Next Development Steps After Migration
1. Test all API endpoints
2. Verify user authentication flow
3. Test file upload functionality
4. Verify report processing features
5. Test production metrics and analytics

---
**Note**: The database connection issue appears to be related to the PostgreSQL direct access credentials. Using the Supabase Dashboard SQL Editor is the most reliable approach for initial schema setup.