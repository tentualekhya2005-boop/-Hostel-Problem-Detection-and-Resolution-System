# Hostel Problem Detection and Resolution System

🚀 **Live Deployment:**https://hostel-problem-detection-and-resolu.vercel.app/

A comprehensive MERN stack application designed to manage, track, and resolve hostel-related issues efficiently. It provides dedicated interfaces for Admins, Students, and Staff/Workers, streamlining communication and issue resolution within hostel environments.

## 🎥 Project Demo 
![Project Demo Video](./demo.mp4)

## Project Structure
```text
Hostel System/
├── backend/              # Node.js Express backend
│   ├── models/           # MongoDB schemas (User, Complaint, Notification, Announcement)
│   ├── routes/           # API routes (auth, complaints, notifications)
│   ├── controllers/      # Route logic and request handling
│   ├── middleware/       # Authentication, authorization, file upload
│   ├── index.js          # Main Express application
│   └── package.json      # Node dependencies
│
├── frontend/             # React frontend (Vite)
│   ├── src/              # React source code
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page views (Dashboard, Login, Complaints)
│   │   ├── i18n/         # Multi-language translations
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # Entry point
│   ├── public/           # Public static assets
│   ├── vite.config.js    # Vite configuration
│   └── package.json      # Node dependencies
│
└── README.md             # This file
```

## Features
- **Role-Based Dashboards**: Tailored interfaces and privileges for Students, Workers, and Admins.
- **Complaint Lifecycle Management**: Students can raise complaints, track their status, and admins/workers can update and resolve them.
- **Real-Time Notification System**: Broadcast announcements by Admins, automated alerts for complaint updates, linked directly to users' dashboards.
- **Automated Data Maintenance**: Clean up of related notifications when a complaint is deleted.
- **Modern, Responsive UI**: Equipped with Dark Mode persistence and responsive design for optimal viewing across devices.
- **Multi-Language Support (i18n)**: Seamless language localization with `react-i18next`.
- **Secure Authentication**: Encrypted credentials with JWT-based session management and bcrypt.

## Technology Stack

### Backend
- **Node.js** & **Express.js** (REST API)
- **MongoDB** via **Mongoose** (Database)
- **JWT** & **Bcryptjs** (Authentication & Security)
- **Nodemailer** / **Multer** (Email sending & File uploads)

### Frontend
- **React 19** via **Vite**
- **React Router** (Navigation)
- **Axios** (HTTP Client)
- **Lucide React** (Iconography)
- **React-Toastify** (Toast notifications)
- **React-i18next** (Internationalization)

## Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB URI (Local or Atlas)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` root directory:
   ```env
   PORT=5000
   MONGO_URI=your-mongodb-connection-string
   JWT_SECRET=your-secret-key-here
   ```
   *(Note: The system also supports `mongodb-memory-server` for localized fast development testing if configured).*

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend/` root directory (Optional):
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

## Running the Application

### Start Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Run the server (default runs on `http://localhost:5000`):
   ```bash
   node server.js 
   ```

### Start Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173` (Vite's default port) and automatically open in your browser depending on your Vite config.

## Core API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login to receive a JWT

### Complaints
- `GET /api/complaints` - Fetch all complaints (Filtered by role: User sees own, Admin sees all)
- `POST /api/complaints` - Create a new complaint
- `PUT /api/complaints/:id` - Update complaint status (Resolved/Pending)
- `DELETE /api/complaints/:id` - Delete a complaint (Also sweeps related notifications)

### Notifications & Announcements
- `GET /api/notifications` - Get personalized notifications for the logged-in user
- `POST /api/notifications/broadcast` - Broadcast an announcement to all students/workers (Admin only)
- `DELETE /api/notifications/:id` - Clear a read notification

## System Architecture

### Components
- **Auth Module (`backend/routes/auth.js`)**
  Manages secure login creation, role allocation, and token issuance.
- **Complaint Module (`backend/routes/complaints.js`)**
  Handles standard CRUD for complaints and strictly maps state transitions of a problem.
- **Notification Manager (`backend/routes/notifications.js`)**
  System-wide messaging. Alerts generated automatically on complaint state changes and via manual Admin announcements.
- **React Frontend (`frontend/src/`)**
  State-managed client interfaces implementing role-based protected routes and dynamic theme scaling (Dark/Light mode + Multi-Language).

### Data Flow
1. **Interaction**: User submits a complaint or an admin fires off a system update broadcast via UI.
2. **REST Processing**: Axios pushes payload to Node API; validated dynamically by Express middlewares (e.g., token verification).
3. **Database Tx**: Mongoose manipulates MongoDB records (Schema validated).
4. **Trigger Events**: Completing an action triggers automatic hooks. E.g., deleting a complaint systematically deletes the attached notifications.
5. **Client Hydration**: React syncs the state. Dark Mode choices and localized language selections are maintained via persistent local storage.

## Development Setup Limitations & Considerations
- **Environment**: Developed using modern ES modules. Ensure Vite requirements are met.
- **Data Persistence**: Uses a non-relational database. Future complex multi-relation stats tracking may require heavy aggregation steps.
- **File Uploads**: Base setup uses `multer` for receiving files; ensure target directories or cloud buckets (like S3) are securely configured if you scale them for production.

## Future Enhancements
- Expand to Mobile app environments (React Native).
- Implement WebSocket (Socket.io) to make the live chat/notifications strictly real-time without polling.
- Advance the AI auto-categorization of specific complaint subjects.
- Extended caching layer logic (Redis) for rapid data returns on large university databases.

## License
This project is provided as-is for educational and research purposes.

## Contributing
Contributions are welcome! Please feel free to submit pull requests or open issues for bugs, UI themes (Dark/Light modes), translation files, and feature requests.
