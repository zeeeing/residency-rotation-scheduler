# Residency Rotation Scheduler (R2S)

## Project Overview

Residency Rotation Scheduler is a constraint-based optimization tool that uses Google OR-Tools to construct fair, feasible residency rotation timetables. The application helps manage resident assignments across different postings while respecting hard constraints (capacity, duration, stage rules) and optimizing soft goals (preferences, balanced utilization).

## Recent Changes

**November 26, 2025** - Initial Replit setup
- Configured Python 3.11 and Node.js 20 environments
- Installed backend dependencies (FastAPI, OR-Tools, pandas, uvicorn)
- Installed frontend dependencies (React, Vite, Tailwind CSS)
- Configured Vite to run on port 5000 with 0.0.0.0 host for Replit compatibility
- Updated backend CORS to allow localhost:5000
- Created workflows for frontend (port 5000) and backend (port 8000)
- Updated .gitignore for Python and Node.js projects

## Project Architecture

### Frontend (client/)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **Data Visualization**: Recharts
- **Drag & Drop**: dnd-kit
- **Port**: 5000 (configured for Replit webview)

Key features:
- CSV upload and validation for residents, postings, preferences, and history
- Interactive timetable editor with drag-and-drop
- Weightage configuration for solver parameters
- Optimisation score visualization
- Export final timetables as CSV

### Backend (server/)
- **Framework**: FastAPI
- **Optimization Engine**: Google OR-Tools CP-SAT solver
- **Data Processing**: Pandas
- **Port**: 8000 (localhost)

Key endpoints:
- `POST /api/solve` - Run the optimization solver with uploaded CSVs
- `POST /api/save` - Save manual edits to resident schedules
- `POST /api/download-csv` - Export final timetable

Services:
- `posting_allocator.py` - Core OR-Tools constraint solver
- `preprocessing.py` - CSV parsing and input normalization
- `postprocess.py` - Solution scoring and statistics
- `validate.py` - Assignment validation against constraints

## Development

### Running Locally

Both workflows are configured and run automatically:
1. **Frontend** - Runs on port 5000, displays in webview
2. **Backend** - Runs on port 8000

To manually restart:
- Frontend: `cd client && npm run dev`
- Backend: `uvicorn server.main:app --host 127.0.0.1 --port 8000`

### File Structure

```
├── client/              # React frontend
│   ├── src/
│   │   ├── api/        # Backend API client
│   │   ├── components/ # React components & UI primitives
│   │   ├── pages/      # Main pages (Dashboard, Overview)
│   │   ├── context/    # React context providers
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utilities and constants
│   │   └── types/      # TypeScript type definitions
│   └── public/         # Static assets
├── server/             # FastAPI backend
│   ├── services/       # Core business logic
│   └── main.py        # FastAPI application & endpoints
└── constraints.md      # Detailed constraint documentation
```

## User Preferences

No specific user preferences documented yet.

## Dependencies

### Python (server/requirements.txt)
- fastapi >= 0.110.0
- uvicorn >= 0.23.0
- ortools >= 9.5.2237
- pandas >= 1.5.3
- numpy >= 1.24.3

### Node.js (client/package.json)
- React 19 ecosystem
- Vite 7 build system
- Tailwind CSS 4 for styling
- Radix UI component primitives
- OR-Tools integration via backend API

## Notes

- The frontend communicates with the backend via axios HTTP client
- Default backend URL: `http://127.0.0.1:8000/api`
- Application uses in-memory state management (no persistent database)
- Constraint solver can be time-limited via `max_time_in_minutes` parameter
- See `constraints.md` for detailed explanation of optimization constraints and scoring
