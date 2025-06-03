# 📝 Frontend Implementation Plan: GSTutor AI Assistant

This plan details a production-ready React + TypeScript frontend for the GSTutor AI Q&A assistant, based on the provided user journey, UI outline, and backend API docs.

## 1. **Project Structure**

```
src/
├── apis/           # API service modules (axios)
├── components/
│   ├── common/     # Buttons, Modal, Upload, etc.
│   ├── layout/     # Header, Sidebar, Footer, ThemeToggle
│   └── features/   # Chat, Topic, Session, Feedback, etc.
├── constants/      # App constants (routes, themes)
├── hooks/          # Custom React hooks
├── pages/
│   ├── auth/       # Login, Register, Onboarding
│   ├── student/    # Dashboard, Chat
│   └── admin/      # Admin dashboard, Topic management
├── stores/         # Zustand stores (auth, chat, topic, ui)
├── styles/         # Tailwind config, global styles
├── types/          # TypeScript types/interfaces
├── utils/          # Helper functions
└── main.tsx, App.tsx, router.tsx
```

## 2. **Routing & Navigation**

- **React Router v6** with code splitting (`React.lazy`)
- **Routes:**
  - `/` → Landing page (with login form)
  - `/onboarding` → Onboarding screen (first visit)
  - `/login`, `/register`
  - `/dashboard` → Student dashboard (topic selection)
  - `/chat/:topicId/:sessionId?` → Chat interface
  - `/admin` → Admin dashboard
  - `/admin/topics` → Topic management (create, upload PDF)
  - `/admin/topics/:topicId` → Topic details & document upload

- **Protected routes** for authenticated users/admins
- **Redirect unauthenticated users** to `/login`

## 3. **Authentication Flow**

- **JWT-based** login/register (student & admin)
- Store token in Zustand + localStorage (persist)
- On login/register, fetch user profile (`/api/auth/me`)
- Logout clears token and user state
- Axios interceptors for token injection and 401 handling

## 4. **Landing & Onboarding**

- **Landing Page:** Split layout (logo, tagline, features, login form)
- **Onboarding:** Full-screen card with app intro, "Get Started" button
- **First-time visit** detection via localStorage flag

## 5. **Student Experience**

### a. **Dashboard**

- List available topics (`GET /api/topics`)
- Topic cards: name, description, document status/count
- Select topic → start new chat session or continue previous

### b. **Chat Interface**

- **Layout:**
  - **Left Sidebar:** "+ New Session", session list, logout, user info
  - **Main Area:** Chat messages, prompt input, PDF upload, send button
  - **Right Sidebar:** Accessibility (font size), theme toggle, feedback

- **Features:**
  - **Chat sessions:** List, create (`POST /api/chat/sessions`), load messages (`GET /api/chat/sessions/:id/messages`)
  - **Send question:** (`POST /api/chat/message`)
  - **PDF upload:** (admin-only)
  - **AI responses:** Message bubbles, feedback (👍👎, copy)
  - **Typing indicator:** "AI is thinking..."
  - **Session naming:** Auto-title or custom
  - **Persistent history:** Per user/session

## 6. **Admin Experience**

### a. **Admin Dashboard**

- Stats: total topics, docs, indexed topics, system status (`GET /api/admin/dashboard`)
- Recent topics, system health, analytics (as available)

### b. **Topic Management**

- **List topics:** (`GET /api/topics`)
- **Create topic:** (`POST /api/topics`)
- **Upload PDF:** (`POST /api/topics/:id/documents`, Antd Upload, 10MB limit)
- **Show document status/count** per topic

## 7. **API Integration**

- **Axios instance** with base URL, interceptors for JWT
- **Service modules:** `authApi`, `topicApi`, `chatApi`, `adminApi`
- **Error handling:** Show Antd notifications/messages
- **Loading states:** Per request, global spinner for major actions

## 8. **State Management (Zustand + persist + immer)**

- **authStore:** user, token, login/logout, profile
- **topicStore:** topics, selected topic, CRUD actions
- **chatStore:** sessions, messages, current session, send/receive
- **uiStore:** modals, loading, notifications, theme, onboarding

## 9. **UI & Styling**

- **Ant Design** for forms, tables, modals, upload, notifications
- **Tailwind CSS** for layout, spacing, responsive design
- **Dark mode:** Theme toggle, persisted in uiStore
- **Accessibility:** Font size toggle, high-contrast, keyboard nav

## 10. **Component Patterns**

- **Forms:** Antd Form with validation (login, register, topic, upload)
- **Lists:** Antd Table/List for topics, sessions
- **Chat:** Virtualized message list, input with upload, send, feedback
- **Feedback:** Thumbs up/down, copy, feedback modal (future)
- **Error boundaries:** For route-level error catching

## 11. **Testing & Quality**

- **TypeScript strict mode**
- **ESLint + Prettier**
- **Unit tests** for stores, hooks, and critical components (Jest + React Testing Library)
- **Manual QA:** All flows (auth, chat, admin, upload, error states)

## 12. **Environment & Config**

- **.env** for API base URL
- **Vite** for fast dev/build
- **Alias** for imports (`@/components`, etc.)

## 13. **Accessibility & Responsiveness**

- **Mobile-first** layouts, responsive sidebars/drawers
- **Keyboard navigation** for all interactive elements
- **Proper ARIA roles/labels** for forms, buttons, chat

## 14. **Deployment**

- **Vite build** for production
- **Static hosting** (Vercel, Netlify, etc.)

<!-- ## 15. **Future Enhancements**

- **Realtime updates** (WebSocket for AI typing, new messages)
- **Admin analytics** (as backend supports)
- **Session deletion/renaming**
- **User profile editing**
- **Feedback aggregation** -->

## 16. **Implementation Milestones**

1. **Project scaffolding** (Vite, Tailwind, Antd, Zustand)
2. **Auth flow** (login/register, JWT, protected routes)
3. **Landing/onboarding UI**
4. **Student dashboard & chat**
5. **Admin dashboard & topic management**
6. **PDF upload & document status**
7. **Chat session/history**
8. **Accessibility & dark mode**
9. **Testing & QA**
10. **Polish, docs, deploy**

**References:**  
- Project Outline  
- API Docs

**Ready to start? Scaffold the project and begin with authentication and routing.**