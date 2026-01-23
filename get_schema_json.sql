-- Run this query in your Supabase SQL Editor to get the current database structure as JSON.
-- Copy the output JSON and paste it back to the chat if you want me to analyze the *exact* live state.

WITH schema_info AS (
    SELECT 
        t.table_name,
        json_agg(json_build_object(
            'column_name', c.column_name,
            'data_type', c.data_type,
            'is_nullable', c.is_nullable,
            'column_default', c.column_default
        )) AS columns
    FROM 
        information_schema.tables t
    JOIN 
        information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
    WHERE 
        t.table_schema = 'public'
    GROUP BY 
        t.table_name
)
SELECT json_agg(json_build_object(
    'table_name', table_name,
    'columns', columns
))::text
FROM schema_info;
