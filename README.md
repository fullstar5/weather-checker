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


## Demo Flow

1. Open `http://localhost:5173/login`
2. Register a user or use default user:
   - username: `admin`
   - password: `123456`
3. Login and land on Home.
4. In Home:
   - Search a city and click `Search And Jump` to get weather info for this city
   - Change `Broadcast Frequency` / `Upcoming Hours` to adjust message display frequency and the weather info for upcoming hours  
   - Observe weather cards and map ticker message updates
   - Type and send messages with `City Chat Room` (you might want to register new a user and open new broswer tabs to test this)


## Message Push Expected Behavior

Current implementation intentionally reduces API calls:

- Change On `city`: fetch fresh weather once, cache it, emit immediately
- Change On `Upcoming Hours`: clear cache, fetch fresh weather once, emit
- Change On `refresh weather`: clear cache, fetch fresh weather once, emit
- Change On `Broadcast Frequency` : WILL NOT fetch weather, only change replay interval
- Message loops on `Broadcast Frequency`
- Change `city` will clear the current chat history


## Note 

- OpenWeather 2.5 API will only return 1 data row for every 3 hours, which means if select 3 for `Upcoming hours` only 1 data row will be returned, 2 data rows for 6 of `Upcoming hours`. The reason to not use 3.0 API is because technical issue with OpenWeather caused failure to subscribe 3.0
- All data will kept in-memory, means will be cleaned once server restarts
- To test live chat room function, please open multiple browser tabs and register new users