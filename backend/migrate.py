import sqlite3
import os

db_paths = [
    os.path.join(os.path.dirname(__file__), "farmer2gov.db"),
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "farmer2gov.db")
]

new_columns = [
    ("produce_category", "TEXT"),
    ("quantity_unit", "TEXT"),
    ("pin_code", "TEXT"),
    ("harvest_date", "TEXT"),
    ("produce_ready_status", "TEXT")
]

for db_path in db_paths:
    if os.path.exists(db_path):
        print(f"Migrating database: {db_path}")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get existing columns
        cursor.execute("PRAGMA table_info(crop_registrations);")
        columns = [row[1] for row in cursor.fetchall()]
        
        for col_name, col_type in new_columns:
            if col_name not in columns:
                try:
                    cursor.execute(f"ALTER TABLE crop_registrations ADD COLUMN {col_name} {col_type};")
                    print(f"Added column {col_name} ({col_type}) to {db_path}")
                except Exception as e:
                    print(f"Error adding column {col_name} to {db_path}: {e}")
            else:
                print(f"Column {col_name} already exists in {db_path}")
                
        conn.commit()
        conn.close()
    else:
        print(f"Database not found at: {db_path}")

print("Migration completed.")
