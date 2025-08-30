# StudyBuddy V1 - Comprehensive Curriculum Tracking System

🎓 A modern, feature-rich curriculum tracking application built with React, TypeScript, and Supabase.

## 🌟 Features

### 📚 Learning Objectives Management
- Interactive checklist for tracking learning goals
- Real-time progress visualization with completion percentages
- Add, edit, and delete objectives with ease
- Topic and subtopic-specific objective tracking

### 📎 Resource Attachments System
- File upload capabilities for documents and materials
- Link management for external resources
- Categorized display (files vs. links)
- Organized resource library per topic

### 🎯 Syllabus Milestone Tracking
- Deadline tracking with smart status indicators
- Visual progress representation
- Overdue alerts and milestone statistics
- Due soon notifications

### 📊 Comprehensive Dashboard
- Unified curriculum progress overview
- Tabbed interface for easy navigation
- Real-time statistics and metrics
- Subject-specific detailed views

### 🔐 User Management
- Secure authentication with Supabase Auth
- User profiles with customizable information
- Role-based access control

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: React Hooks
- **Routing**: React Router
- **Build Tool**: Vite
- **Package Manager**: npm

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/UFS-Coder/StudyBuddy-V1.git
   cd StudyBuddy-V1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project on [Supabase](https://supabase.com)
   - Update the Supabase configuration in `src/integrations/supabase/client.ts`
   - Run the database migrations:
     ```bash
     npx supabase link --project-ref YOUR_PROJECT_REF
     npx supabase db push
     ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3010`

## 📁 Project Structure

```
src/
├── components/
│   ├── curriculum/          # Curriculum tracking components
│   │   ├── curriculum-dashboard.tsx
│   │   ├── learning-objectives.tsx
│   │   ├── resource-attachments.tsx
│   │   └── syllabus-milestones.tsx
│   ├── dashboard/           # Dashboard components
│   ├── profile/             # User profile components
│   ├── subjects/            # Subject management components
│   └── ui/                  # Reusable UI components
├── hooks/                   # Custom React hooks
├── integrations/
│   └── supabase/           # Supabase configuration and types
├── lib/                    # Utility functions
├── pages/                  # Page components
supabase/
├── migrations/             # Database migrations
└── config.toml            # Supabase configuration
```

## 🗄️ Database Schema

The application uses the following main tables:

- **learning_objectives**: Track learning goals with completion status
- **resource_attachments**: Manage files and links for topics
- **syllabus_milestones**: Track important deadlines and progress
- **syllabus_topics**: Main curriculum topics
- **subtopics**: Detailed subtopics under main topics
- **profiles**: User profile information

## 🎨 UI Components

Built with modern, accessible components:

- Responsive design for all screen sizes
- Dark/light mode support
- Accessible form controls
- Interactive progress indicators
- Modern card-based layouts

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Conventional commits for git history

## 🚀 Deployment

The application can be deployed to various platforms:

- **Vercel**: Connect your GitHub repository for automatic deployments
- **Netlify**: Deploy with continuous integration
- **Supabase**: Use Supabase hosting for full-stack deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the backend infrastructure
- [Radix UI](https://radix-ui.com) for accessible UI components
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Lucide React](https://lucide.dev) for beautiful icons

## 📞 Support

If you have any questions or need help, please:

1. Check the [Issues](https://github.com/UFS-Coder/StudyBuddy-V1/issues) page
2. Create a new issue if your question isn't answered
3. Contact the development team

---

**Built with ❤️ for better education management**
