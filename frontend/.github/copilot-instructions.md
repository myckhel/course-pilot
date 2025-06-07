# Senior React Developer Copilot Instructions - Mini Jira Frontend

You are an expert in TypeScript, React, React Router, Zustand + persist + immer, Ant Design, Vite, and Tailwind CSS.

## Project Overview

### **APPLICATION OF ARTIFICIAL INTELLIGENCE FOR VIRTUAL TEACHING ASSISTANCE**

This project is a **lightweight AI-powered assistant** designed to enhance the **learning experience of students in higher education**. Users can ask questions in natural language based data trained by a RAG model at the backend, and receive intelligent, context-aware answers directly sourced from the trained data.

- **Language**: TypeScript (strict mode)
- **Framework**: React 19+ (functional components)
- **Routing**: React Router v6
- **State Management**: Zustand + persist + immer
- **UI Library**: Ant Design (Antd)
- **Styling**: Tailwind CSS (mobile-first)
- **Vite**: Build tool for fast development (alias)
- **Authentication**: JWT-based Token

## React Best Practices

### Component Architecture

- Use functional components with TypeScript interfaces for props
- Use the `function` keyword for component definitions
- Implement hooks correctly (`useState`, `useEffect`, `useCallback`, `useMemo`)
- Follow the Rules of Hooks (only call hooks at the top level)
- Create custom hooks to extract reusable component logic
- Use `React.memo()` for component memoization when appropriate
- Implement `useCallback` for memoizing functions passed as props
- Use `useMemo` for expensive computations
- Avoid inline function definitions in render to prevent unnecessary re-renders
- Prefer composition over inheritance
- Use children prop and render props pattern for flexible components
- Implement `React.lazy()` and `Suspense` for code splitting
- Use refs sparingly and mainly for DOM access
- Prefer controlled components over uncontrolled components
- Implement error boundaries to catch and handle errors gracefully
- Use cleanup functions in `useEffect` to prevent memory leaks
- Use short-circuit evaluation and ternary operators for conditional rendering
- put dark and light mode into consideration when designing components to ensure visibility and usability across themes
- create sub components in same file when needed, this will help to keep the code clean and organized

### TypeScript Integration

- Define explicit interfaces for all props and state
- Use proper typing for event handlers
- Implement generic types for reusable components
- Use `as const` for immutable data structures
- Leverage TypeScript's strict mode features

## Routing

- Use React Router for navigation.
- Pages: `/login`, `/register`, `/dashboard`
- Protect routes that require authentication.
- Redirect unauthenticated users to `/login`.

## State Management with Zustand

### Store Organization

- Create separate stores for different domains:
  - `authStore`: User authentication, login state, user profile
  - `chatStore`: Chat CRUD operations, filtering, sorting
  - `uiStore`: Modal states, loading states, notifications
- Use shallow comparison for store selectors to optimize re-renders
- Implement actions as methods within stores
- Use immer for complex state updates when needed
- Use devtools plugin for store

## UI and Styling Guidelines

### Ant Design Usage

- Use Antd components for complex UI elements:
  - `Form` with validation for login/register/task creation
  - `Table` or `List` for task display with sorting and filtering
  - `Modal` for task creation and editing
  - `Button`, `Input`, `Select`, `DatePicker` for form controls
  - `Drawer` or `Sider` for navigation
  - `Card` for task items in list view
  - `Tag` for task status and priority
  - `Notification` for user feedback

### Tailwind CSS Integration

- Use Tailwind for layout, spacing, and responsive design
- Implement mobile-first responsive design
- Use Tailwind utilities for rapid prototyping
- Combine with Antd's design tokens when possible
- Use Tailwind for custom styling that extends Antd components

### Responsive Design

- Mobile-first approach with `sm:`, `md:`, `lg:`, `xl:` breakpoints
- Ensure touch-friendly interfaces on mobile
- Implement responsive navigation (drawer on mobile, sidebar on desktop)
- Use Antd's responsive props where available

## Performance Optimization

### Code Splitting

- Use `React.lazy()` for route-based code splitting
- Wrap components in `Suspense` with appropriate fallbacks
- Implement dynamic imports for heavy components

### Memoization

- Use `React.memo()` for components that receive stable props
- Implement `useCallback` for event handlers passed to child components
- Use `useMemo` for expensive calculations
- Optimize Zustand selectors to prevent unnecessary re-renders

### Bundle Optimization

- Use tree shaking for Antd components (import specific components)
- Implement proper lazy loading for images and non-critical content
- Use Vite or similar for fast development and optimized builds

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components (Button, Modal, etc.)
│   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   └── features/        # Feature-specific components
├── pages/               # Route components
│   ├── auth/           # Login, Register pages
│   ├── student/        # Student dashboard, Q&A interface
│   └── admin/          # Admin panel, topic management
├── stores/             # Zustand stores
│   ├── authStore.ts    # Authentication state
│   ├── topicStore.ts   # Topics management
│   └── chatStore.ts    # Chat sessions and messages
├── hooks/              # Custom React hooks
├── apis/               # API service functions
├── utils/              # Helper functions
├── types/              # TypeScript type definitions
├── constants/          # App constants
└── styles/             # Global styles and Tailwind config
```

## API Integration

### HTTP Client

- Use modular/abstracted axios for API calls
- Implement request/response interceptors for JWT handling
- Create a service layer for API endpoints
- Handle error responses consistently
- Implement proper loading states

### Authentication Flow

- Store JWT tokens securely
- Implement automatic token refresh (low priority)
- Handle 401/403 responses appropriately
- Clear auth state on logout

## Component Patterns

### Form Components

```typescript
interface TopicFormProps {
  topic?: Topic;
  onSubmit: (data: TopicFormData) => Promise<void>;
  onCancel: () => void;
}

function TaskForm({ topic, onSubmit, onCancel }: TopicFormProps) {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(
    async (values: TaskFormData) => {
      setIsLoading(true);
      try {
        await onSubmit(values);
      } finally {
        setIsLoading(false);
      }
    },
    [onSubmit]
  );

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      {/* Form fields */}
    </Form>
  );
}
```

### List Components

- Implement virtualization for large lists
- Use Antd's Table or List components with proper pagination
- Implement filtering and sorting capabilities
- Handle empty states gracefully

## Error Handling

### Error Boundaries

- Implement error boundaries for route-level error catching
- Create fallback UI components for error states
- Log errors appropriately for debugging

### Form Validation

- Use Antd's form validation with custom rules
- Implement client-side validation for better UX
- Display validation errors clearly
- Handle server-side validation errors

### Visual Accessibility

- Maintain proper color contrast ratios
- Implement proper text sizing and spacing with intuitive paddings/margins
- Support reduced motion preferences

## Security Considerations

### Input Validation

- Validate all user inputs on the client side
- Sanitize data before displaying
- Prevent XSS attacks through proper escaping

### Authentication Security

- Implement proper session management
- Handle authentication state securely
- Validate tokens on critical operations

## Development Workflow

## **Routing & Layout**

- Use `react-router-dom` for navigation:
  - `/login`, `/register`
  - `/dashboard` (student)
  - `/topics` (admin)
  - `/chat/:topicId`
  - `/admin` (admin dashboard)
- Implement a main layout with header/sidebar.

## **Topic Management**

- **Student**: List topics (`GET /api/topics`), view topic details.
- **Admin**: Create topic (`POST /api/topics`), upload PDF (`POST /api/topics/{id}/documents`).
- Show topic document status and document count.

## **Document Upload**

- Admin-only UI for uploading PDFs to a topic.
- Use Ant Design’s `Upload` component, POST as `multipart/form-data`.

## **Chat/Q&A Interface**

- List chat sessions for a topic (`GET /api/chat/sessions?topicId=...`).
- Create new chat session (`POST /api/chat/sessions`).
- Chat UI with message history (`GET /api/chat/sessions/{session_id}/messages`).
- Send question (`POST /api/chat/message`), display AI and user messages.

## **Admin Dashboard**

- Fetch dashboard stats (`GET /api/admin/dashboard`).
- Show recent topics, system status, and analytics (as endpoints are implemented).

### Code Quality

- Use ESLint and Prettier for code formatting
- Use TypeScript strict mode
- Follow consistent naming conventions

### Environment Management

- Use environment variables for API endpoints
- Use proper build optimization for production

**References:**

- Asked_API_Collection.postman_collection.json (for endpoint details and payloads)
- README.md (for project structure and setup)

## Copilot assumptions

- Always assume the dev server is running and avoid starting the server

**Generate all code following these principles, ensuring production-ready quality with proper TypeScript typing, error handling, and accessibility features.**
