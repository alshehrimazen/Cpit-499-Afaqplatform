# 🏗️ Afaq Platform - Architecture & Flow Diagrams

## 📂 Project Structure Visualization

```
afaq-platform/
│
├── 📄 Configuration Files
│   ├── package.json          # Dependencies & scripts
│   ├── tsconfig.json          # TypeScript config
│   ├── vite.config.ts         # Vite + path aliases
│   ├── .gitignore            # Git exclusions
│   └── index.html            # HTML entry
│
├── 📚 Documentation
│   ├── README.md                    # Main documentation
│   ├── DEPLOYMENT.md                # Deploy guide
│   ├── CONTRIBUTING.md              # Contribution guide
│   ├── PROJECT_STRUCTURE_GUIDE.md   # Migration guide
│   ├── COMPONENT_REFERENCE.md       # Quick reference
│   ├── RESTRUCTURING_SUMMARY.md     # Summary
│   ├── IMPLEMENTATION_CHECKLIST.md  # Task checklist
│   └── ARCHITECTURE.md              # This file
│
└── 📁 src/
    │
    ├── 🎨 assets/
    │   ├── images/          # Images (PNG, JPG, SVG)
    │   ├── icons/           # Icon files
    │   └── fonts/           # Custom fonts
    │
    ├── 🧩 components/
    │   ├── common/          # Reusable UI components
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── input.tsx
    │   │   ├── tabs.tsx
    │   │   ├── dialog.tsx
    │   │   └── ... (40+ components)
    │   │
    │   └── layout/          # Layout components
    │       ├── Sidebar/
    │       │   └── Sidebar.tsx
    │       ├── Header/
    │       └── Footer/
    │
    ├── 📄 pages/
    │   ├── Landing/
    │   │   └── LandingPage.tsx
    │   │
    │   ├── Auth/
    │   │   ├── LoginPage.tsx
    │   │   └── SignupPage.tsx
    │   │
    │   ├── Diagnostic/
    │   │   └── DiagnosticTest.tsx
    │   │
    │   ├── Preferences/
    │   │   └── StudyPreferences.tsx
    │   │
    │   ├── Home/
    │   │   ├── PersonalizedHome.tsx  ⚠️ PRESERVED
    │   │   ├── HomeTab.tsx
    │   │   ├── AnalyticsTab.tsx      ⚠️ PRESERVED
    │   │   ├── FlashcardsSection.tsx
    │   │   ├── LessonsModule.tsx
    │   │   └── LessonQuiz.tsx
    │   │
    │   ├── Dashboard/
    │   │   ├── Dashboard.tsx
    │   │   └── PlanDashboard.tsx
    │   │
    │   ├── Study/
    │   │   ├── StudyModule.tsx        ⚠️ PRESERVED
    │   │   ├── LessonFlashcards.tsx   ⚠️ PRESERVED
    │   │   └── QuickQuestionPopup.tsx
    │   │
    │   ├── Quiz/
    │   │   └── QuizInterface.tsx
    │   │
    │   ├── Exam/
    │   │   └── FinalExam.tsx
    │   │
    │   ├── Analytics/
    │   │   └── AnalyticsDashboard.tsx
    │   │
    │   └── Friends/
    │       └── Friends.tsx
    │
    ├── 🎣 hooks/
    │   ├── useAuth.ts           # Authentication logic
    │   ├── useStudyPlan.ts      # Study plan management
    │   └── useLocalStorage.ts   # Persistent storage
    │
    ├── 🔧 services/
    │   ├── api.ts               # API calls (mock)
    │   └── storage.service.ts   # LocalStorage wrapper
    │
    ├── 🛠️ utils/
    │   ├── types.ts             # TypeScript types
    │   ├── constants.ts         # App constants
    │   └── helpers.ts           # Utility functions
    │
    ├── 💅 styles/
    │   ├── globals.css          # Global styles
    │   └── variables.css        # CSS variables
    │
    ├── 🚀 App.tsx               # Main app component
    └── 📍 main.tsx              # Entry point
```

---

## 🔄 User Flow Diagram

```
                    ┌─────────────────┐
                    │  Landing Page   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Choose Action │
                    └─┬──────┬───────┬┘
                      │      │       │
          ┌───────────┤      │       └───────────┐
          │           │      │                   │
    ┌─────▼─────┐ ┌──▼──┐ ┌─▼───────┐    ┌──────▼──────┐
    │   Login   │ │Guest│ │ Sign Up │    │ Learn More  │
    └─────┬─────┘ └──┬──┘ └────┬────┘    └─────────────┘
          │          │         │
          └──────────┼─────────┘
                     │
            ┌────────▼─────────┐
            │ Diagnostic Test   │ (15 questions)
            └────────┬──────────┘
                     │
            ┌────────▼──────────┐
            │ Study Preferences │ (4 steps)
            │  1. Time          │
            │  2. Schedule      │
            │  3. Goals         │
            │  4. Intensity     │
            └────────┬──────────┘
                     │
            ┌────────▼──────────┐
            │ Create Study Plan │
            └────────┬──────────┘
                     │
            ┌────────▼──────────┐
            │  Home Dashboard   │ ◄───────┐
            │  (2 tabs)         │         │
            │  - Home           │         │
            │  - Analytics      │         │
            └─┬────────────────┬┘         │
              │                │          │
    ┌─────────▼──┐        ┌───▼────────┐ │
    │ View Plans │        │  Friends   │ │
    └─────┬──────┘        └────────────┘ │
          │                               │
    ┌─────▼──────┐                       │
    │ Open Plan  │                       │
    └─────┬──────┘                       │
          │                               │
    ┌─────▼──────────┐                   │
    │ Plan Dashboard │                   │
    │ (5 modules)    │                   │
    └─────┬──────────┘                   │
          │                               │
    ┌─────▼────────┐                     │
    │ Study Module │ ──► Quick Questions │
    │ (slides)     │     (popup)         │
    └─────┬────────┘                     │
          │                               │
    ┌─────▼────────┐                     │
    │  Flashcards  │                     │
    └─────┬────────┘                     │
          │                               │
    ┌─────▼────────┐                     │
    │     Quiz     │                     │
    └─────┬────────┘                     │
          │                               │
    ┌─────▼────────┐                     │
    │ Score Result │                     │
    └─────┬────────┘                     │
          │                               │
          └───────────────────────────────┘
```

---

## 🔀 Component Hierarchy

```
App
├── Sidebar (conditional)
│   ├── Logo
│   ├── Navigation Menu
│   ├── User Profile
│   └── Logout Button
│
└── Main Content (based on currentPage state)
    │
    ├── LandingPage
    │   ├── Hero Section
    │   ├── Features Grid
    │   ├── CTA Buttons
    │   └── Footer
    │
    ├── LoginPage
    │   ├── Form
    │   │   ├── Email Input
    │   │   ├── Password Input
    │   │   └── Submit Button
    │   └── Guest Login Option
    │
    ├── SignupPage
    │   ├── Form
    │   │   ├── Name Input
    │   │   ├── Email Input
    │   │   ├── Password Input
    │   │   └── Submit Button
    │   └── Login Link
    │
    ├── DiagnosticTest
    │   ├── Progress Bar
    │   ├── Question Card
    │   │   ├── Question Text
    │   │   └── Options (4)
    │   └── Navigation Buttons
    │
    ├── StudyPreferences
    │   ├── Step Indicator (1-4)
    │   ├── Step 1: Time Commitment
    │   ├── Step 2: Schedule
    │   ├── Step 3: Goals
    │   ├── Step 4: Intensity
    │   └── Navigation Buttons
    │
    ├── PersonalizedHome ⚠️
    │   ├── Header
    │   │   └── Menu Toggle (mobile)
    │   └── Tabs
    │       ├── Home Tab
    │       │   ├── Welcome Card
    │       │   ├── Study Plans Grid
    │       │   └── Create Plan Button
    │       │
    │       └── Analytics Tab ⚠️
    │           ├── Overview Cards
    │           ├── Progress Charts
    │           └── Subject Breakdown
    │
    ├── PlanDashboard
    │   ├── Header
    │   ├── Progress Overview
    │   ├── Modules List
    │   │   └── Module Cards (5)
    │   │       ├── Title
    │   │       ├── Status Badge
    │   │       └── Action Button
    │   └── Final Exam Button
    │
    ├── StudyModule ⚠️
    │   ├── Header
    │   ├── Progress Bar
    │   ├── Slide Content
    │   ├── Navigation Buttons
    │   └── QuickQuestionPopup (conditional)
    │       ├── Question
    │       ├── Options
    │       └── Submit Button
    │
    ├── LessonFlashcards ⚠️
    │   ├── Header
    │   ├── Progress Indicator
    │   ├── Flashcard
    │   │   ├── Front (question)
    │   │   └── Back (answer)
    │   └── Navigation Buttons
    │
    ├── QuizInterface
    │   ├── Timer
    │   ├── Progress Bar
    │   ├── Question Card
    │   ├── Answer Options
    │   └── Submit Button
    │
    ├── FinalExam
    │   ├── Instructions
    │   ├── Timer
    │   ├── Questions List
    │   └── Submit Button
    │
    ├── AnalyticsDashboard
    │   ├── Overview Cards
    │   ├── Performance Chart
    │   ├── Subject Progress
    │   └── Recommendations
    │
    └── Friends
        ├── Friends List
        ├── Add Friend Button
        └── Leaderboard
```

---

## 🗄️ Data Flow Architecture

```
┌─────────────────────────────────────────────────┐
│                   App.tsx                       │
│  (Central State Management)                     │
│                                                  │
│  State:                                         │
│  - currentPage                                  │
│  - user                                         │
│  - studyPlans                                   │
│  - currentPlanId                                │
│  - currentModule                                │
│  - sidebarOpen                                  │
└──────────┬──────────────────────┬───────────────┘
           │                      │
           │                      │
    ┌──────▼─────┐         ┌──────▼──────┐
    │  Services  │         │    Hooks    │
    └──────┬─────┘         └──────┬──────┘
           │                      │
    ┌──────▼──────┐        ┌──────▼──────┐
    │ LocalStorage│        │  useAuth    │
    │   Service   │        │useStudyPlan │
    └──────┬──────┘        └──────┬──────┘
           │                      │
    ┌──────▼──────┐        ┌──────▼──────┐
    │  API Mock   │        │   Utils     │
    │  (Future)   │        │  Helpers    │
    └─────────────┘        └─────────────┘
```

---

## 🎨 Styling Architecture

```
┌─────────────────────────────────────────┐
│          styles/variables.css           │
│  - CSS Custom Properties               │
│  - Colors, Spacing, Typography         │
└─────────────┬───────────────────────────┘
              │
              │ imported by
              │
┌─────────────▼───────────────────────────┐
│          styles/globals.css             │
│  - Global Resets                       │
│  - Base Typography (RTL)               │
│  - Tailwind Base Layers                │
└─────────────┬───────────────────────────┘
              │
              │ imported in main.tsx
              │
              │
     ┌────────┴────────┐
     │                 │
┌────▼─────┐    ┌──────▼──────┐
│Tailwind  │    │ Component   │
│CSS       │    │ Styles      │
│Classes   │    │ (scoped)    │
└──────────┘    └─────────────┘
```

---

## 🔐 Authentication Flow

```
┌──────────┐
│  Login   │
│  Page    │
└────┬─────┘
     │
     ▼
┌──────────────────┐
│  handleLogin()   │
│  in App.tsx      │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐     ┌──────────────┐
│   useAuth hook   │────►│ API Service  │
│                  │     │ (mock auth)  │
└────┬─────────────┘     └──────────────┘
     │
     ▼
┌──────────────────┐
│  Save to         │
│  LocalStorage    │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│  Update User     │
│  State in App    │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│  Navigate to     │
│  Home Page       │
└──────────────────┘
```

---

## 📊 Study Plan Creation Flow

```
Start: User clicks "Create New Plan"
   │
   ▼
┌──────────────────┐
│ Diagnostic Test  │ ──► 15 Questions
└────┬─────────────┘     Determine Level
     │
     ▼
Save Level (beginner/intermediate/advanced)
     │
     ▼
┌──────────────────┐
│ Study Preferences│
│    (4 Steps)     │
│                  │
│ Step 1: Hours    │ ──► 1-2, 3-4, 5+ hours/day
│ Step 2: Schedule │ ──► Morning, Afternoon, Evening
│ Step 3: Goals    │ ──► Multiple selection
│ Step 4: Intensity│ ──► Light, Moderate, Intensive
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Create Study Plan│
│  - Set title     │
│  - Set level     │
│  - Set status    │
│  - Init modules  │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│  Save to State   │
│  and Storage     │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Navigate to Home │
│  Display Plan    │
└──────────────────┘
```

---

## 📚 Study Session Flow

```
User Opens Study Plan
   │
   ▼
┌──────────────────┐
│ Plan Dashboard   │
│  Shows 5 Modules │
└────┬─────────────┘
     │
     │ User clicks module
     ▼
┌──────────────────┐
│  Study Module    │ ◄─────┐
│  (10+ slides)    │       │
└────┬─────────────┘       │
     │                     │
     │ Every 1-2 slides    │
     ▼                     │
┌──────────────────┐       │
│ Quick Question   │       │
│    Popup         │       │
└────┬─────────────┘       │
     │                     │
     │ Continue            │
     └─────────────────────┘
     │
     │ All slides complete
     ▼
┌──────────────────┐
│   Flashcards     │
│  (8-10 cards)    │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│      Quiz        │
│  (10 questions)  │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│  Save Score      │
│  Update Progress │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Back to Plan     │
│   Dashboard      │
└──────────────────┘
```

---

## 🔌 Import Path Aliases

```typescript
// Path Alias Configuration (vite.config.ts + tsconfig.json)

@/              →  ./src/
@components/    →  ./src/components/
@pages/         →  ./src/pages/
@hooks/         →  ./src/hooks/
@services/      →  ./src/services/
@utils/         →  ./src/utils/
@styles/        →  ./src/styles/
@assets/        →  ./src/assets/

// Usage Examples:

// Import a component
import { Button } from '@/components/common/button';

// Import a page
import { LoginPage } from '@/pages/Auth/LoginPage';

// Import a hook
import { useAuth } from '@/hooks/useAuth';

// Import a service
import { saveUser } from '@/services/storage.service';

// Import utilities
import { formatDate } from '@/utils/helpers';
import { SUBJECTS } from '@/utils/constants';
import type { User } from '@/utils/types';
```

---

## 🔄 State Management Pattern

```typescript
// App.tsx is the central state manager
// No Redux or external state library needed

┌─────────────────────────────────────────┐
│             App.tsx State               │
├─────────────────────────────────────────┤
│  - currentPage: Page                    │
│  - user: User | null                    │
│  - studyPlans: StudyPlan[]              │
│  - currentPlanId: string | null         │
│  - currentModule: string | null         │
│  - currentQuiz: string | null           │
│  - sidebarOpen: boolean                 │
│  - diagnosticLevel: string              │
└──────────┬──────────────────────────────┘
           │
           │ Props drilling to children
           │
     ┌─────┴─────┐
     │           │
┌────▼────┐ ┌────▼────┐
│  Pages  │ │ Sidebar │
└────┬────┘ └─────────┘
     │
     │ Event handlers passed as props
     │
┌────▼─────────────────────┐
│  Event Handlers in App:  │
│  - handleLogin()          │
│  - handleSignup()         │
│  - handleCreateNewPlan()  │
│  - handleOpenPlan()       │
│  - handleStartModule()    │
│  - handleModuleComplete() │
│  - etc.                   │
└──────────────────────────┘
```

---

## 📦 Build & Bundle Structure

```
After `npm run build`:

dist/
├── index.html
├── assets/
│   ├── index-[hash].js        # Main bundle
│   ├── index-[hash].css       # Compiled styles
│   ├── vendor-[hash].js       # Third-party libs
│   └── ... (other chunks)
└── public assets (images, fonts, etc.)

Optimization:
- Code splitting by route
- Tree shaking unused code
- Minification of JS and CSS
- Asset optimization
```

---

## 🚀 Deployment Flow

```
Local Development
      │
      │ git add .
      │ git commit
      │ git push
      │
      ▼
┌─────────────┐
│   GitHub    │
│ Repository  │
└──────┬──────┘
       │
       │ Automatic deployment
       │
       ▼
┌─────────────────┐
│  Platform       │
│  (Vercel/       │
│   Netlify/      │
│   GitHub Pages) │
└──────┬──────────┘
       │
       │ Build & Deploy
       │
       ▼
┌─────────────────┐
│  Production URL │
│  (Live Site)    │
└─────────────────┘
```

---

## 🎯 Performance Optimization Strategy

```
1. Code Splitting
   - Route-based splitting
   - Lazy loading components
   - Dynamic imports

2. Asset Optimization
   - Image compression
   - SVG optimization
   - Font subsetting

3. Caching Strategy
   - Service Worker (future)
   - LocalStorage for data
   - Browser caching

4. Bundle Optimization
   - Tree shaking
   - Minification
   - Gzip compression

5. Runtime Optimization
   - React.memo for expensive components
   - useMemo for expensive calculations
   - useCallback for event handlers
   - Virtual scrolling for long lists
```

---

## 📊 Analytics & Monitoring (Future)

```
┌──────────────────┐
│   User Actions   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Analytics SDK   │
│  (Google/Plausible)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Error Tracking  │
│    (Sentry)      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Dashboards     │
│  - User behavior │
│  - Performance   │
│  - Errors        │
└──────────────────┘
```

---

## 🔒 Security Considerations

```
Current (Frontend Only):
- Input validation
- XSS prevention (React default)
- No sensitive data in localStorage
- HTTPS only (in production)

Future (With Backend):
- JWT authentication
- CSRF protection
- Rate limiting
- Data encryption
- API security headers
```

---

**This architecture document provides a comprehensive visual overview of the Afaq Platform structure, flows, and relationships.**

**Last Updated**: February 1, 2026  
**Version**: 1.0.0
