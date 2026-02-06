# supabase Directory Structure

## Overview
Database schema, migrations, and configuration for Supabase.

## Subdirectories

### migrations/
Database migration files with timestamped names
- Schema changes
- New tables
- RLS policies
- Indexes and constraints

## Files

### Configuration
- **config.toml** - Local Supabase configuration

## Migration Naming
Format: `YYYYMMDDHHMMSS_description.sql`

## Purpose
- Database version control
- Schema evolution
- Deployment automation
- Rollback capability

---

*Last Updated: 2026-02-06*
