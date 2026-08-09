# 🌙 الشرقيات (Al-Sharqiyat) — Luxury Traditional Clothing Catalog

منصة كتالوج احترافية لبيع الأزياء التراثية الفاخرة (عبايات، قفاطين، جلابيات) في الأردن —
بدون تسجيل دخول للعملاء، وبدون بوابة دفع إلكتروني، وتأكيد الطلبات عبر واتساب.

---

## 📁 هيكل المشروع (Monorepo)

```
al-sharqiyat/
├── backend/     → Node.js + Express + Prisma + PostgreSQL (REST API)
└── frontend/    → Next.js 14 (App Router) + Tailwind CSS + Zustand
```

---

## ⚙️ المتطلبات الأساسية

- Node.js 18+ 
- PostgreSQL 14+ (محلي أو عبر Docker/Neon/Supabase)
- npm أو pnpm

---

## 🚀 التشغيل — Backend

```bash
cd backend
npm install

# انسخي ملف البيئة وعدّلي القيم (خصوصاً DATABASE_URL و JWT_SECRET)
cp .env.example .env

# أنشئي قاعدة البيانات وطبّقي الـ migrations
npx prisma migrate dev --name init

# عبّئي البيانات الأولية (محافظات الأردن + مستخدم أدمن + منتجات تجريبية)
npm run seed

# شغّلي السيرفر
npm run dev
```

السيرفر سيعمل على: `http://localhost:4000`

بيانات دخول الأدمن الافتراضية (من `.env`):
- **اسم المستخدم:** `alsahrqiat`
- **كلمة المرور:** `alsharqiat_@erbed12300` ⚠️ **غيّريها فوراً في بيئة الإنتاج**

---

## 🚀 التشغيل — Frontend

```bash
cd frontend
npm install

cp .env.example .env.local
# عدّلي NEXT_PUBLIC_ADMIN_WHATSAPP برقم واتساب الأدمن الحقيقي (بصيغة دولية بدون +)

npm run dev
```

الموقع سيعمل على: `http://localhost:3000`
لوحة التحكم: `http://localhost:3000/admin/login`

---

## 🧱 البنية التقنية

### Backend
- **Prisma ORM** مع PostgreSQL — كل الحقول المالية من نوع `Decimal` (وليس `Float`) لتفادي أخطاء التقريب
- **معمارية Controller → Service → Repository** مطبّقة على كل الـ modules
- **Zod** للتحقق من صحة كل المدخلات (body/query/params)
- **JWT** لحماية مسارات `/api/admin/*` فقط (لا يوجد أي auth على واجهة العميل بحسب المتطلبات)
- **Rate limiting** على تسجيل الدخول وإنشاء الطلبات
- **توليد رقم الطلب المتسلسل** (`#SQ-1001`) بشكل آمن من التعارض عبر جدول `OrderCounter` داخل `$transaction`
- **خصم المخزون الذري (Atomic)**: كل عملية إنشاء طلب تتحقق من توفر الكمية وتخصمها ضمن transaction واحدة، فتُلغى العملية بالكامل عند أي تعارض (مثل عميلين يطلبان آخر قطعة في نفس اللحظة)
- **Snapshot لبيانات الطلب**: اسم المنتج والسعر يُحفظان وقت الطلب في `order_items`، فلا يتأثر الطلب القديم بأي تعديل لاحق على المنتج

### Frontend
- **Next.js App Router** مع مجموعتي مسارات: `(shop)` للمتجر و `admin` للوحة التحكم
- **Zustand + persist** لسلة المشتريات (تُحفظ في localStorage، بدون أي حاجة لجلسة خادم)
- **Framer Motion** للانتقالات والتفاعلات الدقيقة
- **خط Cairo/Tajawal** مع دعم RTL كامل
- **رابط واتساب مُعبّأ مسبقاً** يُبنى تلقائياً من بيانات الطلب عند نجاح الشراء

---

## 🔑 أهم مسارات الـ API

### عامة (بدون مصادقة)
```
GET  /api/products              — قائمة المنتجات (فلاتر: category, search, sort, page)
GET  /api/products/:slug        — تفاصيل منتج
GET  /api/products/categories   — قائمة الفئات المتاحة
GET  /api/shipping-zones        — المحافظات وأسعار الشحن
POST /api/orders                — إنشاء طلب جديد
GET  /api/orders/:orderCode     — تفاصيل طلب (لصفحة النجاح)
```

### الأدمن (محمية بـ JWT)
```
POST   /api/admin/auth/login
GET    /api/admin/auth/me

GET    /api/admin/products
POST   /api/admin/products
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id
POST   /api/admin/products/:id/images
DELETE /api/admin/products/images/:imageId

GET    /api/admin/orders
PATCH  /api/admin/orders/:id/status   — إلغاء الطلب يُعيد المخزون تلقائياً

GET    /api/admin/stats             — إحصائيات الداشبورد
```

---

## 📦 ما يجب فعله قبل النشر (Production Checklist)

- [ ] شغّلي `npm install` في `backend/` و`frontend/` محلياً وارفعي ملفي `package-lock.json` الناتجين — غير موجودين حالياً، وبدونهم كل نشر يجلب نسخ تبعيات قد تختلف عن التي جرّبتِها محلياً
- [ ] غيّري `JWT_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` و `ADMIN_PASSWORD` في `.env` (قيم مختلفة وعشوائية لكل واحد)
- [ ] استخدمي قاعدة بيانات PostgreSQL مُدارة (Neon, Supabase, RDS, Railway Postgres...)
- [ ] فعّلي HTTPS وارفعي `CLIENT_URL` للدومين الحقيقي (لضبط CORS)
- [ ] استبدلي تخزين الصور المحلي بتخزين سحابي — الدعم موجود الآن جاهز عبر `STORAGE_DRIVER=s3` (S3 أو Cloudflare R2 أو أي بديل متوافق)، فقط عبّي بيانات الباكت في `.env`
- [ ] أضيفي نسخة احتياطية دورية لقاعدة البيانات
- [ ] راجعي رقم واتساب الأدمن في `NEXT_PUBLIC_ADMIN_WHATSAPP`
- [ ] عبّي `NEXT_PUBLIC_SITE_URL` بالدومين الحقيقي (يُستخدم في sitemap.xml و robots.txt وروابط المشاركة)

---

## 🧱 Migrations (v0.6 — production-readiness fixes)

`backend/prisma/migrations/` كان فارغاً — أضفنا migration أولي (`20260801000000_init`) يطابق `schema.prisma` بالكامل، لأن `railway.json` يشغّل `prisma migrate deploy` عند كل نشر وهذا الأمر لا يفعل شيئاً بدون ملفات migrations فعلية.

**قبل أول نشر أو أول `npm run dev` محلي بعد هذا التحديث:**
```bash
cd backend
npx prisma migrate deploy   # يطبّق الـ migration الجاهز على قاعدة بيانات فارغة
# أو، إذا كانت قاعدة بيانات التطوير لديك تحتوي بيانات من قبل هذا التحديث:
npx prisma migrate dev      # يتأكد أن القاعدة والـ schema متطابقين تماماً، وينشئ أي فرق كـmigration جديد صغير
npm run seed
```

هذا التحديث يضيف أيضاً: `.gitignore` (لم يكن موجوداً)، `robots.txt`/`sitemap.xml`/favicon ديناميكية في الفرونت اند، ودعم اختياري لتخزين S3-compatible للصور (`STORAGE_DRIVER=s3` في `.env` — القيمة الافتراضية `local` تُبقي كل شيء كما كان).

---

## 🗺️ خارطة طريق مقترحة (توسعات مستقبلية)

- كوبونات خصم
- دعم لغة إنجليزية موازية (i18n)
- تتبع الشحنة برقم تتبع
- تصدير تقارير المبيعات (Excel/PDF)

---

## 🆕 Production Upgrade Notes (v0.2)

This upgrade hardens the checkout/order pipeline for production use in Jordan. Summary of changes:

- **Governorate is now a strict Prisma enum** (`Governorate`, 12 values) instead of free text — both `ShippingZone.governorate` and `Order.governorate` reference it. Run a fresh migration after pulling this update:
  ```bash
  cd backend
  npx prisma migrate dev --name governorate_enum_and_structured_orders
  npm run seed
  ```
- **Order model restructured:**
  - `customerName` → `firstName` + `lastName`
  - `addressDetails` (free text) → `area`, `street`, `buildingNumber`, `landmark?`
  - `orderCode` is now generated as `SHRQ-YYYYMM-XXXX` (e.g. `SHRQ-202607-0001`), resetting its sequence every calendar month. It doubles as the public tracking code.
- **Dual WhatsApp notifications**: `backend/src/modules/notifications/whatsapp.service.ts` sends an automated message to the customer *and* the admin the moment an order is created (via WhatsApp Business Cloud API). Configure `WHATSAPP_API_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` in `.env` — without them the service logs the message instead of sending it (safe for local dev).
- **Rate limiting**: order creation was already protected; the public tracking lookup (`GET /api/orders/:orderCode`) is now also rate-limited (`orderTrackingRateLimiter`) to prevent brute-forcing tracking codes.
- **Admin orders**: filter by governorate + status, debounced search by tracking code/name/phone, and an explicit spinner on the inline status-change control.
- **Frontend**: checkout now has a searchable governorate dropdown, split first/last name fields, and structured address inputs. `/track` accepts `?code=SHRQ-...` for one-tap links coming from WhatsApp.

No payment gateway was introduced — COD and manual transfer remain the only two payment paths.

---

## 🔐 Security Upgrade Notes (v0.3)

This upgrade hardens auth, uploads, observability, and performance. After pulling it:

```bash
cd backend
cp .env.example .env   # merge in any custom values from your old .env
npx prisma migrate dev --name refresh_tokens_audit_logs_lockout
npm install             # picks up winston, @sentry/node, cookie-parser, compression, node-cache
npm run seed            # safe to re-run — it's idempotent (upsert)
```

- **Refresh tokens**: access tokens now expire in 15 minutes (`JWT_ACCESS_EXPIRES_IN`) and are silently renewed via a rotating refresh token stored in an httpOnly cookie (`JWT_REFRESH_SECRET`, 30-day default). Refresh tokens are hashed (SHA-256) before being stored, and reuse of an already-rotated token revokes every session for that admin as a theft precaution.
- **Brute-force lockout**: after `LOGIN_MAX_ATTEMPTS` (default 5) failed logins, the account locks for `LOGIN_LOCK_MINUTES` (default 15), on top of the existing IP-based rate limiter.
- **CSRF protection**: only the refresh/logout endpoints use a cookie, so only they need CSRF protection — a double-submit `csrf_token` cookie + `x-csrf-token` header. The rest of the admin API uses a Bearer header, which is CSRF-immune by design.
- **Upload security**: images are now verified by content (via `sharp`/libvips), not just by client-supplied mimetype/extension, then re-encoded (stripping EXIF/GPS metadata) and saved under a random filename with an extension derived from the *detected* format.
- **Audit logs**: every admin login/logout/lock event and every product/order write is recorded in `admin_audit_logs`, viewable via `GET /api/admin/audit-logs`.
- **Logging**: replaced the console-based logger with Winston (JSON logs in production, colorized console in dev), still exposed via the same `logger.info/warn/error` calls everywhere else in the codebase.
- **Error monitoring**: optional Sentry integration on both backend (`SENTRY_DSN`) and frontend (`NEXT_PUBLIC_SENTRY_DSN`) — no-ops if left empty.
- **Caching**: public GET endpoints (`/api/products`, `/api/products/:slug`, `/api/shipping-zones`) are cached in-memory for `CACHE_TTL_SECONDS` (default 60s) and invalidated automatically on any admin write.
- **New indexes**: `Product(category, isActive)`, `Product(isFeatured)`, `Product(createdAt)`, `Order(createdAt)`, `Order(status, createdAt)` for faster catalog/admin queries.

---

## 💳 Payment Upgrade Notes (v0.4)

Adds a mandatory 20% Orange Money deposit on top of the existing payment paths. After pulling it:

```bash
cd backend
cp .env.example .env   # merge in the new ORANGE_MONEY_* values from your old .env
npx prisma migrate dev --name orange_money_deposit_payments
npm run seed            # safe to re-run — it's idempotent (upsert)
```

- **New payment method: `ORANGE_MONEY`** — customer pays 20% upfront to a merchant number (`ORANGE_MONEY_MERCHANT_NUMBER` in `.env`) and enters their phone number + transaction reference at checkout.
- **`COD` now also requires the 20% deposit** — the remaining 80% is still paid in cash on delivery, as before.
- **`MANUAL_TRANSFER` is unchanged** — no deposit concept, same Western Union / bank transfer flow as v0.2.
- **New `Order.paymentStatus`** (`PENDING` / `DEPOSIT_PAID` / `FULLY_PAID` / `FAILED`), independent of the fulfillment `status`. An order stays `paymentStatus: PENDING` until an admin manually verifies the deposit — there is no payment-gateway API integration, verification is a manual button in the admin dashboard.
- **New `OrderStatus.PROCESSING`** step between `CONFIRMED` and `SHIPPED`. Verifying a deposit on a `PENDING` order automatically advances it to `PROCESSING`.
- **Admin orders table**: expand any order with a deposit to see the phone number + transaction reference and a "تأكيد استلام الدفعة" (confirm deposit received) button.
- **Tracking page (`/track`) and order-success page** now show the deposit amount and whether it's been verified.

No online payment gateway was introduced — this is still manual verification, just with an added Orange Money deposit step.

---

## ⭐❤️ Reviews & Wishlist Notes (v0.5)

Adds product reviews and a wishlist. Neither requires customer accounts — this storefront is still guest-checkout only, so both features are scoped differently than a typical "userId" design:

```bash
cd backend
npx prisma migrate dev --name reviews_and_wishlist
```

- **Reviews are purchase-verified, not account-verified.** Since there's no login, "only buyers can review" is enforced by asking for the order's tracking code + phone number at submission time; the backend checks a real, non-cancelled `Order` with that phone number contains the product before saving the review (`backend/src/modules/reviews`). One review per product per order (DB-level unique constraint).
- **Wishlist is scoped to an anonymous `deviceId`**, a UUID generated once client-side (`frontend/lib/device-id.ts`) and persisted in `localStorage` — not a userId, since none exists. It's sent as a plain field/query param, never used for anything else.
- **New routes**: `GET/POST /api/reviews`, `GET/POST/DELETE /api/wishlist`.
- **Frontend**: heart toggle on product cards and the product detail page (`components/shop/WishlistButton.tsx`), a `/wishlist` page, and a review form + list + average rating on the product detail page (`components/shop/ReviewsSection.tsx`).
- If you later add real customer accounts, both `Review` and `WishlistItem` can be migrated from `customerPhone`/`deviceId` to a `userId` foreign key without changing the public API shape much.

---

## 🚀 Deployment (Vercel + Railway)

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full step-by-step guide to deploying the backend + PostgreSQL on Railway and the frontend on Vercel, including required environment variables and a post-deploy checklist.
