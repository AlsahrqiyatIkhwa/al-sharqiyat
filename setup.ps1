# Al-Sharqiyat - Windows first-time setup
# Right-click this file -> "Run with PowerShell"
# (If Windows blocks it, first run: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass)

$ErrorActionPreference = "Stop"
Write-Host "== Al-Sharqiyat Setup ==" -ForegroundColor Cyan

# 1. Find psql automatically
Write-Host "`n[1/6] Looking for PostgreSQL..." -ForegroundColor Yellow
$psqlPath = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $psqlPath) {
    Write-Host "Could not find PostgreSQL under C:\Program Files\PostgreSQL\" -ForegroundColor Red
    Write-Host "Please install it from https://www.postgresql.org/download/windows/ and re-run this script."
    Read-Host "Press Enter to exit"
    exit 1
}
$pgBin = $psqlPath.Directory.FullName
Write-Host "Found PostgreSQL at: $pgBin" -ForegroundColor Green
$env:Path += ";$pgBin"

# 2. Check Node
Write-Host "`n[2/6] Checking Node.js..." -ForegroundColor Yellow
try { node -v | Out-Null } catch {
    Write-Host "Node.js not found. Install it from https://nodejs.org (LTS version) and re-run this script." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "Node.js OK" -ForegroundColor Green

# 3. Get Postgres credentials
Write-Host "`n[3/6] Postgres connection details" -ForegroundColor Yellow
$pgUser = Read-Host "Postgres username (press Enter for 'postgres')"
if ([string]::IsNullOrWhiteSpace($pgUser)) { $pgUser = "postgres" }
$pgPassSecure = Read-Host "Postgres password" -AsSecureString
$pgPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassSecure))
$env:PGPASSWORD = $pgPass

# 4. Create database
Write-Host "`n[4/6] Creating database 'sahrqiyat_db'..." -ForegroundColor Yellow
& "$pgBin\createdb.exe" -U $pgUser sahrqiyat_db 2>$null
Write-Host "Database ready (created it now, or it already existed)." -ForegroundColor Green

# 5. Backend setup
Write-Host "`n[5/6] Setting up backend (this takes a few minutes)..." -ForegroundColor Yellow
Set-Location backend
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }

function New-Secret { -join ((48..57)+(65..90)+(97..122)|Get-Random -Count 48|%{[char]$_}) }
$jwtSecret = New-Secret
$jwtRefresh = New-Secret
$cookieSecret = New-Secret
$adminPass = New-Secret

$dbUrl = "postgresql://${pgUser}:${pgPass}@localhost:5432/sahrqiyat_db?schema=public"

(Get-Content .env) |
  ForEach-Object {
    $_ -replace '^DATABASE_URL=.*', "DATABASE_URL=`"$dbUrl`"" `
       -replace '^JWT_SECRET=.*', "JWT_SECRET=`"$jwtSecret`"" `
       -replace '^JWT_REFRESH_SECRET=.*', "JWT_REFRESH_SECRET=`"$jwtRefresh`"" `
       -replace '^COOKIE_SECRET=.*', "COOKIE_SECRET=`"$cookieSecret`"" `
       -replace '^ADMIN_USERNAME=.*', 'ADMIN_USERNAME="admin"' `
       -replace '^ADMIN_PASSWORD=.*', "ADMIN_PASSWORD=`"$adminPass`""
  } | Set-Content .env

npx prisma generate
npx prisma migrate deploy
npm run seed

# 6. Frontend setup
Write-Host "`n[6/6] Setting up frontend..." -ForegroundColor Yellow
Set-Location ..\frontend
npm install
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
$waNum = Read-Host "Admin WhatsApp number, international format no plus sign (press Enter for 962787706573)"
if ([string]::IsNullOrWhiteSpace($waNum)) { $waNum = "962787706573" }
(Get-Content .env.local) | ForEach-Object {
    $_ -replace '^NEXT_PUBLIC_ADMIN_WHATSAPP=.*', "NEXT_PUBLIC_ADMIN_WHATSAPP=`"$waNum`""
} | Set-Content .env.local

Set-Location ..

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "SETUP COMPLETE" -ForegroundColor Green
Write-Host "Admin username: admin"
Write-Host "Admin password: $adminPass"
Write-Host "(copy this now, it will not be shown again)" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "`nNext steps - open TWO new PowerShell windows:"
Write-Host "  Window 1:  cd backend ; npm run dev"
Write-Host "  Window 2:  cd frontend ; npm run dev"
Write-Host "`nThen open http://localhost:3000 in your browser."
Read-Host "`nPress Enter to close"
