#!/usr/bin/env bash
# Al-Sharqiyat — full first-time setup
# Run from the project root (the folder containing backend/ and frontend/)
set -e

echo "== 1. Checking prerequisites =="
command -v node >/dev/null || { echo "Node.js not found. Install Node 18+ first."; exit 1; }
command -v psql >/dev/null || { echo "psql not found. Install/start PostgreSQL first."; exit 1; }
node -v

echo "== 2. Create database (safe if it already exists) =="
createdb sahrqiyat_db 2>/dev/null || echo "Database sahrqiyat_db already exists, continuing."

echo "== 3. Backend setup =="
cd backend
npm install
cp -n .env.example .env || echo ".env already exists, not overwriting."

JWT_SECRET=$(openssl rand -base64 48)
JWT_REFRESH_SECRET=$(openssl rand -base64 48)
COOKIE_SECRET=$(openssl rand -base64 48)
ADMIN_PASSWORD=$(openssl rand -base64 24)

read -p "Postgres username [postgres]: " PG_USER
PG_USER=${PG_USER:-postgres}
read -sp "Postgres password (leave blank if none): " PG_PASS
echo

if [ -z "$PG_PASS" ]; then
  DB_URL="postgresql://${PG_USER}@localhost:5432/sahrqiyat_db?schema=public"
else
  DB_URL="postgresql://${PG_USER}:${PG_PASS}@localhost:5432/sahrqiyat_db?schema=public"
fi

sed -i.bak \
  -e "s#^DATABASE_URL=.*#DATABASE_URL=\"${DB_URL}\"#" \
  -e "s#^JWT_SECRET=.*#JWT_SECRET=\"$JWT_SECRET\"#" \
  -e "s#^JWT_REFRESH_SECRET=.*#JWT_REFRESH_SECRET=\"$JWT_REFRESH_SECRET\"#" \
  -e "s#^COOKIE_SECRET=.*#COOKIE_SECRET=\"$COOKIE_SECRET\"#" \
  -e "s#^ADMIN_USERNAME=.*#ADMIN_USERNAME=\"admin\"#" \
  -e "s#^ADMIN_PASSWORD=.*#ADMIN_PASSWORD=\"$ADMIN_PASSWORD\"#" \
  .env && rm .env.bak

echo "== 4. Prisma migrate + seed =="
npx prisma generate
npx prisma migrate deploy
npm run seed

echo "== 5. Frontend setup =="
cd ../frontend
npm install
cp -n .env.example .env.local || echo ".env.local already exists, not overwriting."
read -p "Admin WhatsApp number (intl format, no +) [9627XXXXXXXX]: " WA_NUM
WA_NUM=${WA_NUM:-9627XXXXXXXX}
sed -i.bak "s#^NEXT_PUBLIC_ADMIN_WHATSAPP=.*#NEXT_PUBLIC_ADMIN_WHATSAPP=\"${WA_NUM}\"#" .env.local && rm .env.local.bak

echo
echo "=================================================="
echo "✅ Setup complete."
echo "Admin username: admin"
echo "Admin password: $ADMIN_PASSWORD"
echo "(save this now — it will not be shown again)"
echo "=================================================="
echo
echo "Next, in TWO separate terminals:"
echo "  Terminal 1: cd backend  && npm run dev   # http://localhost:4000"
echo "  Terminal 2: cd frontend && npm run dev   # http://localhost:3000"
echo
echo "Then verify:"
echo "  curl http://localhost:4000/health   -> should return {\"status\":\"ok\"}"
echo "  open http://localhost:3000          -> storefront with seeded products"
echo "  open http://localhost:3000/admin/login -> log in with the admin credentials above"
