# 🤝 Contributing to Afaq Platform

<div dir="rtl">

مرحباً بك في مشروع منصة آفاق! نحن نرحب بمساهماتك لتحسين المنصة.

</div>

Thank you for your interest in contributing to Afaq Platform! This document provides guidelines and standards for contributing to the project.

---

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing](#testing)
8. [Documentation](#documentation)

---

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Be respectful, professional, and constructive in all interactions.

### Our Standards

- ✅ Use welcoming and inclusive language
- ✅ Be respectful of differing viewpoints
- ✅ Accept constructive criticism gracefully
- ✅ Focus on what is best for the community
- ✅ Show empathy towards other community members

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Code editor (VS Code recommended)
- Basic knowledge of React, TypeScript, and Tailwind CSS

### Setting Up Development Environment

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/afaq-platform.git
cd afaq-platform

# 3. Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/afaq-platform.git

# 4. Install dependencies
npm install

# 5. Create a branch for your work
git checkout -b feature/your-feature-name

# 6. Start development server
npm run dev
```

### VS Code Extensions (Recommended)

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)
- GitLens

---

## 🔄 Development Workflow

### 1. Sync with Upstream

Always sync your fork before starting new work:

```bash
git checkout main
git fetch upstream
git merge upstream/main
git push origin main
```

### 2. Create Feature Branch

```bash
git checkout -b feature/feature-name
# or
git checkout -b fix/bug-description
# or
git checkout -b docs/documentation-update
```

### 3. Make Changes

- Write clean, readable code
- Follow project structure
- Add comments for complex logic
- Update documentation if needed

### 4. Test Your Changes

```bash
# Run development server
npm run dev

# Build to check for errors
npm run build

# Test on different devices/browsers
```

### 5. Commit Changes

```bash
git add .
git commit -m "feat: add new feature description"
```

### 6. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 7. Create Pull Request

- Go to GitHub
- Click "New Pull Request"
- Fill out the PR template
- Wait for review

---

## 💻 Coding Standards

### File Organization

```
src/
├── components/
│   └── common/
│       └── Button/
│           ├── Button.tsx       # Component logic
│           ├── Button.css       # Component styles (if needed)
│           └── index.ts         # Re-export (optional)
├── pages/
│   └── Example/
│       ├── ExamplePage.tsx
│       └── ExamplePage.css
```

### Component Structure

```typescript
// 1. Imports (grouped and sorted)
import { useState, useEffect } from 'react';
import { Button } from '@/components/common/button';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/helpers';
import type { User } from '@/utils/types';
import './ComponentName.css';

// 2. Types/Interfaces
interface ComponentProps {
  title: string;
  onAction: () => void;
}

// 3. Component
export const ComponentName: React.FC<ComponentProps> = ({
  title,
  onAction,
}) => {
  // 3.1. State
  const [state, setState] = useState<string>('');
  
  // 3.2. Hooks
  const { user } = useAuth();
  
  // 3.3. Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // 3.4. Event Handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // 3.5. Render Helpers
  const renderContent = () => {
    return <div>Content</div>;
  };
  
  // 3.6. Return
  return (
    <div className="component-name">
      {/* Component JSX */}
    </div>
  );
};
```

### Naming Conventions

**Components**
```typescript
// PascalCase for components
export const UserProfile: React.FC = () => {};
export const StudyModule: React.FC = () => {};
```

**Functions**
```typescript
// camelCase for functions
const calculateScore = () => {};
const handleSubmit = () => {};
```

**Constants**
```typescript
// UPPER_SNAKE_CASE for constants
const MAX_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';
```

**Types/Interfaces**
```typescript
// PascalCase with descriptive names
interface UserProfile {}
type StudyPlanStatus = 'active' | 'completed';
```

### TypeScript Guidelines

```typescript
// ✅ Good: Explicit types
interface ButtonProps {
  text: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

// ✅ Good: Type inference
const numbers = [1, 2, 3]; // inferred as number[]

// ❌ Avoid: any type
const data: any = {}; // ❌ Don't use 'any'

// ✅ Better: use specific types
const data: Record<string, unknown> = {};
```

### CSS Guidelines

```css
/* Use BEM-like naming */
.component-name {
  /* Component root */
}

.component-name__element {
  /* Element within component */
}

.component-name--modifier {
  /* Modifier variant */
}

/* Use Tailwind CSS primarily */
/* Add custom CSS only when necessary */

/* Use CSS variables from globals.css */
.custom-element {
  color: var(--color-primary-blue);
  padding: var(--spacing-md);
}
```

### RTL Considerations

```typescript
// Always consider RTL layout
// Use logical properties when possible

// ❌ Avoid
<div className="ml-4 text-left">

// ✅ Better
<div className="mr-4 text-right">  // In RTL context

// ✅ Best: Use Tailwind's RTL support
<div className="ms-4 text-start">  // Logical properties
```

---

## 📝 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```bash
# Feature
git commit -m "feat(auth): add guest login functionality"

# Bug fix
git commit -m "fix(quiz): resolve score calculation error"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Style
git commit -m "style(button): improve spacing and alignment"

# Refactor
git commit -m "refactor(api): simplify authentication logic"
```

### Commit Best Practices

- ✅ Write clear, descriptive messages
- ✅ Use present tense ("add feature" not "added feature")
- ✅ Keep commits focused (one logical change per commit)
- ✅ Reference issues when applicable (#123)

---

## 🔀 Pull Request Process

### Before Creating PR

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Commit messages are clear
- [ ] Branch is up to date with main

### PR Title Format

```
[Type] Brief description

Examples:
[Feature] Add study preferences form
[Fix] Resolve navigation bug in sidebar
[Docs] Update contribution guidelines
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test these changes

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Submit PR**: Create PR with clear description
2. **Automated Checks**: Wait for CI/CD checks
3. **Code Review**: Address reviewer feedback
4. **Approval**: Get approval from maintainer
5. **Merge**: Maintainer will merge when ready

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Feature works as expected
- [ ] No console errors
- [ ] Responsive on mobile/tablet/desktop
- [ ] RTL layout correct
- [ ] Arabic text displays properly
- [ ] Navigation works correctly
- [ ] Forms validate properly
- [ ] Data persists correctly

### Browser Testing

Test on:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

### Test Scenarios

```typescript
// Example: Test user flow
// 1. Login
// 2. Take diagnostic test
// 3. Set preferences
// 4. View study plan
// 5. Complete module
// 6. Take quiz
// 7. View analytics
```

---

## 📚 Documentation

### Code Comments

```typescript
/**
 * Calculates the average quiz score for a study plan
 * @param planId - The ID of the study plan
 * @returns The average score as a percentage (0-100)
 */
export const calculateAverageScore = (planId: string): number => {
  // Implementation
};
```

### Component Documentation

```typescript
/**
 * Button component with multiple variants
 * 
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Click Me
 * </Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = ({ ... }) => {
  // Implementation
};
```

### Update Documentation Files

When making significant changes, update:
- README.md
- COMPONENT_REFERENCE.md
- Relevant documentation files

---

## 🎨 Design Guidelines

### Colors

Use CSS variables from `variables.css`:
```css
var(--color-primary-blue)
var(--color-primary-purple)
var(--color-primary-pink)
var(--gradient-primary)
```

### Spacing

Use Tailwind spacing scale:
```tsx
<div className="p-4 m-2 gap-4">
```

### Typography

Follow existing text styles:
```tsx
<h1>Heading 1</h1>  {/* Styled by globals.css */}
<h2>Heading 2</h2>
<p>Body text</p>
```

---

## 🐛 Reporting Bugs

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable, add screenshots

**Environment**
- Browser: [e.g. Chrome 120]
- Device: [e.g. iPhone 12]
- OS: [e.g. iOS 16]
```

---

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Description

**Describe the solution**
What you'd like to see

**Additional context**
Any other information
```

---

## 📞 Getting Help

- **Documentation**: Check README.md and guides
- **Issues**: Search existing issues
- **Discussions**: Use GitHub Discussions
- **Contact**: Reach out to maintainers

---

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

## 🙏 Thank You!

Thank you for contributing to Afaq Platform! Your efforts help make education better for students across Saudi Arabia.

<div dir="rtl">

## شكراً لك!

شكراً لمساهمتك في منصة آفاق! جهودك تساعد في تحسين التعليم للطلاب في جميع أنحاء المملكة العربية السعودية.

</div>

---

**Happy Coding! 🚀**
