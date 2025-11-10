# SnailMarketplace Frontend

Modern React frontend for SnailMarketplace platform built with Vite, TypeScript, Bootstrap 5, and i18next.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:3000` (optional for development)

### Installation

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

The application will be available at: `http://localhost:5173/`

## 🛠️ Technology Stack

### Core

- **React 18** - Modern UI library with concurrent rendering
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server

### UI Framework

- **Bootstrap 5** - Responsive CSS framework
- **react-bootstrap** - React components for Bootstrap
- **Custom CSS** - Minimalist custom styling with brand colors

### State Management

- **Zustand** - Lightweight state management (ready to use)
- **React Query** - Server state management (ready to use)

### Internationalization

- **react-i18next** - Multi-language support (EN/RU/AR)
- **RTL Support** - Right-to-left for Arabic

### Other Libraries

- **React Router** - Client-side routing (ready to use)
- **Axios** - HTTP client (ready to use)
- **React Hook Form** - Form handling (ready to use)
- **React Icons** - Icon library

## 📁 Project Structure

```
client/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Navbar.tsx
│   │   ├── HeroSection.tsx
│   │   ├── ServicesSection.tsx
│   │   └── Footer.tsx
│   ├── pages/           # Page components
│   │   └── Landing.tsx
│   ├── styles/          # Custom CSS
│   │   └── custom.css
│   ├── i18n/           # Internationalization
│   │   └── config.ts
│   ├── types/          # TypeScript types
│   │   └── index.ts
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Base styles
├── public/             # Static assets
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies
```

## 🎨 Design System

### Brand Colors

- **Primary Color:** `#334A9F` (Main brand color)
- **Primary Dark:** `#253780`
- **Primary Light:** `#4A5FB5`
- **Text Primary:** `#1a1a1a`
- **Text Secondary:** `#666666`
- **Background Light:** `#F8F9FA`

### Typography

- **Body Font:** Outfit (Google Fonts fallback)
- **Menu Font:** Futura PT style
  - Font size: 18px
  - Font weight: 400
  - Text transform: UPPERCASE
  - Line height: 100%

### Design Principles

- **Minimalist** - Clean and simple design
- **Responsive** - Mobile-first approach
- **Accessible** - WCAG compliant
- **RTL Ready** - Full support for Arabic

## 🌍 Multi-Language Support

The application supports three languages:

- **English (EN)** - Default
- **Russian (RU)** - Полная поддержка
- **Arabic (AR)** - دعم كامل

### Switching Languages

Use the language switcher in the navigation bar (EN | RU | AR).

### Adding New Translations

Edit `/src/i18n/config.ts` to add new translation keys:

```typescript
en: {
  translation: {
    key: 'English text',
  }
},
ru: {
  translation: {
    key: 'Русский текст',
  }
},
ar: {
  translation: {
    key: 'النص العربي',
  }
}
```

Use in components:

```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  return <h1>{t('key')}</h1>;
};
```

## 📱 Responsive Design

The application is fully responsive with breakpoints:

- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

## 🧪 Testing

```bash
# Run tests (when configured)
npm test

# Run tests with coverage
npm run test:coverage
```

## 🔨 Development

### Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint (when configured)

### Adding New Components

1. Create component in `src/components/`:

```typescript
// src/components/MyComponent.tsx
const MyComponent = () => {
  return <div>My Component</div>;
};

export default MyComponent;
```

2. Import and use in pages:

```typescript
import MyComponent from '../components/MyComponent';
```

### Environment Variables

Create `.env` file for environment-specific configuration:

```bash
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=SnailMarketplace
```

Access in code:

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

## 🚀 Production Build

```bash
# Build for production
npm run build

# Output will be in dist/ directory
ls dist/

# Preview production build locally
npm run preview
```

## 🔗 Integration with Backend

The frontend is designed to work with the NestJS backend API:

- **API Base URL:** `http://localhost:3000/api/v1`
- **Authentication:** JWT tokens (ready to integrate)
- **API Client:** Axios with interceptors (configured in future updates)

## 🎯 Features

### Current Features

✅ Responsive landing page
✅ Three service types showcase (Physical, Digital, Services)
✅ Multi-language support (EN/RU/AR)
✅ RTL support for Arabic
✅ Minimalist design system
✅ Bootstrap 5 components
✅ Custom brand styling

### Planned Features

🔲 User authentication pages
🔲 Product catalog
🔲 Shopping cart
🔲 Checkout flow
🔲 User dashboard
🔲 Admin panel

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Bootstrap 5 Documentation](https://getbootstrap.com/)
- [react-bootstrap Documentation](https://react-bootstrap.github.io/)
- [react-i18next Documentation](https://react.i18next.com/)

## 🐛 Troubleshooting

### Port Already in Use

If port 5173 is already in use:

```bash
# Find process using port 5173
lsof -i :5173

# Kill the process
kill -9 <PID>

# Or change port in vite.config.ts
```

### Hot Module Replacement Not Working

```bash
# Clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

### Build Errors

```bash
# Clear dependencies and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📝 License

MIT

## 👥 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

**Built with ❤️ by SnailMarketplace Team**
