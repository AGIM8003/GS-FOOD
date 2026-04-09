import sqlite3
from typing import List, Dict, Any
from pydantic import BaseModel
import pathlib

DB_PATH = pathlib.Path(__file__).parent.parent / "data.db"

class PantryItem(BaseModel):
    name: str
    quantity: str

class PantryDB:
    def __init__(self, path=DB_PATH):
        self.path = str(path)
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS inventory (
                    user_id TEXT,
                    name TEXT,
                    quantity TEXT,
                    UNIQUE(user_id, name)
                )
            """)
            # Seed default user if empty
            cursor = conn.execute("SELECT COUNT(*) FROM inventory WHERE user_id = 'default_user'")
            if cursor.fetchone()[0] == 0:
                self.add_item("default_user", "Olive Oil", "1 bottle")
                self.add_item("default_user", "Garlic", "4 cloves")
                self.add_item("default_user", "Pasta", "500g")
                self.add_item("default_user", "Canned Tomatoes", "2 cans")
                self.add_item("default_user", "Chicken Breast", "1 lb")

    def add_item(self, user_id: str, name: str, quantity: str):
        with sqlite3.connect(self.path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO inventory (user_id, name, quantity)
                VALUES (?, ?, ?)
            """, (user_id, name, quantity))

    def get_inventory(self, user_id: str) -> List[Dict[str, str]]:
        with sqlite3.connect(self.path) as conn:
            cursor = conn.execute("SELECT name, quantity FROM inventory WHERE user_id = ?", (user_id,))
            return [{"name": row[0], "quantity": row[1]} for row in cursor.fetchall()]

# Global DB Instance
db = PantryDB()
