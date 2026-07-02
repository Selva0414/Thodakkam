# ========================================
# CODE EXECUTION SETUP GUIDE
# ========================================

## Option 1: RapidAPI (Quick Start - Free Tier)
### Pros: Easy setup, no hosting required
### Cons: Limited to 50 requests/day on free tier

1. Sign up at https://rapidapi.com/judge0-official/api/judge0-ce
2. Subscribe to the FREE plan
3. Copy your API key from the dashboard
4. Add to backend/.env:
   ```
   RAPIDAPI_KEY=your_api_key_here
   ```

## Option 2: Self-Hosted Judge0 (Production Ready - Unlimited)
### Pros: Unlimited usage, full control, production ready
### Cons: Requires Docker

1. Create docker-compose.yml in backend folder:
   ```yaml
   version: "3.8"
   services:
     judge0:
       image: judge0/judge0:1.13.0
       volumes:
         - ./judge0:/judge0/run
       ports:
         - "2358:2358"
       privileged: true
       environment:
         - REDIS_HOST=judge0-redis
         - POSTGRES_HOST=judge0-db
       depends_on:
         - judge0-db
         - judge0-redis
       restart: unless-stopped

     judge0-db:
       image: postgres:13
       environment:
         - POSTGRES_PASSWORD=YourSecurePassword
         - POSTGRES_DB=judge0
       volumes:
         - postgres-data:/var/lib/postgresql/data
       restart: unless-stopped

     judge0-redis:
       image: redis:6
       volumes:
         - redis-data:/data
       restart: unless-stopped

   volumes:
     postgres-data:
     redis-data:
   ```

2. Run: `docker-compose up -d`
3. Add to backend/.env:
   ```
   JUDGE0_URL=http://localhost:2358
   ```

## Option 3: Judge0 Public Instance (Testing Only)
### Note: Public instance has rate limits, not for production

Add to backend/.env:
```
JUDGE0_URL=https://ce.judge0.com
```

## Supported Languages:
✅ JavaScript (Node.js)
✅ Python 3
✅ Java
✅ C++
✅ C
✅ TypeScript
✅ Go
✅ Rust
✅ C#
✅ Ruby
✅ PHP
✅ Swift
✅ Kotlin

## Testing the Setup:
```bash
# Test with simple code execution
curl -X POST http://localhost:2358/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "console.log(\"Hello World\");",
    "language_id": 63,
    "stdin": ""
  }'
```
