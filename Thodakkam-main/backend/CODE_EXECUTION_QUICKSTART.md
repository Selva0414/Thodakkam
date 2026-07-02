# 🚀 Code Execution Engine - Quick Setup

## ⚠️ Piston API is Now Whitelist-Only
The public Piston API is no longer accessible. We've switched to **Judge0**, a powerful alternative.

## 🎯 Choose Your Setup Method:

### 1️⃣ **RapidAPI (Easiest - 2 minutes)**
**Best for:** Quick testing, development
**Cost:** FREE (50 requests/day) or paid plans
**Setup:**

1. Visit: https://rapidapi.com/judge0-official/api/judge0-ce
2. Click "Subscribe to Test" → Choose FREE plan
3. Copy your **API Key** from the dashboard
4. Update `backend/.env`:
   ```env
   RAPIDAPI_KEY=your_api_key_here
   ```
5. Restart backend: `npm start`

---

### 2️⃣ **Self-Hosted (Production Ready)**
**Best for:** Production use, unlimited requests
**Requirements:** Docker & Docker Compose
**Setup:**

1. Make sure Docker is running
2. Open terminal in `backend` folder:
   ```bash
   docker-compose -f docker-compose.judge0.yml up -d
   ```
3. Wait 30 seconds for services to initialize
4. Test it works:
   ```bash
   curl http://localhost:2358/about
   ```
5. Update `backend/.env`:
   ```env
   JUDGE0_URL=http://localhost:2358
   ```
6. Restart backend: `npm start`

**To Stop:**
```bash
docker-compose -f docker-compose.judge0.yml down
```

---

### 3️⃣ **Public Instance (Testing Only)**
**Best for:** Quick testing only
**Limitations:** Rate limits, not for production
**Setup:**

Update `backend/.env`:
```env
JUDGE0_URL=https://ce.judge0.com
```

---

## ✅ Verify It Works

Test the code execution:

1. Start your backend server
2. Go to student dashboard
3. Start an assessment with coding round
4. Write simple code:
   ```javascript
   console.log("Hello World");
   ```
5. Click **"Run Code"**
6. You should see output in the console!

---

## 🌐 Supported Languages

✅ JavaScript (Node.js)
✅ Python 3
✅ Java
✅ C++ / C
✅ TypeScript
✅ Go
✅ Rust
✅ C#
✅ Ruby
✅ PHP
✅ Swift
✅ Kotlin

---

## 🛠️ Troubleshooting

**Error: "Code execution API not configured"**
- Make sure you set either `RAPIDAPI_KEY` or `JUDGE0_URL` in `.env`
- Restart the backend server after changing `.env`

**Docker not starting:**
- Check Docker Desktop is running
- Run: `docker-compose -f docker-compose.judge0.yml logs`

**Rate limit errors:**
- Switch to self-hosted option
- Or upgrade RapidAPI plan

---

## 📚 More Info

- Judge0 Documentation: https://ce.judge0.com/
- RapidAPI Judge0: https://rapidapi.com/judge0-official/api/judge0-ce
- Self-hosting Guide: https://github.com/judge0/judge0

---

**Recommended:** Use **Self-Hosted** option for production → Unlimited requests, full control, completely free!
