# Customer Support SaaS Platform

A modern customer support platform built with React, TypeScript, Tailwind CSS, and Supabase.

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend/Database**: Supabase
- **Routing**: React Router DOM
- **Icons**: Lucide React

## Project Structure

```
customer-support-saas/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── lib/            # Utility functions and configurations
│   │   └── supabase.ts # Supabase client configuration
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript type definitions
│   ├── App.tsx         # Main application component
│   ├── main.tsx        # Application entry point
│   └── index.css       # Global styles with Tailwind directives
├── .env.example        # Environment variables template
└── package.json        # Project dependencies
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd customer-support-saas
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and add your Supabase credentials:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Create a production build:
```bash
npm run build
```

### Preview Production Build

Preview the production build locally:
```bash
npm run preview
```

## Available Dependencies

- `@supabase/supabase-js` - Supabase client for database operations
- `react-router-dom` - Client-side routing
- `lucide-react` - Beautiful icon library
- `tailwindcss` - Utility-first CSS framework

## Next Steps

1. Set up your Supabase database schema
2. Create authentication pages (login, signup)
3. Build ticket management system
4. Implement real-time messaging
5. Add user dashboard and analytics

## License

MIT
