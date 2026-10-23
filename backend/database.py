import sqlite3
import os
import json
from datetime import datetime, date

DB_PATH = os.path.join(os.path.dirname(__file__), "studymate.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Tasks table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        subject TEXT NOT NULL,
        due_date TEXT NOT NULL,
        due_time TEXT,
        priority TEXT DEFAULT 'Medium',
        status TEXT DEFAULT 'Not started',
        completed INTEGER DEFAULT 0,
        resource_url TEXT,
        completed_at TEXT,
        completion_type TEXT,
        completion_evidence TEXT,
        notes TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # Check and migrate existing tasks table columns if created previously
    cursor.execute("PRAGMA table_info(tasks)")
    existing_cols = [row[1] for row in cursor.fetchall()]

    new_columns = [
        ("description", "TEXT"),
        ("resource_url", "TEXT"),
        ("status", "TEXT DEFAULT 'Not started'"),
        ("completed_at", "TEXT"),
        ("completion_type", "TEXT"),
        ("completion_evidence", "TEXT"),
    ]

    for col_name, col_type in new_columns:
        if col_name not in existing_cols:
            try:
                cursor.execute(f"ALTER TABLE tasks ADD COLUMN {col_name} {col_type}")
            except Exception as e:
                print(f"Migration note for {col_name}: {e}")

    # Synchronize status and completed columns for existing rows
    cursor.execute("""
    UPDATE tasks SET status = 'Completed' WHERE completed = 1 AND (status IS NULL OR status = '' OR status = 'Not started')
    """)
    cursor.execute("""
    UPDATE tasks SET status = 'Not started' WHERE completed = 0 AND (status IS NULL OR status = '')
    """)
    cursor.execute("""
    UPDATE tasks SET description = notes WHERE (description IS NULL OR description = '') AND notes IS NOT NULL AND notes != ''
    """)
    
    # Study Plans table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS study_plans (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        duration_days INTEGER NOT NULL,
        daily_hours REAL NOT NULL,
        topics TEXT NOT NULL, -- JSON array of strings
        days TEXT NOT NULL,   -- JSON array of day objects
        is_sample INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
    )
    """)
    
    # Quiz Results table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quiz_results (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        topic TEXT NOT NULL,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        percentage REAL NOT NULL,
        completed_at TEXT NOT NULL
    )
    """)

    # Activity Log table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        activity_type TEXT NOT NULL,
        description TEXT NOT NULL,
        timestamp TEXT NOT NULL
    )
    """)
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at", DB_PATH)
