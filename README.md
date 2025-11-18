# 🎯 SupportHub - AI-Powered Customer Support Platform

> A modern, full-stack customer support SaaS platform with AI-powered chat, ticket management, and knowledge base.

[![Demo](https://img.shields.io/badge/Demo-Live-success)](YOUR_VERCEL_DEMO_LINK)
[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Supabase-blue)]()
[![License](https://img.shields.io/badge/License-MIT-green)]()

---

## ✨ Features

### 🤖 AI-Powered Chat

- **Smart Assistant**: OpenAI GPT-3.5-turbo integration via secure Edge Functions
- **Rate Limiting**: 20 requests/hour per user to prevent abuse
- **Cost Control**: Monthly quota of 1M tokens (~$2/month)
- **Usage Tracking**: Real-time monitoring of AI usage and costs
- **Secure**: API keys never exposed to client-side

### 🎫 Ticket Management

- Create, view, and manage customer support tickets
- Filter by status, priority, and category
- Assign tickets to team members
- Track ticket history and updates

### 📚 Knowledge Base

- Create and organize help articles
- Rich text editor with markdown support
- Public and private article visibility
- Search functionality
- Category-based organization

### 🎨 Modern UI/UX

- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Mobile-first approach, works on all devices
- **Beautiful Gradients**: Modern purple/indigo color scheme
- **Smooth Animations**: Polished user experience

### 🔐 Authentication & Security

- Secure authentication via Supabase Auth
- Row Level Security (RLS) policies
- Protected routes and API endpoints
- JWT-based session management

### ⚙️ Settings & Customization

- **Profile Management**: Update name, email, avatar, password
- **Workspace Settings**: Company name, logo, timezone
- **Chat Widget Customization**:
  - Color picker for branding
  - Custom welcome message
  - Position control (left/right)
  - Embed code generator

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fast HMR and optimized builds)
- **Styling**: Tailwind CSS with custom gradients
- **Routing**: React Router DOM v6
- **Icons**: Lucide React
- **State Management**: React Context API

### Backend

- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **Edge Functions**: Deno-based serverless functions
- **AI Integration**: OpenAI GPT-3.5-turbo

### Infrastructure

- **Hosting**: Vercel (frontend)
- **Database Hosting**: Supabase Cloud
- **Edge Functions**: Supabase Edge Functions (Deno)

---

## 📸 Screenshots

> Screenshots will be added here after deployment

### Dashboard

![Dashboard](./screenshots/dashboard.png)

### Ticket Management

![Tickets](./screenshots/tickets.png)

### AI Chat Widget

![Chat](./screenshots/chat.png)

### Knowledge Base

![Knowledge Base](./screenshots/knowledge-base.png)

### Settings

![Settings](./screenshots/settings.png)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account ([sign up free](https://supabase.com))
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/customer-support-saas.git
   cd customer-support-saas
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your credentials:

   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Set up Supabase database**

   Run the migrations in order:

   ```bash
   # In Supabase SQL Editor, run these files:
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_chat_conversations.sql
   supabase/migrations/003_fix_rls_policies.sql
   supabase/migrations/004_knowledge_base.sql
   supabase/migrations/005_fix_kb_rls.sql
   supabase/migrations/006_ai_usage_tracking.sql
   ```

5. **Deploy Edge Function (for AI chat)**

   Follow the detailed guide in `EDGE_FUNCTION_DEPLOY.md`

6. **Start development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173)

---

## 📦 Project Structure

```
customer-support-saas/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── chat/            # Chat widget components
│   │   ├── dashboard/       # Dashboard charts
│   │   ├── tickets/         # Ticket components
│   │   ├── knowledge-base/  # KB components
│   │   ├── DashboardLayout.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Tickets.tsx
│   │   ├── Chat.tsx
│   │   ├── KnowledgeBase.tsx
│   │   ├── Settings.tsx
│   │   └── Login.tsx
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilities
│   │   ├── supabase.ts
│   │   ├── openai.ts
│   │   └── aiEdgeFunction.ts
│   ├── types/               # TypeScript types
│   └── App.tsx
├── supabase/
│   ├── functions/           # Edge Functions
│   │   └── ai-chat/         # AI chat function
│   └── migrations/          # Database migrations
├── public/                  # Static assets
└── package.json

```

---

## 🔧 Configuration

### Build Scripts

```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview"
}
```

### Environment Variables

See `.env.example` for required variables.

**Important**: OpenAI API key is stored as a Supabase Edge Function secret, NOT in `.env`.

---

## 📝 Documentation

- **[Edge Function Setup](./EDGE_FUNCTION_DEPLOY.md)** - Deploy AI chat function
- **[Database Migration Guide](./supabase/MIGRATION_GUIDE.md)** - Database setup
- **[Authentication Guide](./SUPABASE_AUTH_GUIDE.md)** - Auth configuration
- **[Chat Widget Setup](./CHAT_WIDGET_SETUP.md)** - Implement chat widget
- **[Dashboard Guide](./DASHBOARD_IMPLEMENTATION_GUIDE.md)** - Dashboard setup

---

## 🌐 Deployment

### Vercel Deployment

1. Push to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy!

Vercel will automatically:

- Detect Vite configuration
- Run build command
- Deploy to CDN

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

## 👨‍💻 Author

**Your Name**

- Portfolio: [YOUR_PORTFOLIO_LINK]
- GitHub: [@YOUR_USERNAME](https://github.com/YOUR_USERNAME)
- LinkedIn: [YOUR_LINKEDIN](https://linkedin.com/in/YOUR_PROFILE)

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [OpenAI](https://openai.com) - AI capabilities
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Lucide](https://lucide.dev) - Icons

---

**⭐ If you find this project helpful, please give it a star!**
