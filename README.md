# SAARTHI (सारथी)
> **Your Journey to Smarter Learning.**

SAARTHI is a modern, full-stack, AI-powered student learning companion designed to streamline study planning, document analysis, active recall, and personalized AI mentoring. Built with a Python Django REST Framework backend and a React + Vite frontend, SAARTHI provides students with an integrated suite of academic productivity tools.

---

## Features

- **Dashboard:** Real-time overview of upcoming study sessions, pending tasks, study minutes tracking, and academic streak metrics.
- **AI Study Assistant:** Interactive conversational AI tutor powered by Google Gemini (`gemini-3.5-flash-lite`), supporting multi-turn dialogue, markdown formatting, LaTeX equations, and automatic turn-merging.
- **PDF Study Lab:** Upload academic lecture slides, research papers, and textbooks (PDFs). Extract text, generate concise summaries, key concepts, study flashcards, and practice questions.
- **AI Quiz Generator:** Generate custom multiple-choice quizzes with timed tests, difficulty levels (Easy, Medium, Hard), real-time scoring, detailed answer breakdowns with correct option highlights, and AI explanations.
- **My Notes:** Markdown-enabled personal study notebook with instant search, topic categorizations, tags, and AI note summaries.
- **Study Planner & Timetable:** Task management with priority levels, deadlines, status filters (Pending, In Progress, Completed), weekly subject-wise study timetables, and daily study goal tracking.
- **Learning Analytics:** Visual progress reports with weekly study time distribution, quiz performance history, and subject breakdown charts powered by Recharts.
- **Profile & Settings:** Personalized student profile management, avatar uploads with client/server validation, study preferences, and notification settings.

---

## Technology Stack

### Backend
- **Framework:** Python 3.10+ / Django 5.x / Django REST Framework (DRF)
- **AI Service:** Google Gemini API (`google-genai` SDK)
- **Database:** SQLite (default for development) / PostgreSQL ready
- **Document Processing:** `pypdf`
- **Authentication:** Token-based Authentication (`rest_framework.authtoken`)
- **CORS Management:** `django-cors-headers`

### Frontend
- **Framework:** React 18 (SPA)
- **Build Tool:** Vite 5
- **Routing:** React Router v6
- **Styling:** Tailwind CSS with Custom Botanical Design System
- **Icons:** Lucide React
- **Data Visualization:** Recharts
- **API Client:** Fetch-based custom API service with automatic token injection and error interception

---

## Project Structure

```
Saarthi/
├── backend/
│   ├── accounts/             # User authentication, registration, profiles & avatars
│   ├── ai_assistant/         # AI Study Assistant conversation sessions & messages
│   ├── core/                 # Gemini API service, utilities & response helpers
│   ├── dashboard/            # Study planner, tasks, timetable, analytics & notes
│   ├── documents/            # PDF Study Lab upload, extraction & AI summaries
│   ├── quizzes/              # Quiz generation, question models, test attempts & scoring
│   ├── saarthi_backend/      # Django project settings, WSGI/ASGI & root URLs
│   ├── manage.py             # Django CLI management script
│   ├── requirements.txt      # Python backend dependencies
│   └── .env.example          # Environment variable template
├── frontend/
│   ├── public/               # Static assets & favicon
│   ├── src/
│   │   ├── assets/           # Brand icons & SVGs
│   │   ├── components/       # UI components (common, layout, dashboard)
│   │   ├── context/          # React Contexts (AuthContext, ThemeContext)
│   │   ├── hooks/            # Custom hooks (useAuth, useTheme)
│   │   ├── pages/            # Page views (Dashboard, AI Assistant, PDF Lab, Quizzes, Planner, etc.)
│   │   ├── services/         # API HTTP client service
│   │   ├── utils/            # Helpers and constants
│   │   ├── App.jsx           # Root application router
│   │   ├── index.css         # Tailwind & theme variables
│   │   └── main.jsx          # React DOM entrypoint
│   ├── index.html            # Single Page Application HTML shell
│   ├── package.json          # Node.js dependencies and scripts
│   ├── postcss.config.js     # PostCSS configuration
│   ├── tailwind.config.js    # Tailwind theme & color tokens
│   └── vite.config.js        # Vite bundler configuration
├── .env.example              # Root environment template
├── .gitignore                # Git ignore rules for secrets, venv, and build files
└── README.md                 # Project documentation
```

---

## Getting Started

### Prerequisites
- **Python:** 3.10, 3.11, or 3.12
- **Node.js:** 18.x or 20.x
- **npm** or **pnpm**
- **Git**
- **Google Gemini API Key:** Obtainable from [Google AI Studio](https://aistudio.google.com/)

---

### Backend Setup (Django)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a Python virtual environment:**
   - **On Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **On macOS/Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Copy `.env.example` to `.env`:
   - **Windows:**
     ```powershell
     copy .env.example .env
     ```
   - **macOS/Linux:**
     ```bash
     cp .env.example .env
     ```
   Open `.env` and set your configuration:
   ```env
   DJANGO_SECRET_KEY=your-custom-secret-key
   DJANGO_DEBUG=True
   DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
   USE_POSTGRES=False
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   GEMINI_MODEL=gemini-3.5-flash-lite
   MAX_UPLOAD_SIZE_MB=10
   ```

5. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Start the development server:**
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```
   The backend API will be live at `http://127.0.0.1:8000/`. You can verify health at `http://127.0.0.1:8000/api/health/`.

---

### Frontend Setup (React + Vite)

1. **Open a new terminal and navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the Vite development server:**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000/`.

---

## API Endpoints Overview

| Module | Method | Endpoint | Description |
|---|---|---|---|
| **Health** | `GET` | `/api/health/` | API status check |
| **Auth** | `POST` | `/api/accounts/register/` | Register new student account |
| **Auth** | `POST` | `/api/accounts/login/` | User authentication & token issuance |
| **Auth** | `POST` | `/api/accounts/logout/` | Terminate session |
| **Profile** | `GET` / `PUT` | `/api/accounts/profile/` | Fetch and update student profile |
| **Profile** | `POST` / `DELETE`| `/api/accounts/profile/picture/` | Upload / delete profile avatar |
| **Assistant** | `GET` / `POST` | `/api/assistant/conversations/` | List and create study conversations |
| **Assistant** | `POST` | `/api/assistant/conversations/<id>/messages/` | Send message to AI Study Assistant |
| **Documents** | `GET` / `POST` | `/api/documents/` | List and upload PDF study lab documents |
| **Documents** | `POST` | `/api/documents/<id>/summarize/` | Trigger AI document summary extraction |
| **Quizzes** | `GET` / `POST` | `/api/quizzes/` | List existing quizzes or generate new ones |
| **Quizzes** | `POST` | `/api/quizzes/<id>/submit/` | Submit quiz answers and receive instant scoring |
| **Dashboard** | `GET` | `/api/dashboard/stats/` | Overview metrics and streak data |
| **Planner** | `GET` / `POST` | `/api/dashboard/tasks/` | Study tasks management |
| **Planner** | `GET` / `POST` | `/api/dashboard/timetable/` | Weekly study timetable sessions |
| **Analytics** | `GET` | `/api/dashboard/analytics/` | Study distribution & quiz trends |

---

## Security & Best Practices

- Real credentials (`.env`, `GEMINI_API_KEY`, `DJANGO_SECRET_KEY`) are excluded via `.gitignore` and must never be committed to source control.
- SQLite database (`db.sqlite3`) and user-uploaded media (`backend/media/`) are ignored to preserve local data privacy.
- All endpoints except registration and login require Token Authentication (`Authorization: Token <token>`).

---

## License

This project is developed for educational purposes under the MIT License.
