# Buddy – Quick Start Guide

Step-by-step instructions to run the Buddy project for the first time.

## 1. Requirements

Install and verify:

- **Go** 1.21 or higher  
- **Node.js** 18 or higher  
- **MongoDB** 5.0 or higher  
- **Wails CLI** v2.10+

```bash
go version      # expect go1.21+
node --version  # expect v18+
npm --version
wails version   # expect v2.10+
```

### Install Wails CLI (if missing)

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

Ensure `$(go env GOPATH)/bin` is in your `PATH`.

## 2. Start MongoDB

### Docker (recommended)

```bash
docker run -d -p 27017:27017 --name buddy-mongo mongo:latest
```

### Local MongoDB

Start MongoDB with your system service, or:

```bash
mongod --dbpath=/path/to/data
```

### MongoDB Atlas

Use your Atlas connection string in the server `.env` as `MONGO_URI`.

If you get **DNS timeout** (`lookup _mongodb._tcp.... i/o timeout`), your network may block SRV lookups. Use the **Direct connection** string instead:

1. In Atlas: Cluster → **Connect** → **Drivers** (or **Connect your application**).
2. Choose **Go** and copy the connection string.
3. Switch to **Direct connection** (or edit the string): it should look like  
   `mongodb://user:pass@host1:27017,host2:27017,host3:27017/buddy?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin`.
4. Put that in `.env` as **`MONGO_URI_DIRECT`** (it overrides `MONGO_URI` when set), or replace `MONGO_URI` with it.

## 3. Backend server setup

```bash
cd server
cp .env.example .env
```

Edit `.env` (use your editor instead of `nano` if you prefer):

```env
PORT=8080
ENV=development
MONGO_URI=mongodb://localhost:27017/buddy
JWT_SECRET=super-secret-jwt-key-change-this-123456
GEMINI_API_KEY=your-gemini-api-key-here
ALLOWED_ORIGINS=http://localhost:34115,http://localhost:5173
```

Notes:

- **JWT_SECRET**: Use a strong, random value in production.  
- **GEMINI_API_KEY**: Get it from [Google AI Studio](https://makersuite.google.com/app/apikey). AI features are disabled if missing.

Install dependencies and run:

```bash
go mod download
go run main.go
```

You should see something like:

```
✓ Connected to MongoDB
🚀 Server starting on port 8080 (env: development)
```

## 4. Desktop app setup

Open a **new terminal**:

```bash
cd desktop
go mod download
cd frontend && npm install && cd ..
```

Optional: create `.env` in `desktop/`:

```bash
echo "BUDDY_API_URL=http://localhost:8080/api" > .env
echo "BUDDY_ENV=development" >> .env
```

## 5. Run the app

### Development (hot reload)

```bash
cd desktop
wails dev
```

On success:

- The Buddy desktop window opens.  
- The frontend dev server runs at `http://localhost:5173`.  
- Hot reload is enabled for Go and React.

### Production build

```bash
cd desktop
wails build
```

Binaries are in `desktop/build/bin/`.

## 6. First use

1. Open the app; you’ll see the **Onboarding** screen.  
2. Choose your role: **Student**, **Parent**, or **Teacher**.  
3. Sign up with email and password.  
4. You’ll be taken to your dashboard.

### Create a test user (via API)

```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "password123",
    "name": "Test Student",
    "age": 16,
    "role": "student"
  }'
```

## 7. Troubleshooting

### Server won’t start

**“Failed to connect to MongoDB”**

- Ensure MongoDB is running (`mongosh` or your GUI).  
- Check `MONGO_URI` in `server/.env`.

**“Gemini service initialization failed”**

- AI features will be disabled.  
- Add a valid `GEMINI_API_KEY` to `.env` if you need AI.

### Desktop app won’t open

**“index.html: file does not exist”**

```bash
cd desktop/frontend
npm run build
```

Then run `wails dev` or `wails build` again from `desktop/`.

**“wails: command not found”**

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
export PATH=$PATH:$(go env GOPATH)/bin
```

### Port already in use

Server (8080):

```bash
lsof -ti:8080 | xargs kill -9
```

Frontend dev server (5173):

```bash
lsof -ti:5173 | xargs kill -9
```

## 8. Development tips

### Hot reload

With `wails dev`:

- Go changes trigger a rebuild.  
- React changes apply immediately in the app.

### API health check

```bash
curl http://localhost:8080/health
```

### Logs

- Server logs appear in the terminal where you run `go run main.go`.  
- Frontend logs show in the devtools console when using `wails dev`.

### Inspect MongoDB

```bash
mongosh
use buddy
db.users.find()
db.rooms.find()
```

## 9. Next steps

- [Server API](server/README.md) – All endpoints and examples  
- [Desktop app](desktop/README.md) – Project structure and Wails bindings  
- [Root README](README.md) – Features, config, and roadmap  

## 10. Help

If you run into issues:

1. Check terminal logs (server and desktop).  
2. Verify MongoDB connection and `.env` in both `server/` and `desktop/`.  
3. Open a GitHub Issue with your OS, versions, and error messages.

---

**You’re all set.**

- Server running  
- Desktop app open  
- MongoDB connected  

You can start using Buddy.
