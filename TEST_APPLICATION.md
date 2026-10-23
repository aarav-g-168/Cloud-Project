# Application Testing Instructions

Please follow these steps to test the Cloud Busters application with your RDS database:

## Prerequisites
- You have updated the `.env` file with your actual RDS password
- Node.js v18+ is installed
- npm is available
- Your RDS instance `cloudbusters-db.cj08820eo5ib.ap-south-1.rds.amazonaws.com` is available

## Test Procedure

### 1. Install Dependencies (if needed)
```bash
npm install
```

### 2. Start the Application
```bash
npm start
```
Keep this terminal window open - you should see:
```
Server running on http://localhost:3000
Environment: development
```

### 3. Test Health Endpoint (in another terminal)
```bash
curl -s http://localhost:3000/api/health
```
**Expected successful output:**
```json
{
  "status": "healthy",
  "timestamp": "2026-09-11T...",
  "database": {
    "connected": true,
    "responseTimeMs": 15
  },
  "server": {
    "hostname": "your-computer-name",
    "platform": "win32",
    "arch": "x64",
    "nodeVersion": "v24.19.0",
    // ... other server info
  },
  "environment": "development"
}
```
**Key verification**: `"database": {"connected": true}`

### 4. Test GET /api/users
```bash
curl -s http://localhost:3000/api/users
```
**Expected successful output:**
```json
{
  "users": [
    {
      "id": 1,
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "created_at": "2026-09-11T..."
    },
    {
      "id": 2,
      "name": "Bob Smith",
      "email": "bob@example.com",
      "created_at": "2026-09-11T..."
    },
    {
      "id": 3,
      "name": "Carol Williams",
      "email": "carol@example.com",
      "created_at": "2026-09-11T..."
    }
  ],
  "count": 3
}
```

### 5. Test POST /api/users
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'
```
**Expected successful output:**
```json
{
  "user": {
    "id": 4,
    "name": "Test User",
    "email": "test@example.com",
    "created_at": "2026-09-11T..."
  }
}
```

### 6. Verify the user was added
```bash
curl -s http://localhost:3000/api/users
```
Should now show 4 users including the test user.

### 7. Test Frontend
Open your web browser to: http://localhost:3000

You should see:
- Cloud Busters header
- Health status showing "Database: Connected"
- Form to add users
- List of users

Try adding a user via the form and verify it appears in the list.

## 📋 Reporting Results

Please report back with:
1. ✅ Server started successfully? (Y/N)
2. ✅ Health endpoint showed database connected? (Y/N)
3. ✅ GET /api/users returned sample users? (Y/N)
4. ✅ POST /api/users created new user? (Y/N)
5. ✅ Frontend loaded and worked correctly? (Y/N)
6. 📝 Any error messages you encountered

## 🔧 Troubleshooting

If you get connection errors:
- Verify your RDS instance is available and in the correct region (ap-south-1)
- Double-check the password in your `.env` file
- Ensure your local network allows outbound connections to port 3306
- Check the server.log file if you redirected output

**Important**: Do NOT share your actual password in any reports or screenshots.

Once you confirm the application works correctly with your RDS database, we'll proceed to Phase 3: VPC & Networking.