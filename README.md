# Chest X-Ray Analysis Platform

A modern MERN stack application for chest X-ray image analysis and report generation.

## Features

- User authentication (Sign In/Sign Up)
- X-ray image upload and analysis
- AI-powered diagnosis using Hugging Face models
- Report generation and storage
- Modern, responsive medical interface

## Tech Stack

- Frontend: React with TypeScript
- Backend: Node.js/Express
- Database: MongoDB
- AI Integration: Hugging Face API
- Styling: Tailwind CSS

## Project Structure

```
chest-xray-analysis/
├── client/                 # React frontend
├── server/                 # Node.js backend
├── .env.example           # Environment variables template
└── README.md              # Project documentation
```

## Setup Instructions

1. Clone the repository
2. Install dependencies:

   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. Set up environment variables:

   - Copy `.env.example` to `.env` in both client and server directories
   - Update the variables with your configuration

4. Start the development servers:

   ```bash
   # Start backend server
   cd server
   npm run dev

   # Start frontend server
   cd ../client
   npm start
   ```

## Environment Variables

### Backend (.env)

```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
HUGGINGFACE_API_KEY=your_huggingface_api_key
```

### Frontend (.env)

```
REACT_APP_API_URL=http://localhost:5000
```

## License

MIT
