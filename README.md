# 🛰️ DealsRadar EG (صائد الصفقات)
### Automated E-Commerce Deals Radar for the Egyptian Market with Multi-Modal AI & WebPush Alerts

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vite.dev)
[![PWA Ready](https://img.shields.io/badge/PWA-100%25%20Offline-5A0FC8.svg)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**DealsRadar EG (صائد الصفقات)** is a high-performance Progressive Web App (PWA) and autonomous scraping engine built for tracking, analyzing, and alerting on real-time price drops across the Egyptian e-commerce market (**Amazon.eg**, **Noon.com/egypt**, **Jumia.com.eg**, **B.TECH**, **2B**, and user-registered custom stores).

---

## 🌟 Key Capabilities & Technical Highlights

### 1. Dual-Filtering Architecture (Decoupled Browsing vs. Persistent Alerts)
- **Transient Feed View Filters**:
  - Continuous **Minimum Discount % Slider** ($10\%$ to $90\%+$).
  - Price Range Bounds in **Egyptian Pounds (EGP / ج.م)**.
  - Store toggles (Amazon EG, Noon EG, Jumia EG, B.TECH, 2B, Custom).
  - Category facets (Electronics, Home & Kitchen, Fashion, Beauty, Supermarket).
  - Sorting: *Biggest % Drop*, *Price: Low to High*, *Price: High to Low*, *Verified Historical Low*, *Newest*.
- **Independent Background Alert Rules**:
  - Persistent daemon triggers (e.g. *"Notify me ONLY if a Coffee Machine drops > 40% and price is under 2,500 EGP on Amazon or Noon"*).
  - **24-Hour Cooldown Protection** to eliminate notification fatigue.
  - Native **Web Push API** alerts even when the browser / PWA is closed.

### 2. Multi-Modal AI Search Engine (Voice, Image, Text)
- **🎙️ Voice NLP Parser (Egyptian Arabic & English)**:
  - Supports spoken phrases (e.g., *"عايز شاشة سامسونج 55 بوصة عليها خصم أكتر من ثلاثين في المية وسعرها أقل من عشرين ألف"*).
  - Converts spoken dialect, number words ("ألفين وخمسمية", "ثلاثين بالمية"), and store names into structured JSON query filters.
- **📷 Visual / Image Search & OCR**:
  - Upload product photos or camera snapshots (shoe boxes, coffee machines, perfumes).
  - Extracts OCR tokens, infers brand/category, and automatically matches current live discounts in the catalog.
- **🔍 Bilingual Full-Text Search**:
  - Real-time English and Arabic keyword tokenization.

### 3. Price Integrity & Fake Markup Detection
- **Real-Time Formula**:
  $$\text{Discount \%} = \frac{\text{Original Price} - \text{Deal Price}}{\text{Original Price}} \times 100$$
- **Price History Trendline**: Visual SVG timeline chart showing price fluctuations over time.
- **Fake Markup Alert**: Warns users if a retailer artificially inflated the "original price" right before a sale.

### 4. Dynamic Store Extensibility ("Add New Website")
- Register any Egyptian or global retail website.
- Custom CSS selector configuration (`item_container`, `title`, `price_now`, `price_was`, `image`, `badge`, `link`).
- **Dry-Run Validation Test Run**: Tests live selector extraction and previews sample parsed products before saving.

---

## 🏗️ System Architecture

```text
dealsradar-eg/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Endpoints (deals, alerts, stores, media)
│   │   ├── core/            # Config, security (SSRF & hashing), rate limiting
│   │   ├── db/              # SQLAlchemy 2.0 async engine & sessions
│   │   ├── models/          # ORM models (Deal, Store, PriceHistory, AlertRule)
│   │   ├── schemas/         # Pydantic v2 schemas
│   │   ├── scrapers/        # Amazon.eg, Noon.eg, Jumia.eg, Custom Extensible Engine
│   │   ├── services/        # WebPush, AI multi-modal parser, scheduler, alert evaluator
│   │   └── main.py          # FastAPI ASGI app + static PWA mount
│   ├── tests/               # 100% passing Pytest integration test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # React / Vite PWA
│   ├── public/              # manifest.webmanifest, sw.js, offline.html, icons
│   ├── src/
│   │   ├── components/      # DealCard, DualFilterBar, PriceHistoryModal, VoiceModal, ImageModal, AddSiteModal, AnalyticsView
│   │   ├── hooks/           # usePushNotifications, useVoiceRecorder, useDeviceId
│   │   ├── api/             # API client with offline caching & IndexedDB sync
│   │   ├── App.jsx          # Master PWA layout & state coordinator
│   │   └── index.css        # Modern glassmorphism & Tailwind design system
│   ├── index.html
│   └── vite.config.js
├── deploy/                  # Production configurations
│   ├── render.yaml          # Render Blueprint (Zero-touch automated deployment)
│   ├── Dockerfile           # Multi-stage production container
│   ├── vercel.json          # Vercel deployment spec
│   └── deploy.sh            # One-click deployment script
└── README.md
```

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 18+** & **npm**

### 2. Backend Setup & Test Suite
```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run Pytest test suite (11/11 tests pass)
python -m pytest tests/

# 4. Start the FastAPI development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/docs`

### 3. Frontend PWA Setup
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start Vite dev server with proxy to backend
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🚀 Cloud Deployment (Render Blueprint)

This repository includes a production-ready `deploy/render.yaml` Blueprint for 1-click cloud deployment.

### Step-by-Step Public Live URL Deployment:
1. Initialize git and push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: DealsRadar EG production release"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/dealsradar-eg.git
   git push -u origin main
   ```
2. Log in to [Render.com](https://render.com).
3. Click **New +** $\rightarrow$ **Blueprint**.
4. Select your `dealsradar-eg` repository.
5. Render reads `deploy/render.yaml` and deploys your unified service.
6. Your public live HTTPS link will be generated (e.g. `https://dealsradar-eg.onrender.com`).

---

## 🧪 Testing Coverage

The backend includes full async pytest coverage across scrapers, currency parsers, AI voice NLP, and alert evaluation:
```bash
python -m pytest tests/
```
**Results**:
- `tests/test_alert_rules.py` (Alert rules CRUD, WebPush subscription, notification center)
- `tests/test_deals_api.py` (Feed filtering, discount bounds, market analytics, health check)
- `tests/test_multimodal.py` (Egyptian Arabic voice NLP, OCR brand extraction)
- `tests/test_scrapers.py` (Egyptian Pound normalization, circuit breakers, discount percentage math)

---

## 🔒 Security & Compliance
- **Anti-Block & Circuit Breakers**: Automatic user-agent rotation and exponential backoff to respect remote retail servers.
- **SSRF Protection**: Custom store URLs are validated against loopback, link-local, private IPs, and internal cloud metadata services.
- **Rate Limiting**: In-memory sliding window limiter (`60 req/min` for search, `30 req/min` for media uploads).

---

## 📄 License
MIT License. Built for the Egyptian developer & shopper community.
