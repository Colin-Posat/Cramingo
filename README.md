# Fliply
🧰 Tech Stack
Frontend
React – Component-based UI library

TypeScript – Strongly-typed JavaScript for safer code

Tailwind CSS – Utility-first CSS framework for styling

React Router – Client-side routing

Lucide Icons – Icon set for UI elements

Backend
Node.js + Express – REST API for handling flashcard logic and user data

OpenAI API – AI-powered flashcard generation

Firebase Auth – Authentication and user session management

Firestore (Optional) – Real-time NoSQL database for storing flashcard sets

Deployment & Dev Tools
Vite – Fast frontend bundler and dev server

Render / Vercel – Cloud deployment for backend and frontend

GitHub Actions – CI/CD for automatic deployments (optional)

✨ Features
🧠 Flashcard Generation & Study
AI Flashcard Generator – Automatically generate flashcards from user-submitted notes using OpenAI.

Manual Flashcard Editor – Create, edit, and delete flashcards manually within a set.

Image Support – Add optional images to flashcard questions and answers.

Interactive Viewer – Flip through flashcards with animations and toggled answer reveal.

📚 Flashcard Set Management
Create / Edit / Delete Sets – Full control over flashcard sets.

Public & Private Sets – Choose visibility when saving sets.

Search Sets – Search public sets by title, class code, or description.

Like Flashcards – Show appreciation with a like system.

Save Favorite Sets – Bookmark sets for easy future access.

👤 User Authentication & Profiles
Firebase Auth Integration – Secure login and signup with persistent sessions.

AuthContext – Centralized state management for authentication across pages.

Profile Page – View and edit user info (username, field of study, email).

User Dashboard – See all sets created by the logged-in user.

🌐 Frontend & UI
Protected Routes – Secure pages restricted to authenticated users.

Responsive Design – Mobile-friendly layout with adaptive containers.

Dark Mode Support – Accessible, modern UI with a dark theme.

Dynamic UX – Autocomplete inputs, enter-to-submit, modal popups, error handling.

⚙️ Backend API (Node.js + Express)
POST /generate-flashcards – Generates flashcards from notes using GPT (auth required).

POST /save-flashcards – Saves a flashcard set to the database.

GET /get-flashcards – Fetches a specific flashcard set by ID.

GET /search-sets – Returns flashcard sets based on search query.
