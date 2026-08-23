import sqlite3

conn = sqlite3.connect("c:\\Users\\bitd\\Downloads\\be11\\backend\\prisma\\dev.db")
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables in dev.db:")
for table in tables:
    print(table[0])
conn.close()
