# Vision

Jamoa a‘zolari o‘rtasida yangi va joriy loyihalarni boshqarish tizimi.

- **CEO** loyiha qo‘shadi (yangi yoki joriy), loyiha maqsadini yozadi va topshiriqlarni jamoa a‘zolariga taqsimlaydi.
- **Jamoa a‘zolari** yangi loyiha qo‘shilganda va ularga topshiriq berilganda bildirishnoma oladi, o‘z topshiriqlari holatini yangilaydi.
- Ikkala akkauntda ham bosh sahifada barcha loyihalar ro‘yxati va bajarilish foizi (progress) ko‘rinadi.

## Tuzilma

```
backend/   FastAPI + SQLAlchemy: baza, autentifikatsiya, biznes mantiq, bildirishnomalar
src/       Next.js frontend: sahifalar va server actions, ma’lumotni backend API’dan oladi
```

Frontend backendga faqat server tomonidan murojaat qiladi. Sessiya tokeni `httpOnly` cookie’da saqlanadi va har so‘rovda `Authorization: Bearer` sarlavhasi bilan yuboriladi.

## Ishga tushirish

Python 3.10+ va Node.js 20+ kerak. Ikkala xizmatni alohida terminalda ishga tushiring.

**1. Backend** ([http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) da Swagger hujjatlari):

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**2. Frontend:**

```bash
npm install
npm run dev
```

Brauzerda [http://localhost:3000](http://localhost:3000) ni oching. Backend boshqa manzilda bo‘lsa, `.env.local` faylida `API_URL=http://host:port` ni belgilang.

Birinchi ishga tushishda `backend/data/vision.db` (SQLite) yaratiladi va CEO akkaunti qo‘shiladi:

| Login | Parol |
| --- | --- |
| `ceo@vision.uz` | `vision2026` |

Kirgandan so‘ng **Profil** sahifasida parolni almashtiring.

## Backend sozlamalari

`backend/.env` fayli orqali (namuna: `backend/.env.example`):

| O‘zgaruvchi | Standart qiymat | Izoh |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///backend/data/vision.db` | Istalgan SQLAlchemy URL |
| `CORS_ORIGINS` | `http://localhost:3000,...` | Vergul bilan ajratilgan |
| `SESSION_DAYS` | `30` | Sessiya muddati |
| `CEO_NAME`, `CEO_EMAIL`, `CEO_PASSWORD` | `Bosh direktor`, `ceo@vision.uz`, `vision2026` | Faqat baza bo‘sh bo‘lganda ishlatiladi |

## API

Barcha yo‘llar `/api` bilan boshlanadi. `login`dan boshqa hammasi `Authorization: Bearer <token>` talab qiladi.

| Metod va yo‘l | Kim | Vazifasi |
| --- | --- | --- |
| `POST /auth/login` | hamma | Token va foydalanuvchi ma’lumoti |
| `POST /auth/logout` | hamma | Sessiyani yopish |
| `GET` / `PATCH /auth/me` | hamma | Profilni ko‘rish va tahrirlash |
| `POST /auth/me/password` | hamma | Parolni almashtirish (boshqa sessiyalar yopiladi) |
| `GET /projects` | hamma | Loyihalar ro‘yxati va progress |
| `GET /projects/{id}` | hamma | Loyiha va uning topshiriqlari |
| `POST /projects` | CEO | Loyiha va topshiriqlarni yaratish |
| `PUT` / `DELETE /projects/{id}` | CEO | Tahrirlash va o‘chirish |
| `POST /projects/{id}/tasks` | CEO | Topshiriq qo‘shish |
| `GET /tasks/mine` | hamma | Menga biriktirilgan topshiriqlar |
| `PATCH /tasks/{id}/status` | CEO, ijrochi | Holatni o‘zgartirish |
| `DELETE /tasks/{id}` | CEO | Topshiriqni o‘chirish |
| `GET` / `POST /members`, `DELETE /members/{id}` | CEO | Jamoa a‘zolari |
| `GET /notifications?limit=12` | hamma | O‘qilmaganlar soni va ro‘yxat |
| `POST /notifications/{id}/read`, `POST /notifications/read-all` | hamma | O‘qilgan deb belgilash |
| `GET /health` | hamma | Holat tekshiruvi |

Xatolar `{"detail": "..."}` ko‘rinishida o‘zbek tilida qaytadi.

## Qanday ishlaydi

| Imkoniyat | CEO | Jamoa a‘zosi |
| --- | --- | --- |
| Loyihalar ro‘yxati va progress | ✓ | ✓ |
| Loyiha qo‘shish, tahrirlash, o‘chirish | ✓ | |
| Topshiriq qo‘shish va ijrochiga biriktirish | ✓ | |
| Topshiriq holatini o‘zgartirish | barchasi | faqat o‘ziniki |
| Jamoa a‘zolarini qo‘shish va o‘chirish | ✓ | |

**Progress** = bajarilgan topshiriqlar / jami topshiriqlar.

**Bildirishnomalar:**

- Loyiha qo‘shilganda barcha jamoa a‘zolariga.
- Topshiriq berilganda ijrochiga.
- A‘zo topshiriq holatini o‘zgartirganda CEO‘ga.
- Loyiha 100% bajarilganda CEO va ijrochilarga.

Ilova har 15 soniyada yangi xabarlarni tekshiradi, sahifani avtomatik yangilaydi va ekran burchagida xabar ko‘rsatadi. Qo‘ng‘iroq menyusidan brauzer bildirishnomalarini yoqsangiz, tab yopiq turganda ham tizim xabari keladi.

## Testlar

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

## Texnologiyalar

Backend: FastAPI, SQLAlchemy 2, Pydantic 2, Uvicorn. Frontend: Next.js 16 (App Router, Server Actions), React 19, Tailwind CSS 4, Phosphor Icons.

## Production

Ubuntu/Debian serverda root sifatida:

```bash
curl -fsSL https://raw.githubusercontent.com/juraevdev/vision/master/deploy/setup.sh | bash
```

Skript nginx, Python va Node.js 22 ni o‘rnatadi, kodni `/opt/vision` ga oladi, `vision-api` (FastAPI, `127.0.0.1:8005`) va `vision-web` (Next.js, `127.0.0.1:3005`) systemd xizmatlarini yaratadi hamda `vision.buildup.uz` uchun nginx proksini sozlaydi. Yangilash uchun shu buyruqni qayta ishga tushiring. `DOMAIN`, `API_PORT`, `WEB_PORT` o‘zgaruvchilari orqali sozlash mumkin.

Sayt HTTPS orqali ishlasa, `COOKIE_SECURE=true` bilan ishga tushiring. Loglar: `journalctl -u vision-api -u vision-web -f`.

Fayl tizimi vaqtinchalik bo‘lgan hostinglarda (masalan, Render) SQLite fayli har deploy‘da o‘chib ketadi. U yerda `DATABASE_URL` orqali Postgres ulang (`postgresql+psycopg://...`) va `pip install "psycopg[binary]"` qiling.
