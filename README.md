# Expense Management Backend

This is the backend server for the Expense Management application built with Express.js and MongoDB.

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory and add the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense_db
JWT_SECRET=your_jwt_secret_key_here
```

3. Start the server:
```bash
# For development (with nodemon)
npm run dev

# For production
npm start
```

## Features
- Express.js server
- MongoDB integration
- JWT authentication
- CORS enabled
- Environment variable support

## API Endpoints
- GET / - Welcome message
