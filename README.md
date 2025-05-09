# 🚀 Cramingo — AI-Powered Flashcard Web App

**Cramingo** is a modern flashcard platform built with React and Node.js that helps students create, study, and share flashcards. It integrates AI to auto-generate flashcards from notes, supports personalized study sets, and offers a sleek, responsive UI for a seamless learning experience.

---

## 🧰 Tech Stack

**Frontend**

- ⚛️ React (with TypeScript)
- 🎨 Tailwind CSS
- 🔀 React Router
- 🎯 Lucide Icons

**Backend**

- 🌐 Node.js + Express
- 🤖 OpenAI API (for AI-generated flashcards)
- 🔐 Firebase Auth (for secure user login/signup)
- 🔥 Firestore (optional, for flashcard data storage)

**Dev & Deployment**

- ⚡ Vite (frontend build tool)
- 🚀 Vercel / Render (deployment)
- 🔁 GitHub Actions (CI/CD - optional)

---

## ✨ Features

### 🧠 Flashcard Generation & Study

- **AI Flashcard Generator** – Automatically create flashcards from notes using OpenAI.
- **Manual Flashcard Editor** – Add, edit, and delete cards in a set.
- **Image Support** – Attach images to questions or answers.
- **Flashcard Viewer** – Flip-style study mode with animations.

### 📚 Flashcard Set Management

- **Create / Edit / Delete Sets**
- **Public & Private Options**
- **Search Functionality** – Search by class code, title, or description.
- **Like Sets** – Give hearts to favorite sets.
- **Save Sets** – Bookmark public sets to view later.

### 👤 User Authentication & Profiles

- **Persistent Login** – Stay logged in across sessions.
- **Profile Page** – View/edit username, field of study, and email.
- **Created Sets Dashboard** – See all sets you’ve made.

### 🌐 Frontend & UI Enhancements

- **Protected Routes** – Only accessible when logged in.
- **Mobile Responsive** – Works on all devices.
- **Enhanced UX** – Autocomplete inputs, enter-to-submit, modal confirmations.

### ⚙️ Backend API (Node.js + Express)

- `POST /generate-flashcards` – Generate flashcards from text input.
- `POST /save-flashcards` – Save a new flashcard set.
- `GET /get-flashcards` – Retrieve a specific set by ID.
- `GET /search-sets` – Find public sets based on keywords.
- and many many more!! :)

---

> Built with ❤️ by students, for students.
