# 🚀 Deployment Guide - Afaq Platform

## Table of Contents
1. [GitHub Repository Setup](#github-repository-setup)
2. [Local Development](#local-development)
3. [Production Build](#production-build)
4. [Deployment Options](#deployment-options)
5. [Environment Variables](#environment-variables)
6. [CI/CD Setup](#cicd-setup)

---

## 📦 GitHub Repository Setup

### Step 1: Initialize Git Repository

```bash
# Navigate to project directory
cd afaq-platform

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Afaq Platform with restructured folders"
```

### Step 2: Create GitHub Repository

1. Go to [GitHub](https://github.com) and login
2. Click "New Repository"
3. Repository name: `afaq-platform`
4. Description: "AI-powered adaptive study platform for Saudi high school students"
5. Choose Private or Public
6. **Do NOT** initialize with README, .gitignore, or license (we already have them)
7. Click "Create Repository"

### Step 3: Push to GitHub

```bash
# Add remote origin (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/afaq-platform.git

# Push to main branch
git branch -M main
git push -u origin main
```

---

## 💻 Local Development

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Git installed

### Setup

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/afaq-platform.git
cd afaq-platform

# Install dependencies
npm install

# Start development server
npm run dev
```

Server will run at `http://localhost:3000`

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes...

# Stage changes
git add .

# Commit with descriptive message
git commit -m "Add: new feature description"

# Push to GitHub
git push origin feature/new-feature

# Create Pull Request on GitHub
```

---

## 🏗️ Production Build

### Build Command

```bash
# Clean build
rm -rf dist/

# Create production build
npm run build
```

Build output will be in `/dist` folder.

### Build Verification

```bash
# Preview production build locally
npm run preview
```

---

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

**Pros**: Free, automatic deployments, excellent performance, built-in CDN

**Steps**:

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
# First deployment (will ask configuration questions)
vercel

# Production deployment
vercel --prod
```

4. **Or Deploy via GitHub**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure:
     - Framework Preset: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - Click "Deploy"

**Custom Domain**:
- Go to Project Settings → Domains
- Add your custom domain
- Update DNS records as instructed

---

### Option 2: Netlify

**Pros**: Free tier, easy setup, form handling, serverless functions

**Steps**:

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Login**
```bash
netlify login
```

3. **Deploy**
```bash
# Initialize
netlify init

# Deploy to production
netlify deploy --prod
```

4. **Or Deploy via GitHub**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Choose GitHub and select repository
   - Configure:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

**Configuration File** (optional):
Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### Option 3: GitHub Pages

**Pros**: Free, integrated with GitHub

**Steps**:

1. **Install gh-pages**
```bash
npm install --save-dev gh-pages
```

2. **Update package.json**
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  },
  "homepage": "https://YOUR_USERNAME.github.io/afaq-platform"
}
```

3. **Update vite.config.ts**
```typescript
export default defineConfig({
  base: '/afaq-platform/',
  // ... rest of config
});
```

4. **Deploy**
```bash
npm run deploy
```

5. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: Deploy from branch
   - Branch: gh-pages / (root)
   - Save

---

### Option 4: AWS S3 + CloudFront

**Pros**: Scalable, enterprise-grade, full control

**Steps**:

1. **Create S3 Bucket**
   - Enable static website hosting
   - Configure bucket policy for public access

2. **Upload Build**
```bash
# Install AWS CLI
npm install -g aws-cli

# Configure AWS credentials
aws configure

# Upload files
aws s3 sync dist/ s3://your-bucket-name --delete
```

3. **Create CloudFront Distribution**
   - Origin: Your S3 bucket
   - Enable Gzip compression
   - Custom error pages (404 → index.html)

---

### Option 5: DigitalOcean App Platform

**Steps**:

1. Go to [DigitalOcean](https://www.digitalocean.com)
2. Create new App
3. Connect GitHub repository
4. Configure:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Deploy

---

## 🔐 Environment Variables

### Development (.env)
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_ENV=development
```

### Production

**Vercel**:
- Project Settings → Environment Variables
- Add variables and redeploy

**Netlify**:
- Site Settings → Build & Deploy → Environment
- Add variables and redeploy

**Important**: Never commit `.env` files to Git!

---

## 🔄 CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test --if-present
      
    - name: Build
      run: npm run build
      
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
```

---

## 📊 Performance Optimization

### Before Deployment Checklist

- [ ] Run production build locally
- [ ] Test on different devices
- [ ] Check console for errors
- [ ] Verify all images load
- [ ] Test all navigation flows
- [ ] Verify RTL layout
- [ ] Test Arabic text rendering
- [ ] Check responsive breakpoints
- [ ] Optimize images (compress, proper formats)
- [ ] Remove console.log statements
- [ ] Minify CSS and JS (handled by Vite)

### Post-Deployment

- [ ] Test deployed URL
- [ ] Check SSL certificate
- [ ] Verify custom domain (if applicable)
- [ ] Test on multiple browsers
- [ ] Monitor performance (Lighthouse)
- [ ] Set up analytics (Google Analytics, Plausible)
- [ ] Configure error tracking (Sentry)

---

## 🔍 Monitoring & Analytics

### Recommended Tools

1. **Google Analytics**
   - Track user behavior
   - Monitor page views
   - Analyze user flow

2. **Sentry**
   - Error tracking
   - Performance monitoring
   - Real-time alerts

3. **Vercel Analytics** (if using Vercel)
   - Web Vitals
   - Page load times
   - User experience metrics

---

## 🆘 Troubleshooting

### Build Failures

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite

# Rebuild
npm run build
```

### Deployment Issues

1. Check build logs for errors
2. Verify environment variables
3. Check file size limits
4. Verify node version compatibility

### Performance Issues

1. Analyze bundle size
```bash
npm run build -- --analyze
```

2. Lazy load components
3. Optimize images
4. Enable caching

---

## 📞 Support

For deployment issues:
1. Check platform-specific documentation
2. Review build logs
3. Check community forums
4. Contact platform support

---

## 🎉 Success!

Once deployed, your Afaq Platform will be live and accessible to users!

**Next Steps**:
- Set up custom domain
- Configure SSL
- Enable analytics
- Monitor performance
- Gather user feedback
- Iterate and improve

---

**Happy Deploying! 🚀**
