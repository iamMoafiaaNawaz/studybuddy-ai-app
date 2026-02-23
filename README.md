# 🎓 StudyBuddy AI — Intelligent Study Assistant

> An AI-powered study helper built with React.js and Groq API, implementing the **GAME Framework** (Goal, Action, Memory, Environment) for intelligent, context-aware responses.

![StudyBuddy AI](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
![Groq AI](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-orange?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?style=flat-square&logo=vercel)

---

## 📌 About This Project

**StudyBuddy AI** is a full-featured, AI-powered study assistant designed to help students learn more effectively. It was built as **Assignment 1** for the AI Agents course, demonstrating the GAME Framework architecture in a real-world web application.

The app connects to the **Groq API** (using the LLaMA 3.3 70B model) to generate intelligent, context-aware responses across five different study tools.

---

## ✨ Features

### 🧠 Smart Quiz Generator
Generate fully customized quizzes on any topic with:
- **5 Question Types** — Multiple Choice (MCQ), Short Answer, Essay, Fill in the Blanks, Case Study
- **10 Subjects** — Mathematics, Science, History, English, Computer Science, Biology, Physics, Chemistry, Economics, General
- **3 Difficulty Levels** — Beginner, Intermediate, Advanced
- **Auto-Grading** for MCQs with score display and explanations
- **Model Answers** for all other question types

### 📝 Text Summarizer
- Paste any text — articles, notes, paragraphs
- AI generates a concise summary in your chosen length (1–8 sentences)
- Highlights only the most important key points

### 💡 Concept Explainer
- Enter any concept from any subject
- Choose explanation level: Beginner, Intermediate, or Advanced
- AI provides a definition, real-world example, and 3 key takeaways

### 💬 AI Chat Tutor
- Real-time conversation with an AI study tutor
- Full memory — the AI remembers the entire conversation
- Ask follow-up questions, get examples, request clarification

### 📓 Study Notes
- Save important notes with a title and content
- Color-coded note cards for easy organization
- Delete notes when no longer needed

---

## 🏗️ Architecture — GAME Framework

This project implements the **GAME Framework** for AI agent design:

```
StudyBuddy Agent
│
├── G — GOAL        : Help students learn effectively using AI tools
├── A — ACTION      : 5 tools (Quiz, Summarize, Explain, Chat, Notes)
├── M — MEMORY      : Conversation history preserved in Chat Tutor
└── E — ENVIRONMENT : Groq API (LLaMA 3.3 70B) as the LLM environment
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React.js** | Frontend framework |
| **Groq API** | AI language model (LLaMA 3.3 70B) |
| **Plus Jakarta Sans** | Body font |
| **DM Serif Display** | Heading font |
| **Vercel** | Deployment & hosting |
| **GitHub** | Version control |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm
- A free Groq API key from [console.groq.com](https://console.groq.com)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/studybuddy-ai.git
cd studybuddy-ai
```

**2. Install dependencies**
```bash
npm install
```

**3. Add your Groq API key**

Open `src/App.js` and replace the API key on line 3:
```js
const GROQ_API_KEY = "your-groq-api-key-here";
```

**4. Start the development server**
```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

---

## 🌐 Deployment on Vercel

This app is deployed for free on Vercel.

**Steps to deploy your own:**

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **"New Project"** and select this repository
4. Click **"Deploy"** — done! ✅

Your live URL will look like: `https://studybuddy-ai.vercel.app`

---

## 📁 Project Structure

```
studybuddy-ai/
├── public/
│   └── index.html
├── src/
│   └── App.js          ← Main application (all components in one file)
├── package.json
└── README.md
```

---

## 📸 Screenshots

| Home Page | Quiz Generator | MCQ Quiz |
|---|---|---|
|<img width="1353" height="636" alt="image" src="https://github.com/user-attachments/assets/447bb335-e85a-491f-8a1c-c17c7479c18a" />
 | <img width="591" height="567" alt="image" src="https://github.com/user-attachments/assets/67649d5f-14d6-4e18-b56a-f583f6af4d7c" />
 | <img width="645" height="559" alt="image" src="https://github.com/user-attachments/assets/28cc404d-6dec-4049-8246-70af62eb09d4" />
 |

---

## 🔑 API Configuration

This app uses the **Groq API** which is free to use:

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Create a new API key
4. Paste it into `src/App.js`

**Model used:** `llama-3.3-70b-versatile`

---

## 👨‍💻 Author

Built for **AI Agents Course — Assignment 1**
Demonstrates GAME Framework (Goal, Action, Memory, Environment) in a production-ready React web application.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---
## 📄 Link

https://studybuddy-ai-app-one.vercel.app/

> ⭐ If you found this helpful, give it a star on GitHub!
