# 🎓 منصة آفاق | Afaq Platform

<div dir="rtl">

منصة دراسية تكيفية مدعومة بالذكاء الاصطناعي لطلاب المرحلة الثانوية وخريجي اختبار التحصيلي

</div>

## 📋 About

**Afaq Platform** is an AI-powered adaptive study assistant designed specifically for high school students and Tahsili exam graduates. The platform provides personalized learning experiences with a beautiful, modern design featuring a motivational blue-purple-pink gradient theme.

## ✨ Features

### 🔐 Authentication System
- Login with email/password
- Guest mode access
- Secure signup flow
- Persistent session management

### 📊 Diagnostic Assessment
- Comprehensive academic level testing
- Automatic difficulty adjustment
- Three-tier classification (Beginner, Intermediate, Advanced)
- Personalized recommendations

### ⚙️ Study Preferences
- 4-step preference collection
- Time commitment customization
- Schedule optimization
- Goal-based planning
- Study intensity selection

### 📚 Study Modules
- Interactive slide-based learning
- Slide navigation with progress tracking
- Quick question popups (every 1-2 slides)
- Rich content presentation
- RTL-optimized layout

### 🃏 Flashcards System
- Post-module review cards
- Swipe-to-flip interaction
- Category-based organization
- Spaced repetition ready

### 📝 Quiz System
- Auto-generated quizzes per module
- Multiple choice questions
- Instant feedback
- Score tracking and analytics
- Progress-based unlocking

### 📈 Advanced Analytics
- Study time tracking
- Performance metrics
- Subject-wise progress
- Visual charts and graphs
- Streak tracking

### 🌐 Full RTL Support
- Complete Arabic translation
- Right-to-left layouts
- Proper text direction
- Swapped navigation controls
- Reversed progress bars

### 📱 Responsive Design
- Mobile-first approach
- Tablet optimization
- Desktop layouts
- Touch-friendly controls

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern web browser
- Git (for cloning)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/afaq-platform.git

# Navigate to project directory
cd afaq-platform

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open at `http://localhost:3000`

### Build for Production

```bash
# Create optimized build
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
afaq-platform/
├── src/
│   ├── assets/               # Images, icons, fonts
│   ├── components/
│   │   ├── common/          # Reusable UI components
│   │   └── layout/          # Layout components (Sidebar, etc.)
│   ├── pages/               # Page components
│   │   ├── Landing/
│   │   ├── Auth/            # Login, Signup
│   │   ├── Home/            # Dashboard, Analytics
│   │   ├── Diagnostic/      # Assessment test
│   │   ├── Preferences/     # Study preferences
│   │   ├── Dashboard/       # Plan management
│   │   ├── Study/           # Study modules & flashcards
│   │   ├── Quiz/            # Quiz interface
│   │   ├── Exam/            # Final exam
│   │   ├── Analytics/       # Analytics dashboard
│   │   └── Friends/         # Social features
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useStudyPlan.ts
│   │   └── useLocalStorage.ts
│   ├── services/            # API and storage services
│   │   ├── api.ts
│   │   └── storage.service.ts
│   ├── utils/               # Helper functions
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── helpers.ts
│   ├── styles/              # Global styles
│   │   ├── globals.css
│   │   └── variables.css
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
├── public/                  # Static assets
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎨 Design System

### Color Palette

```css
Primary Colors:
- Blue: #3b82f6
- Purple: #8b5cf6
- Pink: #ec4899

Gradients:
- Primary: linear-gradient(135deg, #3b82f6 → #8b5cf6 → #ec4899)
- Light: linear-gradient(135deg, #eff6ff → #f5f3ff → #fdf2f8)
```

### Typography

- Primary: System fonts with Arabic support
- Arabic: 'Noto Sans Arabic', 'Cairo', 'Tajawal'
- Direction: RTL (Right-to-Left)

## 🛠️ Tech Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: React Hooks + LocalStorage
- **Routing**: Client-side state-based navigation

## 📖 User Flow

```
1. Landing Page
   ↓
2. Login/Signup (or Guest Mode)
   ↓
3. Diagnostic Test
   ↓
4. Study Preferences (4-step form)
   ↓
5. Personalized Study Plan Creation
   ↓
6. Dashboard (view plans)
   ↓
7. Study Module → Quick Questions → Flashcards → Quiz
   ↓
8. Progress Tracking & Analytics
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### Path Aliases

The project uses TypeScript path aliases:

```typescript
@/ → ./src/
@components/ → ./src/components/
@pages/ → ./src/pages/
@hooks/ → ./src/hooks/
@services/ → ./src/services/
@utils/ → ./src/utils/
@styles/ → ./src/styles/
@assets/ → ./src/assets/
```

## 📝 Key Components

### Manually Edited (Preserve These)

- `src/pages/Home/PersonalizedHome.tsx` - Main dashboard
- `src/pages/Home/AnalyticsTab.tsx` - Analytics view
- `src/pages/Study/LessonFlashcards.tsx` - Flashcard system
- `src/pages/Study/StudyModule.tsx` - Study interface with quick questions

### Core Features

- `src/pages/Study/QuickQuestionPopup.tsx` - Popup questions during study
- `src/pages/Preferences/StudyPreferences.tsx` - 4-step preferences form
- `src/pages/Diagnostic/DiagnosticTest.tsx` - Academic assessment
- `src/components/layout/Sidebar.tsx` - Navigation sidebar

## 🧪 Development Guidelines

### Component Organization

1. **Common Components**: Generic, reusable UI (buttons, inputs, cards)
2. **Layout Components**: Structural elements (sidebar, header, footer)
3. **Page Components**: Full pages that compose smaller components

### Coding Standards

- Use functional components with TypeScript
- Follow React hooks best practices
- Keep components small and focused
- Use meaningful variable names
- Comment complex logic
- Maintain RTL compatibility

### Styling Guidelines

- Use Tailwind CSS classes
- Follow mobile-first responsive design
- Maintain consistent spacing
- Use CSS variables for theme colors
- Avoid inline styles unless necessary

## 🌍 Localization

Currently supports:
- **Arabic (ar)**: Primary language with full RTL support
- **English (en)**: Planned for future release

## 🚧 Roadmap

- [ ] Backend API integration
- [ ] User authentication with JWT
- [ ] Database persistence
- [ ] Real-time collaboration
- [ ] Mobile app (React Native)
- [ ] English language support
- [ ] Advanced AI recommendations
- [ ] Gamification features
- [ ] Social learning features

## 🤝 Contributing

This is currently a private project. For collaborators:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

Private and proprietary. For educational purposes only.

## 👥 Authors

Afaq Platform Development Team

## 📞 Support

For issues or questions, please contact the development team.

---

<div dir="rtl">

## 🎯 الميزات الرئيسية

- ✅ دعم كامل للغة العربية والتخطيط من اليمين لليسار
- ✅ نظام المصادقة (تسجيل الدخول/إنشاء حساب/وضع الضيف)
- ✅ اختبار تشخيصي لتحديد المستوى الأكاديمي
- ✅ نموذج تفضيلات الدراسة (4 خطوات)
- ✅ خطط دراسية مخصصة
- ✅ وحدات دراسية تفاعلية مع التنقل بين الشرائح
- ✅ أسئلة سريعة منبثقة أثناء الدراسة
- ✅ نظام البطاقات التعليمية
- ✅ اختبارات تلقائية
- ✅ لوحة تحليلات متقدمة
- ✅ تتبع التقدم
- ✅ تصميم متجاوب (موبايل، تابلت، سطح المكتب)

</div>

**Built with ❤️ for Saudi students**
