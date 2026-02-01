# Afaq Platform - Project Restructuring Guide

## 📁 New Project Structure

```
afaq-platform/
├── public/
│   └── index.html
├── src/
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   ├── components/
│   │   ├── common/           # Reusable UI components
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Card/
│   │   │   ├── Modal/
│   │   │   ├── tabs.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── badge.tsx
│   │   │   └── ... (all UI components from /components/ui/)
│   │   │
│   │   └── layout/           # Layout components
│   │       ├── Sidebar/
│   │       │   ├── Sidebar.tsx
│   │       │   └── Sidebar.css
│   │       ├── Header/
│   │       └── Footer/
│   │
│   ├── pages/
│   │   ├── Landing/
│   │   │   ├── LandingPage.tsx
│   │   │   └── LandingPage.css
│   │   ├── Auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── LoginPage.css
│   │   │   ├── SignupPage.tsx
│   │   │   └── SignupPage.css
│   │   ├── Home/
│   │   │   ├── PersonalizedHome.tsx  [MANUALLY EDITED - PRESERVE]
│   │   │   ├── HomeTab.tsx
│   │   │   ├── AnalyticsTab.tsx     [MANUALLY EDITED - PRESERVE]
│   │   │   ├── FlashcardsSection.tsx
│   │   │   ├── LessonsModule.tsx
│   │   │   └── LessonQuiz.tsx
│   │   ├── Diagnostic/
│   │   │   ├── DiagnosticTest.tsx
│   │   │   └── DiagnosticTest.css
│   │   ├── Preferences/
│   │   │   ├── StudyPreferences.tsx
│   │   │   └── StudyPreferences.css
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── PlanDashboard.tsx
│   │   │   └── Dashboard.css
│   │   ├── Study/
│   │   │   ├── StudyModule.tsx      [MANUALLY EDITED - PRESERVE]
│   │   │   ├── LessonFlashcards.tsx [MANUALLY EDITED - PRESERVE]
│   │   │   ├── QuickQuestionPopup.tsx
│   │   │   └── Study.css
│   │   ├── Quiz/
│   │   │   ├── QuizInterface.tsx
│   │   │   └── Quiz.css
│   │   ├── Exam/
│   │   │   ├── FinalExam.tsx
│   │   │   └── Exam.css
│   │   ├── Analytics/
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   └── Analytics.css
│   │   └── Friends/
│   │       ├── Friends.tsx
│   │       └── Friends.css
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useStudyPlan.ts
│   │   └── useLocalStorage.ts
│   │
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   └── storage.service.ts
│   │
│   ├── utils/
│   │   ├── helpers.ts
│   │   ├── constants.ts
│   │   └── types.ts
│   │
│   ├── styles/
│   │   ├── variables.css
│   │   └── globals.css
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🔄 Migration Map

### Current → New Structure

#### Components
- `/components/ui/*` → `/src/components/common/*`
- `/components/layout/Sidebar.tsx` → `/src/components/layout/Sidebar/Sidebar.tsx`

#### Pages
- `/components/LandingPage.tsx` → `/src/pages/Landing/LandingPage.tsx`
- `/components/auth/LoginPage.tsx` → `/src/pages/Auth/LoginPage.tsx`
- `/components/auth/SignupPage.tsx` → `/src/pages/Auth/SignupPage.tsx`
- `/components/diagnostic/DiagnosticTest.tsx` → `/src/pages/Diagnostic/DiagnosticTest.tsx`
- `/components/preferences/StudyPreferences.tsx` → `/src/pages/Preferences/StudyPreferences.tsx`
- `/components/PersonalizedHome.tsx` → `/src/pages/Home/PersonalizedHome.tsx` ⚠️ PRESERVE MANUAL EDITS
- `/components/home/*` → `/src/pages/Home/*`
- `/components/Friends.tsx` → `/src/pages/Friends/Friends.tsx`
- `/components/dashboard/*` → `/src/pages/Dashboard/*`
- `/components/study/StudyModule.tsx` → `/src/pages/Study/StudyModule.tsx` ⚠️ PRESERVE MANUAL EDITS
- `/components/study/LessonFlashcards.tsx` → `/src/pages/Study/LessonFlashcards.tsx` ⚠️ PRESERVE MANUAL EDITS
- `/components/study/QuickQuestionPopup.tsx` → `/src/pages/Study/QuickQuestionPopup.tsx`
- `/components/quiz/QuizInterface.tsx` → `/src/pages/Quiz/QuizInterface.tsx`
- `/components/exam/FinalExam.tsx` → `/src/pages/Exam/FinalExam.tsx`
- `/components/analytics/AnalyticsDashboard.tsx` → `/src/pages/Analytics/AnalyticsDashboard.tsx`

#### Styles
- `/styles/globals.css` → `/src/styles/globals.css`

#### Root
- `/App.tsx` → `/src/App.tsx`

## 🎯 Key Principles

### 1. Component Organization
- **Common Components**: Generic, reusable UI elements (buttons, inputs, modals, cards)
- **Layout Components**: Structural components (sidebar, navbar, footer)
- **Page Components**: Full page views that compose smaller components

### 2. Import Updates
When moving files, update all imports:

**Before:**
```tsx
import { Button } from './components/ui/button';
import { LoginPage } from './components/auth/LoginPage';
```

**After:**
```tsx
import { Button } from '@/components/common/button';
import { LoginPage } from '@/pages/Auth/LoginPage';
```

### 3. Preserve Manual Edits
These files have been manually edited and MUST be copied as-is:
- `PersonalizedHome.tsx`
- `AnalyticsTab.tsx`
- `LessonFlashcards.tsx`
- `StudyModule.tsx`

Only update their imports to match the new structure.

## 📝 Implementation Checklist

- [x] Create new `/src` folder structure
- [x] Move common UI components to `/src/components/common/`
- [ ] Move layout components to `/src/components/layout/`
- [ ] Move and organize all page components to `/src/pages/`
- [ ] Create utility files in `/src/utils/`
- [ ] Create service files in `/src/services/`
- [ ] Create custom hooks in `/src/hooks/`
- [ ] Update all import statements across the project
- [ ] Move styles to `/src/styles/`
- [ ] Update `vite.config.ts` for path aliases
- [ ] Test the application
- [ ] Delete old file structure
- [ ] Update `.gitignore`
- [ ] Create comprehensive `README.md`

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎨 Styling Guidelines

1. Use CSS modules or scoped CSS files for component-specific styles
2. Keep global styles in `src/styles/globals.css`
3. Use CSS variables defined in `src/styles/variables.css`
4. Follow RTL (right-to-left) layout conventions for Arabic content
5. Maintain the blue-purple-pink gradient theme throughout

## 🔐 Features

- ✅ Full RTL support with Arabic translation
- ✅ Authentication (Login/Signup/Guest mode)
- ✅ Diagnostic test for academic level assessment
- ✅ Study preferences (4-step form)
- ✅ Personalized study plans
- ✅ Interactive study modules with slide navigation
- ✅ Quick question popups during study sessions
- ✅ Flashcards review system
- ✅ Auto-generated quizzes
- ✅ Advanced analytics dashboard
- ✅ Progress tracking
- ✅ Responsive design (mobile, tablet, desktop)

## 📦 Key Dependencies

- React 18+
- TypeScript
- Vite
- Tailwind CSS
- Lucide React (icons)
- Recharts (analytics charts)

## 🤝 Contributing

When adding new features:
1. Create components in appropriate folders
2. Keep components small and focused
3. Use meaningful names
4. Follow existing code style
5. Maintain RTL compatibility
6. Test on multiple devices

## 📄 License

Private project for educational purposes.
