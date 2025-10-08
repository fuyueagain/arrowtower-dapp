# create_db.py
import sqlite3
import json
from datetime import datetime

# SQL 建表语句（粘贴上面的 SQL）
init_sql = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "walletAddress" TEXT NOT NULL UNIQUE,
  "walletType" TEXT NOT NULL DEFAULT 'evm',
  "nickname" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user',
  "avatar" TEXT,
  "totalRoutes" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Route" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "coverImage" TEXT,
  "difficulty" TEXT NOT NULL DEFAULT 'medium',
  "estimatedTime" INTEGER NOT NULL,
  "poiCount" INTEGER NOT NULL DEFAULT 3,
  "nftCollection" TEXT,
  "isActive" INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "POI" (
  "id" TEXT PRIMARY KEY,
  "routeId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "latitude" REAL NOT NULL,
  "longitude" REAL NOT NULL,
  "radius" INTEGER NOT NULL DEFAULT 50,
  "taskType" TEXT NOT NULL DEFAULT 'photo',
  "taskContent" TEXT,
  "order" INTEGER NOT NULL,
  FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Checkin" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "routeId" TEXT NOT NULL,
  "poiId" TEXT NOT NULL,
  "signature" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "taskData" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("poiId") REFERENCES "POI"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Voucher" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "routeId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "nftTokenId" TEXT,
  "mintTxHash" TEXT,
  "metadata" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_checkin_user_route" ON "Checkin"("userId", "routeId");
CREATE INDEX IF NOT EXISTS "idx_checkin_poi" ON "Checkin"("poiId");
CREATE INDEX IF NOT EXISTS "idx_voucher_user_route" ON "Voucher"("userId", "routeId");
CREATE INDEX IF NOT EXISTS "idx_poi_route_order" ON "POI"("routeId", "order");


"""

# 连接数据库（不存在会自动创建）
conn = sqlite3.connect('arrowtower.db')
cursor = conn.cursor()

# 执行建表
cursor.executescript(init_sql)

# 插入一条测试路线（可选）
route_id = "route_1"
cursor.execute("""
INSERT INTO "Route" ("id", "name", "description", "estimatedTime", "poiCount", "isActive")
VALUES (?, ?, ?, ?, ?, ?)
""", (route_id, "长城探险路线", "探索八达岭长城的历史遗迹", 120, 3, 1))

# 插入一个测试 POI
cursor.execute("""
INSERT INTO "POI" ("id", "routeId", "name", "latitude", "longitude", "radius", "taskType", "order")
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
""", (
    "poi_1",
    route_id,
    "八达岭入口",
    40.3786,
    116.0156,
    50,
    "photo",
    1
))

# 提交并关闭
conn.commit()
conn.close()

print("✅ SQLite 数据库 'arrowtower.db' 创建成功！")
