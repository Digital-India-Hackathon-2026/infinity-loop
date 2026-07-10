import sqlite3
import os

db_paths = [
    os.path.join(os.path.dirname(__file__), "farmer2gov.db"),
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "farmer2gov.db")
]

new_columns_crop_regs = [
    ("rejection_reason", "TEXT")
]

new_columns_produce_images = [
    ("image_source", "TEXT DEFAULT 'Live Camera'"),
    ("upload_time", "TEXT")
]

new_columns_sample_verifs = [
    ("verification_centre", "TEXT"),
    ("verification_date", "TEXT"),
    ("verification_time", "TEXT"),
    ("sample_instructions", "TEXT")
]

for db_path in db_paths:
    if os.path.exists(db_path):
        print(f"Migrating database: {db_path}")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 1. Migrate crop_registrations columns
        cursor.execute("PRAGMA table_info(crop_registrations);")
        columns = [row[1] for row in cursor.fetchall()]
        for col_name, col_type in new_columns_crop_regs:
            if col_name not in columns:
                try:
                    cursor.execute(f"ALTER TABLE crop_registrations ADD COLUMN {col_name} {col_type};")
                    print(f"Added column {col_name} ({col_type}) to crop_registrations in {db_path}")
                except Exception as e:
                    print(f"Error adding column {col_name} to crop_registrations: {e}")

        # 2. Migrate produce_images columns
        cursor.execute("PRAGMA table_info(produce_images);")
        columns = [row[1] for row in cursor.fetchall()]
        for col_name, col_type in new_columns_produce_images:
            if col_name not in columns:
                try:
                    cursor.execute(f"ALTER TABLE produce_images ADD COLUMN {col_name} {col_type};")
                    print(f"Added column {col_name} ({col_type}) to produce_images in {db_path}")
                except Exception as e:
                    print(f"Error adding column {col_name} to produce_images: {e}")

        # 3. Migrate sample_verifications columns
        cursor.execute("PRAGMA table_info(sample_verifications);")
        columns = [row[1] for row in cursor.fetchall()]
        for col_name, col_type in new_columns_sample_verifs:
            if col_name not in columns:
                try:
                    cursor.execute(f"ALTER TABLE sample_verifications ADD COLUMN {col_name} {col_type};")
                    print(f"Added column {col_name} ({col_type}) to sample_verifications in {db_path}")
                except Exception as e:
                    print(f"Error adding column {col_name} to sample_verifications: {e}")

        # 4. Create procurement_slots table
        try:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS procurement_slots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                centre_id INTEGER NOT NULL,
                slot_date TEXT NOT NULL,
                slot_time TEXT NOT NULL,
                capacity INTEGER DEFAULT 5,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(centre_id) REFERENCES procurement_centres(id) ON DELETE CASCADE
            );
            """)
            print(f"Ensured procurement_slots table exists in {db_path}")
        except Exception as e:
            print(f"Error creating procurement_slots table in {db_path}: {e}")

        # In case we need to add columns to crop_registrations from migrate.py's original setup
        cursor.execute("PRAGMA table_info(crop_registrations);")
        columns = [row[1] for row in cursor.fetchall()]
        old_cols = [
            ("produce_category", "TEXT"),
            ("quantity_unit", "TEXT"),
            ("pin_code", "TEXT"),
            ("harvest_date", "TEXT"),
            ("produce_ready_status", "TEXT")
        ]
        for col_name, col_type in old_cols:
            if col_name not in columns:
                try:
                    cursor.execute(f"ALTER TABLE crop_registrations ADD COLUMN {col_name} {col_type};")
                    print(f"Added column {col_name} ({col_type}) to crop_registrations in {db_path}")
                except Exception as e:
                    print(f"Error adding column {col_name} to crop_registrations: {e}")

        conn.commit()
        conn.close()
    else:
        print(f"Database not found at: {db_path}")

print("Migration completed.")
