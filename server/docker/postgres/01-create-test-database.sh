#!/bin/sh
# Runs once, when the data volume is first initialised.
# Creates a separate database for automated tests so they never touch development data.
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
CREATE DATABASE "${POSTGRES_DB}_test" OWNER "$POSTGRES_USER";
SQL
