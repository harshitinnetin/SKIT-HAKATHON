# DocMind AI — Complete Project Documentation
### Concept Note · Lean Canvas · Technical Architecture · Feature Breakdown
> **Version:** 1.0 · **Date:** July 2026 · **Author:** DocMind AI Team

---

## TABLE OF CONTENTS
1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Solution — What is DocMind AI?](#3-solution--what-is-docmind-ai)
4. [Key Features](#4-key-features)
5. [Lean Canvas](#5-lean-canvas)
6. [System Architecture](#6-system-architecture)
7. [Technology Stack](#7-technology-stack)
8. [Data Flow Diagrams](#8-data-flow-diagrams)
9. [Database Schema](#9-database-schema)
10. [API Reference](#10-api-reference)
11. [AI & Machine Learning Pipeline](#11-ai--machine-learning-pipeline)
12. [Security Architecture](#12-security-architecture)
13. [Performance & Scalability](#13-performance--scalability)
14. [Deployment Architecture](#14-deployment-architecture)
15. [User Journey](#15-user-journey)
16. [Competitive Analysis](#16-competitive-analysis)
17. [Business Model](#17-business-model)
18. [Roadmap](#18-roadmap)

---

## 1. Executive Summary

**DocMind AI** is a full-stack AI-powered document intelligence platform that enables users to upload PDF documents and images, extract their content using advanced OCR technology, and interact with that content through a conversational AI interface.

Users can:
- Upload PDF or scanned image documents
- Ask natural language questions about the document
- Get AI-generated summaries, quizzes, and flashcards
- Translate document content
- Compare multiple documents
- Analyze usage through an analytics dashboard

The platform is built for students, researchers, legal professionals, and knowledge workers who need to quickly extract, understand, and interact with large volumes of document content.

---

## 2. Problem Statement

### The Core Problem
Knowledge workers and students spend an **enormous amount of time** reading through documents to find specific information, generate study materials, or extract insights. This is:

- ⏱️ **Time-consuming** — Reading a 50-page PDF takes 2–3 hours
- 🧠 **Cognitively demanding** — Retaining and cross-referencing information is hard
- 🔍 **Inefficient** — Ctrl+F keyword search is primitive; it lacks context
- 📄 **Inaccessible** — Scanned documents (images) are not searchable at all

### Who Suffers?
| User Group | Problem |
|---|---|
| Students | Must re-read entire textbooks for one concept |
| Researchers | Cannot efficiently cross-reference dozens of papers |
| Lawyers | Must manually scan through contracts and case files |
| Business Analysts | Struggle to compare multiple reports quickly |
| Non-English speakers | Cannot interact with documents in foreign languages |

---

## 3. Solution — What is DocMind AI?

DocMind AI is an **intelligent document assistant** that sits between the user and their documents. It uses:

1. **OCR (Optical Character Recognition)** to extract text from any document — even handwritten or scanned PDFs
2. **Vector Embeddings** to semantically understand document content
3. **RAG (Retrieval-Augmented Generation)** to answer questions using only what is actually in the document
4. **Large Language Models (via OpenRouter)** to generate summaries, quizzes, flashcards, and translations

### The DocMind AI Value Proposition

```
WITHOUT DocMind AI:          WITH DocMind AI:
──────────────────           ────────────────
Upload PDF                   Upload PDF
↓                            ↓
Read 50 pages manually  →    Ask: "What are the key findings?"
↓                            ↓
Take manual notes       →    AI answers in 3 seconds with page citations
↓                            ↓
Create study cards      →    Auto-generate 15 flashcards
↓                            ↓
Write summary           →    AI writes executive summary instantly
Time: 3-4 hours              Time: 5 minutes
```

---

## 4. Key Features

### 📤 Document Upload & Processing
- Upload PDFs and image files (PNG, JPG, TIFF)
- Automatic detection of digital vs. scanned documents
- OCR processing via **Tesseract.js** for scanned content
- Background async processing — user gets instant response
- File storage on **AWS S3** (enterprise-grade)
- Processing status tracking (PROCESSING → READY → FAILED)

### 💬 AI Chat (RAG-Powered)
- Conversational interface for each document or across multiple documents
- Uses **Vector Similarity Search** to find the most relevant document sections
- AI answers cite specific sources with page numbers: `[Source 1, Page 3]`
- Chat history maintained across sessions
- Streaming responses (tokens appear in real time like ChatGPT)
- Support for multi-document chat sessions

### 📋 AI Summaries
- **Standard Summary** — Comprehensive overview
- **Executive Summary** — C-suite style brief with key decisions
- **Bullet Points** — Key takeaways in list format
- **Insights** — Hidden patterns and unique findings

### 🧠 Quiz Generation
- Auto-generates MCQ (Multiple Choice Questions) from document content
- Configurable: number of questions (1–20) and difficulty (Easy / Medium / Hard)
- Each question has 4 options + explanation of the correct answer
- Score tracking and review mode

### 🃏 Flashcards
- AI-generated front/back flashcard pairs from document content
- Difficulty labels: Easy, Medium, Hard
- Flip animation UI for study sessions
- Configurable count (up to 30 cards)

### 🌐 Translation
- Translate entire document content into any language
- Streaming output for real-time translation display
- Preserves document structure and formatting

### 🔄 Document Comparison
- Compare 2 documents side-by-side
- AI identifies: Similarities, Differences, Unique Points, Overall Assessment
- Streamed output in markdown format

### 📊 Analytics Dashboard
- Total documents uploaded
- Total chats created
- Total messages exchanged
- Total tokens consumed
- Document status breakdown (Ready / Processing / Failed)
- AI model usage tracking

### 🔐 Authentication
- Email/password registration and login
- JWT-based session management (7-day tokens)
- Guest mode (24-hour temporary sessions) — no signup required
- Admin role with elevated privileges

---

## 5. Lean Canvas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DOCMIND AI — LEAN CANVAS                          │
├─────────────────┬───────────────────┬─────────────────────────────────────-─┤
│   PROBLEM       │  SOLUTION         │      UNIQUE VALUE PROPOSITION          │
│                 │                   │                                         │
│ 1. Reading docs │ RAG-based AI chat │  "Turn any document into a             │
│    is slow &    │ that answers Qs   │   conversation. Ask anything,          │
│    inefficient  │ with citations    │   get answers in seconds."             │
│                 │                   │                                         │
│ 2. Scanned docs │ Tesseract OCR     │  Works on scanned PDFs too.            │
│    not          │ makes any image   │  No registration required.             │
│    searchable   │ searchable        │                                         │
│                 │                   │                                         │
│ 3. No easy way  │ Auto-quiz,        │  UNFAIR ADVANTAGE                      │
│    to create    │ flashcard &       │                                         │
│    study        │ summary           │  Integrated OCR + RAG + LLM            │
│    materials    │ generation        │  in one unified platform with          │
│                 │                   │  guest access (zero friction)          │
├─────────────────┤                   ├────────────────────────────────────────┤
│  ALTERNATIVES   │  KEY METRICS      │      CHANNELS                          │
│                 │                   │                                         │
│ • ChatPDF       │ • Docs uploaded   │  • Direct URL sharing                  │
│ • Adobe Acrobat │ • Chats started   │  • College campus marketing            │
│ • Ctrl+F search │ • Retention rate  │  • Social media demos (TikTok)         │
│ • Manual notes  │ • Guest→User      │  • Word of mouth (students)            │
│ • Notion AI     │   conversion rate │  • ProductHunt launch                  │
│                 │ • AI tokens used  │                                         │
├─────────────────┴───────────────────┼────────────────────────────────────────┤
│         CUSTOMER SEGMENTS           │         COST STRUCTURE                 │
│                                     │                                         │
│  • Students & Exam Preppers         │  • OpenRouter AI API costs             │
│  • Academic Researchers             │  • AWS S3 storage                      │
│  • Legal Professionals              │  • Supabase PostgreSQL hosting         │
│  • Business Analysts                │  • Render backend hosting              │
│  • Non-English speakers             │  • Vercel frontend hosting             │
│  • Content creators                 │  • Development & maintenance           │
│                                     │                                         │
├─────────────────────────────────────┼────────────────────────────────────────┤
│         REVENUE STREAMS             │                                         │
│                                     │                                         │
│  • Freemium (free tier with limits) │                                         │
│  • Pro subscription ($9.99/month)   │                                         │
│  • Enterprise API access            │                                         │
│  • Educational institution licenses │                                         │
└─────────────────────────────────────┴────────────────────────────────────────┘
```

---

## 6. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │           FRONTEND (React + Vite + TailwindCSS)             │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │   │
│  │  │  Login/  │ │Dashboard │ │  Chat    │ │  Library/    │  │   │
│  │  │  Signup  │ │Analytics │ │  Page    │ │  Upload      │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │   │
│  │        │                         │                          │   │
│  │  React Query (cache+fetch)  SSE Streaming                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────┬──────────────────┬────────────────────────┘
                          │ HTTPS REST API   │ Server-Sent Events (SSE)
                          ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  API GATEWAY (Express.js Middleware)                │
│  ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │  Rate      │ │  Request │ │   ETag   │ │   CORS + Helmet    │  │
│  │  Limiter   │ │  Timeout │ │  Cache   │ │   Security         │  │
│  │ 200/15min  │ │   25s    │ │  (gzip)  │ │                    │  │
│  └────────────┘ └──────────┘ └──────────┘ └────────────────────┘  │
│                                                                     │
│  ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │  /auth     │ │/documents│ │  /chat   │ │  /ai               │  │
│  │  Register  │ │  Upload  │ │  RAG     │ │  Summarize/Quiz/   │  │
│  │  Login     │ │  List    │ │  Stream  │ │  Flashcards/       │  │
│  │  Guest     │ │  Delete  │ │  History │ │  Translate/Compare │  │
│  └────────────┘ └──────────┘ └──────────┘ └────────────────────┘  │
└──────────────┬────────────────────┬──────────────────┬──────────────┘
               │                    │                  │
               ▼                    ▼                  ▼
┌─────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│  SUPABASE       │   │   AWS S3            │   │  OPENROUTER AI      │
│  PostgreSQL DB  │   │   File Storage      │   │  API Gateway        │
│                 │   │                     │   │                     │
│  • Users        │   │  • PDF files        │   │  • LLM Chat         │
│  • Documents    │   │  • Image files      │   │  • Embeddings       │
│  • Chunks       │   │  • Secured with     │   │  • Free/Paid models │
│  • Messages     │   │    pre-signed URLs  │   │                     │
│  • Chats        │   │                     │   │                     │
│  • ApiUsage     │   │                     │   │                     │
└─────────────────┘   └─────────────────────┘   └─────────────────────┘
```

### Component Architecture (Frontend)

```
src/
├── main.jsx                    # React entry point
├── App.jsx                     # Router + Auth wrapper
├── index.css                   # Global design system (CSS variables)
│
├── lib/
│   └── api.js                  # Axios client (BASE_URL → Render backend)
│
├── contexts/
│   └── AuthContext.jsx          # Global auth state (JWT + localStorage)
│
├── components/
│   └── ThemeToggle.jsx          # Dark/light mode switcher
│
└── pages/
    ├── auth/
    │   ├── Login.jsx            # Guest mode + email login
    │   └── Signup.jsx           # Registration form
    │
    ├── Dashboard.jsx            # Overview stats + quick actions
    ├── Library.jsx              # Document list + management
    ├── Upload.jsx               # Drag-drop file upload + progress
    ├── Chat.jsx                 # AI chat with SSE streaming
    ├── Summary.jsx              # AI document summarizer
    ├── Quiz.jsx                 # MCQ quiz generator
    ├── Flashcards.jsx           # Flashcard study mode
    ├── Analytics.jsx            # Usage stats and charts
    ├── Profile.jsx              # User profile management
    └── Settings.jsx             # App settings
```

---

## 7. Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2 | UI component framework |
| Vite | 8.x | Build tool + dev server |
| TailwindCSS | 4.x | Utility-first CSS |
| Framer Motion | 12.x | Animations and transitions |
| Tanstack React Query | 5.x | Server state caching |
| Axios | 1.x | HTTP client |
| React Router DOM | 7.x | Client-side routing |
| Lucide React | 1.x | Icon library |
| Recharts | 3.x | Analytics charts |
| React Markdown | 10.x | Render AI markdown responses |
| Sonner | 2.x | Toast notifications |
| Radix UI | Various | Accessible UI primitives |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 22.x | JavaScript runtime |
| Express.js | 4.x | HTTP web framework |
| Prisma ORM | 5.22 | Database client + migrations |
| PostgreSQL | 15.x | Relational database (via Supabase) |
| JWT | 9.x | Authentication tokens |
| bcryptjs | 2.x | Password hashing |
| Multer | 1.x | File upload handling |
| pdf-parse | 1.x | PDF text extraction |
| Tesseract.js | 5.x | OCR (Optical Character Recognition) |
| AWS SDK v3 | 3.x | S3 file storage |
| Helmet | 8.x | HTTP security headers |
| CORS | 2.x | Cross-origin request handling |
| Morgan | 1.x | HTTP request logging |
| Compression | 1.x | gzip response compression |
| express-rate-limit | 7.x | API rate limiting |

### External Services
| Service | Purpose |
|---|---|
| **OpenRouter AI** | Gateway to LLM models (chat, embeddings) |
| **Supabase** | Managed PostgreSQL + Auth (backup) |
| **AWS S3** | Document file storage |
| **Vercel** | Frontend hosting + CDN |
| **Render** | Backend API hosting |

### AI Models Used
| Model | Provider | Usage |
|---|---|---|
| `openai/text-embedding-3-small` | OpenAI via OpenRouter | Document & query embeddings |
| Free/Paid LLM (configurable) | OpenRouter | Chat, summary, quiz, translate |

---

## 8. Data Flow Diagrams

### Document Upload Flow

```
User selects file
       │
       ▼
[Upload.jsx] — FormData POST → [/api/documents/upload]
       │
       ▼
[Multer Middleware] → holds file in memory buffer
       │
       ▼
[AWS S3 Upload] ← buffer → S3 bucket (documents/{userId}/{uuid}.pdf)
       │
       ▼
[Prisma DB] → CREATE document record (status: PROCESSING)
       │
       ▼
[HTTP 201 Response] → frontend shows "Processing started"
       │
       ▼ (async — does NOT block HTTP response)
[processDocument()] runs in background:
       │
       ├── isPDF? → pdf-parse → extract text
       │         → text < 100 chars? → OCR fallback
       │
       ├── isImage? → Tesseract.js OCR → extract text
       │
       ├── chunkText() → split into 500-word chunks (50-word overlap)
       │
       ├── generateEmbedding() → OpenRouter text-embedding-3-small
       │                      → 1536-dimension float vector per chunk
       │
       ├── Prisma → createMany(DocumentChunk) → save all chunks + embeddings
       │
       └── Prisma → UPDATE document (status: READY, pageCount, tokenCount)
```

### RAG Chat Flow

```
User types message → clicks Send
       │
       ▼
[Chat.jsx] — createSSEStream() — POST to /api/chat/:id/message
       │      (Server-Sent Events — streaming)
       ▼
[chatController.js] — streamChat()
       │
       ├── PARALLEL:
       │   ├── getCachedEmbedding(userMessage)
       │   │      → check in-memory 30-min LRU cache
       │   │      → miss? → OpenRouter embeddings API → cache result
       │   │
       │   └── prisma.message.findMany() → fetch last 10 chat messages
       │
       ├── getRelevantChunks():
       │   ├── fetch all DocumentChunks for selected documents
       │   ├── cosineSimilarity(queryEmbedding, chunkEmbedding) for each
       │   ├── sort by similarity score (descending)
       │   └── take top 6 most relevant chunks
       │
       ├── Build prompt:
       │   ├── systemPrompt: "Answer based on document context only..."
       │   │                + document chunks as context
       │   ├── last 8 chat messages (conversation history)
       │   └── new user message
       │
       ├── OpenRouter LLM Stream:
       │   └── for each token → SSE event → frontend renders in real-time
       │
       ├── FIRE-AND-FORGET (non-blocking):
       │   └── prisma.message.create() → save AI response to DB
       │
       └── sendEvent({ done: true, citations, content }) → end stream
```

### Authentication Flow

```
GUEST MODE:
User clicks "Continue as Guest"
       │
       ▼
POST /api/auth/guest
       │
       ▼
Create temporary User (isGuest: true, 24h expiry)
       │
       ▼
Return JWT token (valid 7 days, guest flag embedded)
       │
       ▼
Frontend stores token in localStorage
       │
       ▼
All API requests include: Authorization: Bearer <token>

EMAIL LOGIN:
POST /api/auth/login { email, password }
       │
       ▼
Find user by email → bcrypt.compare(password, hash)
       │
       ▼
Generate JWT { userId, role, isGuest: false }
       │
       ▼
Return { token, user } → frontend stores in localStorage
```

---

## 9. Database Schema

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐         ┌──────────────────┐                     │
│  │   Profile    │         │     Document     │                     │
│  │──────────────│         │──────────────────│                     │
│  │ id (uuid) PK │◄────────│ userId (FK)      │                     │
│  │ email        │   1:N   │ id (uuid) PK     │                     │
│  │ passwordHash │         │ title            │                     │
│  │ fullName     │         │ fileName         │                     │
│  │ role         │         │ filePath (S3 key)│                     │
│  │ isGuest      │         │ fileSize         │                     │
│  │ createdAt    │         │ mimeType         │                     │
│  └──────────────┘         │ status           │                     │
│                           │ (PROCESSING/     │                     │
│                           │  READY/FAILED)   │                     │
│                           │ pageCount        │                     │
│                           │ isScanned        │                     │
│                           │ ocrConfidence    │                     │
│                           │ tokenCount       │                     │
│                           │ createdAt        │                     │
│                           └────────┬─────────┘                     │
│                                    │ 1:N                           │
│                                    ▼                               │
│                           ┌──────────────────┐                     │
│                           │  DocumentChunk   │                     │
│                           │──────────────────│                     │
│                           │ id (uuid) PK     │                     │
│                           │ documentId (FK)  │                     │
│                           │ content (text)   │                     │
│                           │ chunkIndex       │                     │
│                           │ pageNumber       │                     │
│                           │ tokenCount       │                     │
│                           │ embedding (JSON) │◄── 1536-dim vector  │
│                           └──────────────────┘                     │
│                                                                     │
│  ┌──────────────┐         ┌──────────────────┐                     │
│  │   Profile    │         │      Chat        │                     │
│  │──────────────│         │──────────────────│                     │
│  │ id (uuid) PK │◄────────│ userId (FK)      │                     │
│  └──────────────┘   1:N   │ id (uuid) PK     │                     │
│                           │ title            │                     │
│                           │ isPinned         │                     │
│                           │ createdAt        │                     │
│                           └────────┬─────────┘                     │
│                                    │ 1:N                           │
│                                    ▼                               │
│                           ┌──────────────────┐                     │
│                           │    Message       │                     │
│                           │──────────────────│                     │
│                           │ id (uuid) PK     │                     │
│                           │ chatId (FK)      │                     │
│                           │ role             │                     │
│                           │ (USER/ASSISTANT) │                     │
│                           │ content          │                     │
│                           │ citations (JSON) │                     │
│                           │ tokens           │                     │
│                           │ model            │                     │
│                           │ rating           │                     │
│                           │ createdAt        │                     │
│                           └──────────────────┘                     │
│                                                                     │
│  ┌──────────────┐                                                   │
│  │  ApiUsage    │  (tracks AI token consumption per user)           │
│  │──────────────│                                                   │
│  │ id (uuid) PK │                                                   │
│  │ userId       │                                                   │
│  │ model        │                                                   │
│  │ inputTokens  │                                                   │
│  │ outputTokens │                                                   │
│  │ action       │                                                   │
│  │ createdAt    │                                                   │
│  └──────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 10. API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/guest` | Start a 24-hour guest session |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/profile` | Update profile |

### Documents
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/documents` | List user's documents (paginated) |
| POST | `/api/documents/upload` | Upload a PDF or image file |
| GET | `/api/documents/:id` | Get single document details |
| GET | `/api/documents/:id/status` | Poll processing status |
| GET | `/api/documents/:id/file` | Redirect to pre-signed S3 URL |
| DELETE | `/api/documents/:id` | Delete document + S3 file |

### Chat
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/chat` | List all chats |
| POST | `/api/chat/send` | Start new chat (SSE streaming) |
| GET | `/api/chat/:id` | Get chat with all messages |
| POST | `/api/chat/:id/message` | Send message to existing chat (SSE) |
| PUT | `/api/chat/:id` | Rename a chat |
| DELETE | `/api/chat/:id` | Delete a chat |
| POST | `/api/chat/:id/pin` | Pin/unpin a chat |

### AI Features
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/summarize` | Generate AI summary (streaming) |
| POST | `/api/ai/quiz` | Generate MCQ quiz |
| POST | `/api/ai/flashcards` | Generate flashcards |
| POST | `/api/ai/translate` | Translate document (streaming) |
| POST | `/api/ai/compare` | Compare two documents (streaming) |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics` | Get all usage statistics |

---

## 11. AI & Machine Learning Pipeline

### Vector Embedding Explained

```
Document Text (raw):
"The mitochondria is the powerhouse of the cell..."

                    ▼ text-embedding-3-small
                    
Embedding Vector (1536 dimensions):
[0.021, -0.134, 0.567, ..., 0.089]  (1536 float values)

This vector captures the SEMANTIC MEANING of the text.
Similar concepts → similar vectors → low distance = high relevance.
```

### RAG (Retrieval-Augmented Generation) Pipeline

```
Step 1: INGESTION (done once when document is uploaded)
─────────────────────────────────────────────────────
Document → Extract Text → Split into chunks (500 words, 50-word overlap)
         → Embed each chunk → Store embeddings in database

Step 2: RETRIEVAL (done on every user question)
───────────────────────────────────────────────
User Question → Embed question → Compare with ALL stored chunk embeddings
             → Cosine Similarity Score for each chunk
             → Select Top 6 most relevant chunks

Step 3: GENERATION (done on every user question)
─────────────────────────────────────────────────
System Prompt (with top 6 chunks as context)
+ Conversation History (last 8 messages)
+ User Question
→ LLM (via OpenRouter) → Streamed answer with citations
```

### Why Cosine Similarity?

```
Cosine Similarity = (A · B) / (|A| × |B|)

Ranges from -1 to 1:
  1.0 = identical meaning
  0.8 = highly similar
  0.5 = somewhat related
  0.0 = unrelated
 -1.0 = opposite meaning

Example:
  Query: "What causes inflation?"
  Chunk 1: "Inflation is caused by..." → similarity: 0.92 ✅ (selected)
  Chunk 2: "The CEO's salary was..."   → similarity: 0.31 ❌ (skipped)
```

---

## 12. Security Architecture

### Defense Layers

```
LAYER 1: Network Security
  ├── HTTPS enforced (TLS 1.3 on Vercel + Render)
  ├── Helmet.js → security headers (XSS, CSRF, clickjacking protection)
  └── CORS whitelist → only approved origins allowed

LAYER 2: Rate Limiting
  ├── General: 200 requests / 15 minutes / IP
  ├── AI routes: stricter limit (aiLimiter)
  └── Upload: upload-specific limiter

LAYER 3: Authentication
  ├── JWT tokens (HS256, 7-day expiry)
  ├── bcrypt password hashing (10 salt rounds)
  ├── Bearer token on every authenticated request
  └── Automatic 401 → logout + redirect on expired sessions

LAYER 4: Authorization
  ├── All document/chat queries filter by userId
  ├── Admin role for elevated access
  └── Guest users cannot access admin routes

LAYER 5: Data Security
  ├── AWS S3 pre-signed URLs (time-limited, user-specific)
  ├── Files never publicly accessible (private S3 bucket)
  ├── Database credentials in environment variables only
  └── No secrets committed to git

LAYER 6: API Gateway
  ├── 25-second request timeout
  ├── Request body size limit (10MB)
  └── gzip compression (reduces attack surface, improves speed)
```

---

## 13. Performance & Scalability

### Caching Strategy

```
┌────────────────────────────────────────────────────────────┐
│                     CACHE LAYERS                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  L1: Embedding Cache (in-memory, 30-min TTL, 200 entries) │
│      ├── Prevents repeated AI API calls for same queries   │
│      └── LRU eviction when at capacity                    │
│                                                            │
│  L2: TTL Cache (in-memory, per endpoint)                  │
│      ├── chatListCache: 30-second TTL                     │
│      ├── documentListCache: 30-second TTL                 │
│      ├── analyticsCache: 2-minute TTL                     │
│      └── chatDetailCache: 15-second TTL                   │
│                                                            │
│  L3: HTTP ETag Cache (browser-level)                      │
│      ├── GET list endpoints support ETag                  │
│      └── 304 Not Modified → zero data transfer            │
│                                                            │
│  L4: gzip Compression                                     │
│      └── All responses > 1KB compressed before sending   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Database Connection Management

```
Supabase pgBouncer Pool: 5 connections maximum

Problem: 13 concurrent requests on page load would exhaust pool

Solution: Semaphore Pattern
  ┌──────────────────────────────────────┐
  │  Semaphore(max=4)                    │
  │                                      │
  │  Request 1 → acquire slot (1/4) ──→ DB query  │
  │  Request 2 → acquire slot (2/4) ──→ DB query  │
  │  Request 3 → acquire slot (3/4) ──→ DB query  │
  │  Request 4 → acquire slot (4/4) ──→ DB query  │
  │  Request 5 → WAIT in queue...                │
  │                     │                        │
  │  Request 1 finishes → releases slot          │
  │                     │                        │
  │  Request 5 → acquire slot (1/4) ──→ DB query │
  └──────────────────────────────────────┘

Result: Pool never exhausted. No P2024 timeout errors.
```

---

## 14. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  VERCEL (Frontend CDN)          RENDER (Backend Server)         │
│  ┌─────────────────────┐        ┌───────────────────────┐      │
│  │ docmindsai.vercel.  │        │ docmind-ai-no6z.      │      │
│  │ app                 │  API   │ onrender.com           │      │
│  │                     │───────►│                        │      │
│  │ • Global CDN        │        │ • Node.js 22.x         │      │
│  │ • Auto HTTPS        │        │ • Express API          │      │
│  │ • Vite build        │        │ • Prisma ORM           │      │
│  │ • SPA routing       │        │ • Auto-deploy on push  │      │
│  │   (vercel.json)     │        │                        │      │
│  └─────────────────────┘        └──────────┬────────────┘      │
│                                            │                    │
│                          ┌─────────────────┼──────────────────┐ │
│                          │                 │                  │ │
│                          ▼                 ▼                  ▼ │
│                   ┌──────────┐    ┌──────────────┐    ┌──────┐ │
│                   │SUPABASE  │    │  AWS S3      │    │OPEN  │ │
│                   │PostgreSQL│    │  us-east-1   │    │ROUTER│ │
│                   │          │    │              │    │  AI  │ │
│                   │pgBouncer │    │Private Bucket│    │      │ │
│                   │pool=5    │    │Pre-signed    │    │      │ │
│                   └──────────┘    │URLs          │    └──────┘ │
│                                  └──────────────┘             │
└─────────────────────────────────────────────────────────────────┘

Git Repository → push → GitHub
                         │
                         ├── Vercel detects change → auto build + deploy
                         └── Render detects change → auto build + deploy
```

### Environment Variables Required

**Backend (Render):**
```
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://...supabase.com.../postgres?pgbouncer=true
DIRECT_URL=postgresql://...supabase.com:5432/postgres
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENROUTER_API_KEY=sk-or-v1-...
JWT_SECRET=your-secret-key
FRONTEND_URL=https://docmindsai.vercel.app
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket-name
```

**Frontend (Vercel):**
```
VITE_API_URL=https://docmind-ai-no6z.onrender.com/api
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

---

## 15. User Journey

### First-Time User (Guest)

```
1. Lands on https://docmindsai.vercel.app
2. Sees Login screen with "Continue as Guest" button
3. Clicks Guest → gets 24-hour JWT token instantly (no signup)
4. Redirected to Dashboard → sees 0 docs, 0 chats
5. Goes to Upload → drags a PDF file
6. File uploads to S3 in seconds
7. Background OCR/parsing begins
8. User goes to Chat → selects the document
9. Asks: "What is this document about?"
10. AI streams the answer in real-time with citations
11. User generates a quiz → gets 10 MCQs
12. User decides to create an account → data preserved
```

### Returning User (Registered)

```
1. Goes to /login → enters email + password
2. Lands on Dashboard → sees all their previous documents + stats
3. Opens a previous chat → sees full conversation history
4. Uploads a new document → processes in background while they chat
5. Uses /summary to get an executive brief
6. Exports insights manually or takes screenshots for presentations
```

---

## 16. Competitive Analysis

| Feature | DocMind AI | ChatPDF | Adobe Acrobat AI | Notion AI |
|---|---|---|---|---|
| PDF Upload | ✅ | ✅ | ✅ | ✅ |
| Scanned PDF (OCR) | ✅ | ❌ | ✅ | ❌ |
| AI Chat with citations | ✅ | ✅ | ✅ | ✅ |
| Quiz generation | ✅ | ❌ | ❌ | ❌ |
| Flashcard generation | ✅ | ❌ | ❌ | ❌ |
| Document comparison | ✅ | ❌ | ❌ | ❌ |
| Translation | ✅ | ❌ | ❌ | ❌ |
| Multiple summaries | ✅ | Basic | ✅ | Basic |
| Guest mode (no signup) | ✅ | ❌ | ❌ | ❌ |
| Analytics dashboard | ✅ | ❌ | ❌ | ❌ |
| Self-hosted possible | ✅ | ❌ | ❌ | ❌ |
| Open source | ✅ | ❌ | ❌ | ❌ |
| Free tier | ✅ | Limited | ❌ | Limited |

---

## 17. Business Model

### Freemium Tiers

| Feature | Guest (Free) | Basic (Free) | Pro ($9.99/mo) | Enterprise |
|---|---|---|---|---|
| Documents | 3 | 10 | Unlimited | Unlimited |
| Chats | 5 | 20 | Unlimited | Unlimited |
| AI Messages | 20 | 50 | 1,000 | Unlimited |
| OCR | ✅ | ✅ | ✅ | ✅ |
| Quiz/Flashcards | ✅ | ✅ | ✅ | ✅ |
| Translation | ❌ | ❌ | ✅ | ✅ |
| Comparison | ❌ | ❌ | ✅ | ✅ |
| File size limit | 10MB | 25MB | 100MB | Unlimited |
| Storage | 24h only | 1GB | 10GB | Custom |
| Priority support | ❌ | ❌ | ✅ | ✅ |

### Revenue Projections (Year 1)

```
1,000 active users × 5% Pro conversion = 50 Pro users
50 Pro × $9.99/month = $499/month = ~$6,000/year (Year 1 Conservative)

10,000 active users × 5% Pro conversion = 500 Pro users
500 Pro × $9.99/month = $4,995/month = ~$60,000/year (Year 2 Target)
```

---

## 18. Roadmap

### ✅ Phase 1 — MVP (Completed)
- [x] User authentication (email + guest)
- [x] PDF upload to AWS S3
- [x] OCR for scanned documents
- [x] Vector embeddings + RAG chat
- [x] AI summaries (4 types)
- [x] Quiz generation
- [x] Flashcard generation
- [x] Document translation
- [x] Document comparison
- [x] Analytics dashboard
- [x] Admin panel
- [x] Production deployment (Vercel + Render)

### 🔄 Phase 2 — Enhancement (Next 3 months)
- [ ] Google OAuth login
- [ ] Folder/collection organization for documents
- [ ] Multi-language UI (Hindi, Spanish, etc.)
- [ ] PDF annotation and highlighting
- [ ] Export quiz to PDF
- [ ] Share chat conversations (public link)
- [ ] Mobile app (React Native)

### 🚀 Phase 3 — Scale (6–12 months)
- [ ] Real-time collaborative document sessions
- [ ] API access for developers
- [ ] Webhook integrations (Slack, Notion, Google Drive)
- [ ] Advanced analytics with trend charts
- [ ] Subscription billing (Stripe integration)
- [ ] White-label enterprise solution
- [ ] Custom AI model fine-tuning per organization

---

## Appendix A: Glossary

| Term | Definition |
|---|---|
| **RAG** | Retrieval-Augmented Generation — AI answers questions using retrieved document context |
| **OCR** | Optical Character Recognition — converts images/scanned text to machine-readable text |
| **Embedding** | A numerical vector representing the semantic meaning of text |
| **Cosine Similarity** | A mathematical measure of similarity between two vectors (0–1 scale) |
| **Chunk** | A fixed-size slice of document text (500 words) used for embedding and retrieval |
| **SSE** | Server-Sent Events — a protocol for real-time streaming from server to browser |
| **JWT** | JSON Web Token — a compact, self-contained token for authentication |
| **pgBouncer** | PostgreSQL connection pooler used by Supabase |
| **Semaphore** | A concurrency primitive that limits parallel access to a shared resource |
| **S3** | Amazon Simple Storage Service — cloud object storage |
| **LLM** | Large Language Model — AI model trained on text data (e.g. GPT-4) |

---

## Appendix B: Project File Structure

```
DocMind AI/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── cache.js          # In-memory TTL cache
│   │   │   ├── openrouter.js     # OpenRouter AI client
│   │   │   ├── prisma.js         # Prisma client + semaphore + retry
│   │   │   ├── s3.js             # AWS S3 upload/delete/presign
│   │   │   └── supabase.js       # Supabase client
│   │   ├── controllers/
│   │   │   ├── chatController.js  # RAG streaming logic
│   │   │   └── documentController.js # OCR + embedding pipeline
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT verification
│   │   │   ├── gateway.js        # Timeout, ETag, response timer
│   │   │   ├── rateLimit.js      # Express rate limiters
│   │   │   └── upload.js         # Multer file upload config
│   │   ├── routes/
│   │   │   ├── admin.js          # Admin-only endpoints
│   │   │   ├── ai.js             # Summary/Quiz/Flashcard/Translate/Compare
│   │   │   ├── analytics.js      # Usage statistics
│   │   │   ├── auth.js           # Register/Login/Guest
│   │   │   ├── chat.js           # Chat CRUD + SSE message
│   │   │   └── documents.js      # Document CRUD + upload
│   │   └── index.js              # Express app setup + CORS + routes
│   ├── prisma/
│   │   └── schema.prisma         # Database schema definition
│   ├── .env                      # Local environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── lib/api.js            # Axios client (BASE_URL from env)
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx   # Global auth state
│   │   ├── components/
│   │   │   └── ThemeToggle.jsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx     # Mobile-first auth with curved header
│   │   │   │   └── Signup.jsx    # Registration screen
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Library.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── Chat.jsx          # SSE streaming chat UI
│   │   │   ├── Summary.jsx
│   │   │   ├── Quiz.jsx
│   │   │   ├── Flashcards.jsx
│   │   │   └── Analytics.jsx
│   │   ├── index.css             # Design system + CSS variables
│   │   ├── App.jsx               # Router
│   │   └── main.jsx
│   ├── .env                      # Local: VITE_API_URL=localhost:5000/api
│   ├── .env.production           # Prod: VITE_API_URL=render backend URL
│   ├── vercel.json               # SPA routing config
│   └── package.json
│
└── PROJECT_DOCUMENTATION.md      # This file
```

---

*DocMind AI — Turning Documents into Conversations.*
*Built by ❤️ Developer*
