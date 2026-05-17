# CafeHop

CafeHop is a mobile platform designed to help users discover and connect with local cafes in their area. Users can explore trending coffee spots, track their cafe visits, earn rewards, and share reviews with the community. Cafe owners can also create and manage their business profiles, making it easier to engage with customers and grow their presence.

Built with a modern cross-platform architecture, CafeHop combines mobile development, cloud infrastructure, and AI-powered recommendation systems to deliver a personalized cafe discovery experience.

---

# Tech Stack

## Frontend
- React Native (Expo)
- TypeScript

## Backend
- Python (Flask)
- Hosted on Render

## Database & Authentication
- Supabase (PostgreSQL)

## AI & Recommendations
- Python-based recommendation services integrated with the backend

---

# Project Structure

```bash
CafeHop/
│
├── frontend/    # React Native Expo mobile application
└── backend/     # Flask API server and AI services
```

---

# Getting Started

## Prerequisites

Before running the project, make sure you have the following installed:

- Node.js and npm
- Python 3.x
- Expo CLI

```bash
npm install -g expo-cli
```

You will also need a configured Supabase project with the required database tables and authentication setup.

---

# Running the Frontend

```bash
cd frontend
npm install
npx expo start
```

Once Expo starts:

- Scan the QR code using the Expo Go app on your mobile device
- Press `w` to launch the web version
- Press `i` for the iOS simulator
- Press `a` for the Android emulator

---

# Running the Backend

```bash
cd backend

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

The backend API will run locally at:

```bash
http://localhost:5000
```

---

# Environment Variables

## Frontend (`frontend/.env`)

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Backend (`backend/.env`)

Add any required API keys, database credentials, and service configuration values.

---

# Core Features

- Discover nearby cafes and local favorites
- Track cafe visits and personal favorites
- Leave ratings and reviews
- Earn rewards and engagement-based perks
- Cafe owner profile management
- AI-powered cafe recommendations
- Cross-platform mobile experience

---

# Team

| Name | Role |
|---|---|
| Sehr Abrar | Frontend Engineering |
| Anas Ahmed | Backend, AI, and Fullstack Engineering |
| Saanavi Goyal | Backend, AI, and Fullstack Engineering |
| Klea Meta | Deployment and Frontend Engineering |

---

# Vision

CafeHop aims to make cafe discovery more personal, social, and rewarding by combining community-driven experiences with intelligent recommendations. Whether users are searching for a study spot, a place to relax, or a trending local cafe, CafeHop helps them discover the right place.