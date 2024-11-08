-- Prompt the user to delete and recreate the jobly database
\echo 'Delete and recreate jobly db?'
\prompt 'Return for yes or control-C to cancel > ' foo

-- Drop the jobly database if it exists and then recreate it
DROP DATABASE IF EXISTS jobly;
CREATE DATABASE jobly;
\connect jobly

-- Load schema and seed data to jobly
\i jobly-schema.sql
\i jobly-seed.sql


-- Prompt the user to delete and recreate the jobly-TEST database
\echo 'Delete and recreate jobly_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

-- Drop the jobly-TEST database if it exists and then recreate it
DROP DATABASE IF EXISTS jobly_test;
CREATE DATABASE jobly_test;
\connect jobly_test

-- Load schema only to jobly-TEST database
\i jobly-schema.sql
