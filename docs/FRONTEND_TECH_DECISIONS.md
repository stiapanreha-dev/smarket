# Frontend Technology Decisions

## CSS Framework: Bootstrap 5 vs Tailwind CSS

### Decision: Bootstrap 5 (react-bootstrap)

**Date:** 2025-11-10
**Status:** Approved
**Context:** Choosing CSS framework for SnailMarketplace MVP

---

## Comparison

### Bootstrap 5 ✅ (Selected)

**Pros:**
- **Ready-made components**: Cards, modals, forms, navbars, dropdowns out-of-the-box
- **Faster development**: Less time writing CSS, more time on business logic
- **RTL Support**: Built-in RTL for Arabic (`dir="rtl"` + Bootstrap RTL CSS)
- **Design consistency**: Coherent design system without extra configuration
- **Smaller JSX**: Clean markup without dozens of utility classes
- **Mature ecosystem**: react-bootstrap, bootstrap-icons, extensive documentation
- **Team familiarity**: Most developers know Bootstrap
- **Grid system**: Powerful responsive grid with breakpoints
- **Customization**: SASS variables for theming

**Cons:**
- Less flexible than utility-first approach
- Larger bundle size if not tree-shaken properly
- "Bootstrap look" (can be customized via SASS)

**Example - Product Card:**
```jsx
<Card>
  <Card.Img variant="top" src={product.image} />
  <Card.Body>
    <Card.Title>{product.name}</Card.Title>
    <Card.Text>{product.price}</Card.Text>
    <Button variant="primary">Add to Cart</Button>
  </Card.Body>
</Card>
```

---

### Tailwind CSS ❌ (Not Selected)

**Pros:**
- Highly customizable utility-first approach
- Smaller final bundle (with PurgeCSS)
- No "framework look"
- Modern developer experience

**Cons:**
- **Requires building all components from scratch**: No ready modals, cards, etc.
- **Longer JSX**: `className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"`
- **Slower MVP development**: More time on UI, less on features
- **RTL complexity**: Requires manual RTL configuration and testing
- **Learning curve**: Team needs to learn utility classes
- **Design inconsistency risk**: Without strict guidelines, UI can become inconsistent

---

## Other Framework Considerations

### Material-UI (MUI)
- **Pros**: Google Material Design, rich components
- **Cons**: Opinionated design, larger bundle, steeper learning curve
- **Verdict**: Too opinionated for marketplace, Bootstrap more flexible

### Ant Design
- **Pros**: Enterprise-grade components, great for admin panels
- **Cons**: Chinese design aesthetics, large bundle
- **Verdict**: Better for admin panel (possible future use), not for public marketplace

### Chakra UI
- **Pros**: Modern, accessible, good DX
- **Cons**: Smaller ecosystem, less mature than Bootstrap
- **Verdict**: Interesting but Bootstrap safer for MVP

---

## Technology Stack Summary

### Core
- **React 18**: Latest stable, concurrent rendering, Suspense
- **TypeScript**: Type safety, better DX, fewer runtime errors
- **Vite**: Fast HMR, modern build tool, better than CRA

### UI Layer
- **Bootstrap 5**: CSS framework (rationale above)
- **react-bootstrap**: React components for Bootstrap
- **React Hook Form**: Performant form handling with validation
- **React Icons**: Icon library (Bootstrap Icons + others)

### State Management
- **Zustand**: Lightweight (~1KB), simple API, no boilerplate
  - Chosen over Redux (too much boilerplate for MVP)
  - Chosen over MobX (smaller community)
- **React Query (TanStack Query)**: Server state management
  - Caching, refetching, optimistic updates
  - Perfect for API-heavy marketplace app

### Routing
- **React Router v6**: Industry standard, stable

### API Client
- **Axios**: HTTP client with interceptors for auth tokens

### Additional Libraries
- **date-fns**: Date manipulation (lighter than moment.js)
- **react-i18next**: Internationalization (EN/RU/AR)
- **yup**: Schema validation for forms

---

## Localization Strategy

### RTL Support (Arabic)
```jsx
// Bootstrap RTL CSS loaded conditionally
import 'bootstrap/dist/css/bootstrap.rtl.min.css'; // for Arabic

<html dir="rtl" lang="ar">
  {/* Bootstrap handles RTL automatically */}
</html>
```

### Multi-language
- i18next for translations
- Language switcher in header
- Stored in localStorage + user profile

---

## Bundle Size Targets

| Library | Size (gzipped) |
|---------|----------------|
| React + ReactDOM | ~45 KB |
| Bootstrap CSS | ~25 KB |
| react-bootstrap | ~35 KB |
| Zustand | ~1 KB |
| React Query | ~12 KB |
| React Router | ~10 KB |
| **Total Core** | **~130 KB** |

Target: Keep initial bundle < 200 KB (gzipped)

---

## Development Experience

### Why this stack improves DX:
1. **Vite**: Instant HMR, fast builds
2. **TypeScript**: IntelliSense, catch errors early
3. **React Hook Form**: Less boilerplate than Formik
4. **Zustand**: Simple state without Redux complexity
5. **Bootstrap**: Copy-paste examples, fast prototyping

---

## Future Considerations

### If we outgrow Bootstrap:
- Migrate to Tailwind for full customization
- Build custom design system
- Use CSS-in-JS (Styled Components)

### For admin panel (future):
- Consider Ant Design or MUI for rich data tables
- Bootstrap may not be optimal for complex dashboards

---

## Decision Log

| Date | Decision | Reason |
|------|----------|--------|
| 2025-11-10 | Bootstrap 5 over Tailwind | Faster MVP, RTL support, ready components |
| 2025-11-10 | Zustand over Redux | Less boilerplate for MVP |
| 2025-11-10 | Vite over CRA | Better performance, modern tooling |

---

## References

- [Bootstrap 5 Docs](https://getbootstrap.com/docs/5.3/)
- [react-bootstrap](https://react-bootstrap.github.io/)
- [Bootstrap RTL](https://getbootstrap.com/docs/5.3/getting-started/rtl/)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Query](https://tanstack.com/query/latest)

---

**Approved by:** Tech Lead
**Next Review:** After MVP launch (evaluate if Bootstrap meets scaling needs)
