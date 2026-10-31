# SAARTHI Backend API Documentation

Base URL: `http://localhost:8000/api`

All protected endpoints require the HTTP header:
```http
Authorization: Token <your_auth_token>
```

---

## 1. System Health Check

### `GET /api/health/`
- **Access:** Public
- **Description:** Verifies that the SAARTHI Django API service is running.
- **Example Response:**
```json
{
  "status": "healthy",
  "application": "SAARTHI Backend API",
  "version": "1.0.0",
  "tagline": "Your Journey to Smarter Learning"
}
```

---

## 2. Authentication & Accounts

### `POST /api/accounts/register/`
- **Access:** Public
- **Description:** Registers a new student account, hashes password, seeds initial study structure, and returns auth token.
- **Request Body:**
```json
{
  "name": "Alex Johnson",
  "email": "alex.johnson@university.edu",
  "password": "StrongPassword123!",
  "confirm_password": "StrongPassword123!",
  "university": "Stanford University",
  "major": "Computer Science",
  "year": "3rd Year"
}
```
- **Example Response (201 Created):**
```json
{
  "success": true,
  "message": "Account created successfully.",
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user": {
    "id": 1,
    "name": "Alex Johnson",
    "email": "alex.johnson@university.edu",
    "university": "Stanford University",
    "major": "Computer Science",
    "year": "3rd Year",
    "study_goal_hours": 20,
    "notifications_enabled": true,
    "created_at": "2026-10-30T17:30:00Z"
  }
}
```

### `POST /api/accounts/login/`
- **Access:** Public
- **Description:** Authenticates user credentials and returns active auth token.
- **Request Body:**
```json
{
  "email": "alex.johnson@university.edu",
  "password": "StrongPassword123!"
}
```
- **Example Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged in successfully.",
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user": {
    "id": 1,
    "name": "Alex Johnson",
    "email": "alex.johnson@university.edu",
    "university": "Stanford University",
    "major": "Computer Science",
    "year": "3rd Year",
    "study_goal_hours": 20,
    "notifications_enabled": true,
    "created_at": "2026-10-30T17:30:00Z"
  }
}
```

### `POST /api/accounts/logout/`
- **Access:** Authenticated (`Authorization: Token <token>`)
- **Description:** Deletes the user's active session token.
- **Example Response:**
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

### `GET /api/accounts/profile/`
- **Access:** Authenticated
- **Description:** Retrieves current authenticated student's profile.
- **Example Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "name": "Alex Johnson",
    "email": "alex.johnson@university.edu",
    "university": "Stanford University",
    "major": "Computer Science",
    "year": "3rd Year",
    "study_goal_hours": 20,
    "notifications_enabled": true,
    "created_at": "2026-10-30T17:30:00Z"
  }
}
```

### `PUT /api/accounts/profile/`
- **Access:** Authenticated
- **Description:** Updates current authenticated student's profile (name, university, major, year, study_goal_hours, notifications_enabled).

---

## 3. Student Dashboard Endpoints

### `GET /api/dashboard/overview/`
- **Access:** Authenticated
- **Description:** Returns real database-backed dashboard overview:
  - Welcome greeting with dynamic time-of-day message
  - Task completion stats
  - Total saved notes count
  - Study tasks scheduled for the student
  - Recent learning activities
  - Upcoming schedule sessions

### `GET /api/dashboard/tasks/`
- **Access:** Authenticated
- **Description:** Returns all tasks belonging to the authenticated student.

### `POST /api/dashboard/tasks/`
- **Access:** Authenticated
- **Description:** Creates a new task for the student.

### `POST /api/dashboard/tasks/<id>/toggle/`
- **Access:** Authenticated
- **Description:** Toggles the `is_completed` flag on a student's task. Automatically logs an activity upon completion.
