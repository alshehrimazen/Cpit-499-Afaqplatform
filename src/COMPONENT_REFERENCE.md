# Component Migration & Structure Reference

## 🎯 Quick Reference Guide

This document provides a quick reference for migrating components to the new structure and understanding the organization.

---

## 📂 Directory Mapping

### Current Location → New Location

#### Common/UI Components
```
/components/ui/button.tsx          → /src/components/common/button.tsx
/components/ui/input.tsx           → /src/components/common/input.tsx
/components/ui/card.tsx            → /src/components/common/card.tsx
/components/ui/tabs.tsx            → /src/components/common/tabs.tsx
/components/ui/progress.tsx        → /src/components/common/progress.tsx
/components/ui/badge.tsx           → /src/components/common/badge.tsx
/components/ui/dialog.tsx          → /src/components/common/dialog.tsx
/components/ui/dropdown-menu.tsx   → /src/components/common/dropdown-menu.tsx
... (all other UI components)
```

#### Layout Components
```
/components/layout/Sidebar.tsx     → /src/components/layout/Sidebar/Sidebar.tsx
```

#### Pages
```
/components/LandingPage.tsx                     → /src/pages/Landing/LandingPage.tsx
/components/auth/LoginPage.tsx                  → /src/pages/Auth/LoginPage.tsx
/components/auth/SignupPage.tsx                 → /src/pages/Auth/SignupPage.tsx
/components/diagnostic/DiagnosticTest.tsx       → /src/pages/Diagnostic/DiagnosticTest.tsx
/components/preferences/StudyPreferences.tsx    → /src/pages/Preferences/StudyPreferences.tsx
/components/PersonalizedHome.tsx                → /src/pages/Home/PersonalizedHome.tsx [PRESERVE]
/components/home/HomeTab.tsx                    → /src/pages/Home/HomeTab.tsx
/components/home/AnalyticsTab.tsx               → /src/pages/Home/AnalyticsTab.tsx [PRESERVE]
/components/home/FlashcardsSection.tsx          → /src/pages/Home/FlashcardsSection.tsx
/components/home/LessonsModule.tsx              → /src/pages/Home/LessonsModule.tsx
/components/home/LessonQuiz.tsx                 → /src/pages/Home/LessonQuiz.tsx
/components/Friends.tsx                         → /src/pages/Friends/Friends.tsx
/components/dashboard/Dashboard.tsx             → /src/pages/Dashboard/Dashboard.tsx
/components/dashboard/PlanDashboard.tsx         → /src/pages/Dashboard/PlanDashboard.tsx
/components/study/StudyModule.tsx               → /src/pages/Study/StudyModule.tsx [PRESERVE]
/components/study/LessonFlashcards.tsx          → /src/pages/Study/LessonFlashcards.tsx [PRESERVE]
/components/study/QuickQuestionPopup.tsx        → /src/pages/Study/QuickQuestionPopup.tsx
/components/quiz/QuizInterface.tsx              → /src/pages/Quiz/QuizInterface.tsx
/components/exam/FinalExam.tsx                  → /src/pages/Exam/FinalExam.tsx
/components/analytics/AnalyticsDashboard.tsx    → /src/pages/Analytics/AnalyticsDashboard.tsx
```

---

## 🔧 Import Path Updates

### Before Migration
```typescript
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { LoginPage } from './components/auth/LoginPage';
import { PersonalizedHome } from './components/PersonalizedHome';
```

### After Migration (Relative Paths)
```typescript
import { Button } from '../../components/common/button';
import { Card } from '../../components/common/card';
import { LoginPage } from '../Auth/LoginPage';
import { PersonalizedHome } from '../Home/PersonalizedHome';
```

### After Migration (Path Aliases - Recommended)
```typescript
import { Button } from '@/components/common/button';
import { Card } from '@/components/common/card';
import { LoginPage } from '@/pages/Auth/LoginPage';
import { PersonalizedHome } from '@/pages/Home/PersonalizedHome';
```

---

## 📋 Component Templates

### Common Component Template

```typescript
// /src/components/common/Button/Button.tsx
import React from 'react';
import './Button.css'; // Optional: Component-specific styles

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`}
    >
      {children}
    </button>
  );
};
```

### Page Component Template

```typescript
// /src/pages/Example/ExamplePage.tsx
import { useState } from 'react';
import { Button } from '@/components/common/button';
import { Card } from '@/components/common/card';
import './ExamplePage.css';

interface ExamplePageProps {
  user: User;
  onNavigate: (page: string) => void;
}

export const ExamplePage: React.FC<ExamplePageProps> = ({
  user,
  onNavigate,
}) => {
  const [state, setState] = useState<string>('');

  const handleAction = () => {
    // Handle action
  };

  return (
    <div className="example-page">
      <h1>Example Page</h1>
      <Card>
        <Button onClick={handleAction}>Action</Button>
      </Card>
    </div>
  );
};
```

---

## 🎨 CSS File Organization

### Component-Specific CSS
```css
/* /src/pages/Home/PersonalizedHome.css */
.personalized-home {
  min-height: 100vh;
  background: var(--gradient-light);
}

.personalized-home__header {
  padding: 1rem;
  background: white;
}

.personalized-home__content {
  padding: 2rem;
}
```

### Global Styles
```css
/* /src/styles/globals.css */
/* Already configured - import in main.tsx */
```

### Variables
```css
/* /src/styles/variables.css */
/* Already configured - import in globals.css or main.tsx */
```

---

## 🔑 Key Files to Create/Update

### Must Create:
- [x] `/src/main.tsx` - Entry point
- [x] `/src/App.tsx` - Main app component
- [x] `/src/styles/globals.css` - Global styles
- [x] `/src/styles/variables.css` - CSS variables
- [x] `/src/utils/types.ts` - TypeScript types
- [x] `/src/utils/constants.ts` - Constants
- [x] `/src/utils/helpers.ts` - Helper functions
- [x] `/src/services/api.ts` - API service
- [x] `/src/services/storage.service.ts` - LocalStorage service
- [x] `/src/hooks/useAuth.ts` - Auth hook
- [x] `/src/hooks/useStudyPlan.ts` - Study plan hook
- [x] `/src/hooks/useLocalStorage.ts` - LocalStorage hook
- [x] `/vite.config.ts` - Vite configuration
- [x] `/tsconfig.json` - TypeScript configuration
- [x] `/package.json` - Dependencies
- [x] `/.gitignore` - Git ignore rules
- [x] `/README.md` - Documentation

### Component Folders to Create:
```
/src/components/common/
  ├── Button/
  ├── Input/
  ├── Card/
  ├── Modal/
  └── ... (all UI components)

/src/components/layout/
  ├── Sidebar/
  ├── Header/
  └── Footer/

/src/pages/
  ├── Landing/
  ├── Auth/
  ├── Home/
  ├── Diagnostic/
  ├── Preferences/
  ├── Dashboard/
  ├── Study/
  ├── Quiz/
  ├── Exam/
  ├── Analytics/
  └── Friends/
```

---

## ⚠️ Files to Preserve (Manually Edited)

These files contain manual edits and should be copied AS-IS with only import path updates:

1. **PersonalizedHome.tsx**
   - Location: `/src/pages/Home/PersonalizedHome.tsx`
   - Update imports to use new paths

2. **AnalyticsTab.tsx**
   - Location: `/src/pages/Home/AnalyticsTab.tsx`
   - Update imports to use new paths

3. **LessonFlashcards.tsx**
   - Location: `/src/pages/Study/LessonFlashcards.tsx`
   - Update imports to use new paths

4. **StudyModule.tsx**
   - Location: `/src/pages/Study/StudyModule.tsx`
   - Update imports to use new paths
   - Contains QuickQuestionPopup integration

---

## 🔄 Migration Checklist

### Phase 1: Setup
- [x] Create new folder structure
- [x] Create configuration files
- [x] Set up utilities and services
- [x] Create custom hooks

### Phase 2: Components
- [ ] Move UI components to `/src/components/common/`
- [ ] Move layout components to `/src/components/layout/`
- [ ] Update all component imports

### Phase 3: Pages
- [ ] Move page components to `/src/pages/`
- [ ] Preserve manually edited files
- [ ] Update imports in preserved files
- [ ] Create page-specific CSS files

### Phase 4: Testing
- [ ] Test each page individually
- [ ] Verify all imports work
- [ ] Check for console errors
- [ ] Test navigation flow
- [ ] Verify RTL layouts
- [ ] Test on different devices

### Phase 5: Cleanup
- [ ] Remove old file structure
- [ ] Update documentation
- [ ] Commit to Git
- [ ] Push to GitHub

---

## 📝 Common Import Patterns

### From Pages to Components
```typescript
// From /src/pages/Home/PersonalizedHome.tsx
import { Tabs } from '@/components/common/tabs';
import { Button } from '@/components/common/button';
import { Sidebar } from '@/components/layout/Sidebar/Sidebar';
```

### From Components to Utils
```typescript
// From any component
import { formatDate, calculatePercentage } from '@/utils/helpers';
import { SUBJECTS, STUDY_STATUS } from '@/utils/constants';
import type { User, StudyPlan } from '@/utils/types';
```

### From Components to Services
```typescript
// From any component
import { saveUser, getStudyPlans } from '@/services/storage.service';
import { authAPI, studyPlanAPI } from '@/services/api';
```

### From Components to Hooks
```typescript
// From any component
import { useAuth } from '@/hooks/useAuth';
import { useStudyPlan } from '@/hooks/useStudyPlan';
import { useLocalStorage } from '@/hooks/useLocalStorage';
```

---

## 🎯 Best Practices

### File Naming
- **Components**: PascalCase (`Button.tsx`, `UserCard.tsx`)
- **Utilities**: camelCase (`helpers.ts`, `constants.ts`)
- **Styles**: Match component name (`Button.css`, `UserCard.css`)

### Folder Structure
- **Component folders**: Create subfolder if component has multiple files
  ```
  /Button/
    ├── Button.tsx
    ├── Button.css
    ├── Button.test.tsx
    └── index.ts (optional: re-export)
  ```

### Import Organization
```typescript
// 1. External libraries
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

// 2. Internal components
import { Button } from '@/components/common/button';
import { Card } from '@/components/common/card';

// 3. Services and hooks
import { useAuth } from '@/hooks/useAuth';
import { saveUser } from '@/services/storage.service';

// 4. Utils and types
import { formatDate } from '@/utils/helpers';
import type { User } from '@/utils/types';

// 5. Styles
import './Component.css';
```

---

## 🚀 Quick Start After Migration

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📞 Need Help?

Refer to:
- `/PROJECT_STRUCTURE_GUIDE.md` - Detailed migration guide
- `/README.md` - Project overview and features
- `/DEPLOYMENT.md` - Deployment instructions

---

**Migration Status**: ✅ Foundation Complete | ⏳ Component Migration Pending
