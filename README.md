# Budget Planner

A React TypeScript application with tRPC, Supabase authentication, session management, and protected routes. Built with Ant Design for a beautiful and professional UI.

## Features

- React 18 with TypeScript
- **Ant Design** - Professional UI component library
- tRPC for type-safe API calls
- Supabase for authentication
- React Router for routing
- Protected routes
- Beautiful login and signup pages with form validation
- Session management
- Responsive design

## Prerequisites

Before running this application, you need to:

1. Create a Supabase project at https://supabase.com
2. Get your Supabase URL and anon key from the project settings

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

3. Update the `.env` file with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Running the Application

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable components
│   └── ProtectedRoute.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── lib/               # Libraries and configurations
│   ├── supabase.ts
│   ├── trpc.ts
│   └── trpc-client.ts
├── pages/             # Page components
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   └── Signup.tsx
├── server/            # tRPC server setup
│   ├── trpc.ts
│   └── routers/
│       ├── _app.ts
│       └── auth.ts
├── App.tsx
├── main.tsx
└── index.css
```

## Authentication Flow

1. Users can sign up with email and password
2. After signup, users are automatically logged in
3. Session is managed by Supabase
4. Protected routes redirect to login if not authenticated
5. Users can sign out from the dashboard

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Technologies Used

- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Ant Design** - Enterprise-class UI design system and React component library
- **tRPC** - End-to-end typesafe APIs
- **Supabase** - Backend as a Service (Authentication)
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Zod** - Schema validation

## UI Components

The application uses Ant Design components throughout:

- **Forms** - Login and signup forms with built-in validation
- **Cards** - Content containers with elegant styling
- **Buttons** - Primary, danger, and loading states
- **Inputs** - Email and password fields with icons
- **Typography** - Consistent text styling
- **Layout** - Header, Content structure
- **Spin** - Loading indicators
- **Alert** - Error and success messages
- **Descriptions** - Key-value pairs for user information
- **Icons** - Beautiful icon set from @ant-design/icons
