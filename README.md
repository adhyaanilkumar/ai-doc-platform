## AI-Assisted Document Authoring Platform

This repository contains a full-stack platform that enables authenticated users to configure business documents, generate content with OpenAI, iteratively refine each section/slide, and export polished Word (`.docx`) or PowerPoint (`.pptx`) files.

### Features
- User registration/login with JWT authentication and bcrypt password hashing.
- Project dashboard with saved configurations for Word or PowerPoint deliverables.
- Outline/slide scaffolding, plus optional AI-suggested templates.
- Section-by-section or slide-by-slide generation via OpenAI.
- Interactive refinement panel with prompt history, like/dislike, and comments.
- On-demand exports to `.docx` (python-docx) or `.pptx` (python-pptx).
- Plain text content generation (no markdown formatting in output).

---

## Project Structure

```
backend/      FastAPI application, SQLite persistence, OpenAI + document builders
frontend/     React + Vite single-page app for configuring, refining, exporting
```

---

## Prerequisites
- Python 3.11+
- Node.js 18+
- An OpenAI API key with access to GPT-4o or GPT-4o-mini models.

---

## Backend Setup (FastAPI)

1. **Install dependencies**
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate   # Windows
   # or: source .venv/bin/activate   # macOS/Linux
   pip install -r requirements.txt
   ```

2. **Environment variables**  
   Create `backend/.env` (mirrors `env.example`) with:
   ```
   DATABASE_URL=sqlite:///./ai_doc_platform.db
   SECRET_KEY=generate-a-secure-key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   OPENAI_API_KEY=sk-your-key
   OPENAI_MODEL=gpt-4o-mini
   FRONTEND_URL=http://localhost:3000
   ```

3. **Run the API**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

The API exposes Swagger docs at `http://localhost:8000/docs`.

---

## Frontend Setup (React + Vite)

1. **Install packages**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment variables (optional)**
   Create `frontend/.env` for custom API origins:
   ```
   VITE_API_URL=http://localhost:8000
   ```
   Defaults to `http://localhost:8000` when unset.

3. **Run the dev server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` (or the port shown in the terminal if 3000 is in use).

---

## Quick Start

To run both servers simultaneously:

**Terminal 1 (Backend):**
```bash
cd backend
.venv\Scripts\activate   # Windows
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

---

## Usage Walkthrough
1. Register a new account and sign in.
   - Password must be at least 6 characters.
2. Create a project:
   - Choose Word (`.docx`) or PowerPoint (`.pptx`).
   - Enter the main topic and outline/slide titles (or click **AI-suggest outline**).
3. Generate content per section/slide.
4. Use the refinement prompts, like/dislike, and comments to iterate with OpenAI.
5. Export to `.docx` or `.pptx` via the **Export** button.

All configuration, generated content, and refinement history are persisted in SQLite.

---

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Default database (easily swappable with PostgreSQL)
- **bcrypt** - Secure password hashing
- **python-jose** - JWT token handling
- **OpenAI API** - AI content generation
- **python-docx / python-pptx** - Document export

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TanStack Query** - Server state management
- **Axios** - HTTP client

---

## Testing & Validation
- Backend: exercise key flows via the `/docs` Swagger UI or tools such as `curl`/Postman.
- Frontend: use the React Query Devtools (optional) or browser network panel for API validation.
- Exports: open the downloaded `.docx` and `.pptx` in Microsoft Office, Google Docs/Slides, or LibreOffice.

---

## Deployment Notes
- Replace SQLite with PostgreSQL by updating `DATABASE_URL`.
- Configure CORS (`FRONTEND_URL`) for your domain.
- Add HTTPS termination and secret rotation in production.
- Store the OpenAI key in a secure secrets manager.

---

## Troubleshooting

### Port Already in Use
If port 3000 is in use, Vite will automatically try the next available port (3001, 3002, etc.). Check the terminal output for the actual URL.

### CORS Errors
The backend allows connections from multiple localhost ports (3000-3004, 5173). If you're using a different port, update `FRONTEND_URL` in the backend `.env` file.

### Password Issues
- Passwords must be at least 6 characters long.
- The system uses bcrypt for secure password hashing.

---


