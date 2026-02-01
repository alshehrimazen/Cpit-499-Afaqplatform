# RTL Conversion Remaining Tasks

## ✅ Completed
1. Progress component - Changed to fill from right to left
2. HomeTab.tsx - Added dir="rtl" and fixed icon positions
3. StudyModule.tsx header - Added dir="rtl"
4. StudyModule.tsx progress bar - Added dir="rtl"
5. LessonFlashcards.tsx - Fully translated and RTL

## 🔄 Components Requiring RTL Fixes

### High Priority (User-Facing Pages)
1. **FinalExam.tsx** - NOT translated, needs full Arabic translation + RTL
2. **Dashboard.tsx** - Needs dir="rtl" and icon position fixes (ml-15 → mr-15)
3. **LessonsModule.tsx** - Needs dir="rtl" and fixes (ml-15 → mr-15, English text)
4. **DiagnosticTest.tsx** - Has dir="rtl" but needs icon position review
5. **PlanDashboard.tsx** - Needs icon position fixes (ml-1 → mr-1)
6. **Sidebar.tsx** - Needs icon fix (ml-3 → mr-3)
7. **Friends.tsx** - Needs icon fix (ml-2 → mr-2) and dir="rtl"
8. **LoginPage.tsx** - pr-10 classes are correct for RTL, needs icon fix (ml-2 → mr-2)
9. **SignupPage.tsx** - pr-10 classes are correct for RTL

### Medium Priority  
1. **StudyModule.tsx** - Fix remaining icon positions (ml-2, mr-2)
2. **QuizInterface.tsx** - Fix icon positions (mr-2 should stay)
3. **LessonQuiz.tsx** - Check for RTL support

### Low Priority (UI Components)
- context-menu.tsx, dropdown-menu.tsx, menubar.tsx, navigation-menu.tsx
- These are generic UI components that may not need changes

## 📝 Notes
- Progress bars now fill from right to left (RTL style)
- Numbers should remain as-is (Arabic numerals like 1,2,3 not ١،٢،٣)
- All pages with Arabic text MUST have dir="rtl"
- Icon positions: Use mr-* for RTL (margin-right), not ml-*
