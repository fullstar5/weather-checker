# Weather Checker

- Frontend: React + TypeScript + MUI
- Backend: Node.js + Express + Socket.IO + TypeScript
- Weather data: OpenWeather `2.5/weather` + `2.5/forecast`
- Storage: in-memory (no database)

## Project Structure

```text
weather-checker/
  frontend/
  backend/
```

## Prerequisites

- Node.js 20+
- npm 10+
- OpenWeather API key

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=3001
WEATHER_API_KEY=your_openweather_key
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:3001
```

## Install

From project root:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

## Run Locally

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## Build Check

```bash
npm run build --prefix backend
npm run build --prefix frontend
```

## Demo Flow

1. Open `http://localhost:5173/login`
2. Register a user or use default user:
   - username: `admin`
   - password: `123456`
3. Login and land on Home.
4. In Home:
   - Search a city and click `Search And Jump`
   - Change `Frequency` / `Upcoming Hours`
   - Observe weather cards and map ticker message updates


## Message Push Expected Behavior

Current implementation intentionally reduces API calls:

- Change On `city`: fetch fresh weather once, cache it, emit immediately
- Change On `Upcoming Hours`: clear cache, fetch fresh weather once, emit
- Change On `refresh weather`: clear cache, fetch fresh weather once, emit
- Change On `Broadcast Frequency` : WILL NOT fetch weather, only change replay interval
- Message loops on `Broadcast Frequency`

This means city/upcoming/refresh cause a new weather fetch, but frequency-only changes do not.

## Notes

- OpenWeather forecast endpoint is 3-hour granularity (`2.5/forecast`), so upcoming entries are stepped by 3 hours.
- Data is in-memory for challenge/demo purposes and resets on server restart.