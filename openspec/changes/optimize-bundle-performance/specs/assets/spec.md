# Asset Optimization

**Status**: Proposed  
**Component**: Assets & Media  
**Priority**: Medium

## Overview

Optimize images, fonts, and static assets to reduce page load times and improve Core Web Vitals.

## ADDED Requirements

### Requirement: Image Optimization
The system SHALL automatically optimize images for web delivery using modern formats and compression.

#### Scenario: Automatic format conversion
- **WHEN** image is served to browser
- **THEN** convert to AVIF or WebP if supported
- **AND** fallback to JPEG/PNG for older browsers
- **AND** reduce file size by 50-80%

#### Scenario: Responsive images
- **WHEN** image displayed on different screen sizes
- **THEN** serve appropriately sized version
- **AND** use srcset for multiple resolutions
- **AND** prevent oversized downloads

### Requirement: Lazy Loading Strategy
The system SHALL defer loading of below-fold content until needed.

#### Scenario: Below-fold image loading
- **WHEN** image is below viewport
- **THEN** defer loading until user scrolls near
- **AND** show placeholder during load
- **AND** prevent layout shift

#### Scenario: Priority image loading
- **WHEN** image is above-fold or critical
- **THEN** load immediately with high priority
- **AND** prevent lazy loading
- **AND** optimize for LCP metric

### Requirement: Font Optimization
The system SHALL optimize web font loading to minimize render blocking and layout shift.

#### Scenario: Font subsetting
- **WHEN** web font is loaded
- **THEN** include only needed character sets
- **AND** use font-display: swap
- **AND** preload critical fonts

#### Scenario: System font fallback
- **WHEN** custom font loading
- **THEN** show system font immediately
- **AND** swap to custom when loaded
- **AND** minimize layout shift with size-adjust

### Requirement: Core Web Vitals Targets
The system SHALL meet Google's Core Web Vitals thresholds for good user experience.

#### Scenario: Largest Contentful Paint
- **WHEN** page loads
- **THEN** LCP occurs within 2.5 seconds
- **AND** largest element optimized
- **AND** critical resources prioritized

#### Scenario: Cumulative Layout Shift
- **WHEN** page renders
- **THEN** CLS score below 0.1
- **AND** all images have dimensions
- **AND** no content shifting during load

## Image Optimization

### 1. Next.js Image Component

**Before**:
```typescript
<img src="/logo.png" alt="Logo" />
```

**After**:
```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority // For above-fold images
/>
```

**Benefits**:
- Automatic WebP/AVIF conversion
- Responsive images
- Lazy loading
- Blur placeholder
- Prevents layout shift

### 2. Image Configuration

```typescript
// next.config.ts
export default {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};
```

### 3. Lazy Loading Strategy

**Above-fold** (priority):
```typescript
<Image src="/hero.jpg" priority width={1200} height={600} />
```

**Below-fold** (lazy):
```typescript
<Image 
  src="/chart.png" 
  loading="lazy"
  width={800} 
  height={400}
/>
```

**Custom lazy loading**:
```typescript
import { useLazyLoad } from '@/hooks/useLazyLoad';

function Dashboard() {
  const { ref, isVisible } = useLazyLoad();

  return (
    <div ref={ref}>
      {isVisible && (
        <Image src="/heavy-chart.png" width={800} height={600} />
      )}
    </div>
  );
}
```

### 4. Responsive Images

```typescript
<Image
  src="/banner.jpg"
  alt="Banner"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  style={{ objectFit: 'cover' }}
/>
```

### 5. Blur Placeholder

**Static import** (automatic blur):
```typescript
import heroImage from '@/public/hero.jpg';

<Image
  src={heroImage}
  alt="Hero"
  placeholder="blur"
/>
```

**Dynamic URL** (custom blur):
```typescript
<Image
  src="/api/images/dynamic.jpg"
  alt="Dynamic"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

## SVG Optimization

### 1. Inline SVGs

For icons and small SVGs:
```typescript
// src/components/icons/Logo.tsx
export function Logo() {
  return (
    <svg viewBox="0 0 100 100" className="w-8 h-8">
      <path d="..." />
    </svg>
  );
}
```

### 2. SVGO Configuration

```json
// svgo.config.json
{
  "plugins": [
    {
      "name": "preset-default",
      "params": {
        "overrides": {
          "removeViewBox": false,
          "cleanupIds": false
        }
      }
    }
  ]
}
```

## Font Optimization

### 1. Next.js Font Optimization

```typescript
// src/app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

### 2. Font Subsetting

Only include characters you need:
```typescript
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // Only weights you use
});
```

### 3. Preload Critical Fonts

```typescript
// src/app/layout.tsx
export default function RootLayout() {
  return (
    <html>
      <head>
        <link
          rel="preload"
          href="/fonts/custom-font.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## Static Asset Optimization

### 1. Compression

Enable compression in production:
```typescript
// next.config.ts
export default {
  compress: true, // Gzip compression
};
```

### 2. Asset Organization

```
public/
  images/
    optimized/       # Pre-optimized images
    raw/            # Original images (optimize before deploying)
  icons/
    *.svg           # Optimized SVGs
  fonts/
    *.woff2         # Only WOFF2 format (best compression)
```

### 3. Image Format Guidelines

| Use Case | Format | Quality |
|----------|--------|---------|
| Photos | AVIF > WebP > JPEG | 75-85 |
| Graphics | SVG > PNG | N/A |
| Icons | SVG inline | N/A |
| Thumbnails | WebP | 60-75 |
| High-res | AVIF | 80-90 |

## Loading Strategies

### 1. Critical Images

```typescript
// Hero images, logos
<Image src="/hero.jpg" priority />
```

### 2. Above-Fold Content

```typescript
// Visible without scrolling
<Image src="/banner.jpg" loading="eager" />
```

### 3. Below-Fold Content

```typescript
// Requires scrolling
<Image src="/footer-image.jpg" loading="lazy" />
```

### 4. Modal/Drawer Images

```typescript
// Only load when modal opens
const [modalOpen, setModalOpen] = useState(false);

{modalOpen && <Image src="/modal-content.jpg" />}
```

## Performance Targets

| Metric | Current | Target |
|--------|---------|--------|
| Largest Contentful Paint | Unknown | <2.5s |
| Cumulative Layout Shift | Unknown | <0.1 |
| Total image size | Unknown | <500KB per page |
| Format adoption | JPEG/PNG | 80% AVIF/WebP |

## Implementation Checklist

### Phase 1: Critical Images
- [ ] Replace `<img>` with `<Image>` in above-fold content
- [ ] Add proper width/height to prevent CLS
- [ ] Configure Next.js image optimization
- [ ] Test on various devices

### Phase 2: All Images
- [ ] Audit all image usage
- [ ] Replace remaining `<img>` tags
- [ ] Add responsive sizes
- [ ] Implement lazy loading

### Phase 3: Advanced
- [ ] Add blur placeholders
- [ ] Optimize fonts
- [ ] Implement progressive loading
- [ ] Set up image CDN (if needed)

## Testing

1. **Visual Regression**:
   - Images render correctly
   - No broken images
   - Responsive sizes work

2. **Performance**:
   - Lighthouse score improvement
   - Network tab shows optimized formats
   - Lazy loading works correctly

3. **Core Web Vitals**:
   - LCP improved
   - CLS <0.1
   - FCP <1.8s

## Monitoring

- Track image load times
- Monitor format adoption (AVIF/WebP %)
- Alert on large images (>500KB)
- Track Core Web Vitals

## Common Pitfalls

1. **Missing Dimensions**: Always provide width/height
2. **Priority Overuse**: Only 2-3 images should have `priority`
3. **External Images**: Configure `remotePatterns` in next.config
4. **SVG in Image**: Use inline SVG for icons, Image for photos

## Migration Example

**Before** (`src/components/dashboard/Header.tsx`):
```typescript
export function Header() {
  return (
    <header>
      <img src="/logo.png" alt="Logo" className="h-10" />
      <img src="/avatar.jpg" alt="Avatar" className="w-8 h-8" />
    </header>
  );
}
```

**After**:
```typescript
import Image from 'next/image';

export function Header() {
  return (
    <header>
      <Image 
        src="/logo.png" 
        alt="Logo" 
        width={120} 
        height={40} 
        priority 
      />
      <Image 
        src="/avatar.jpg" 
        alt="Avatar" 
        width={32} 
        height={32}
        className="rounded-full"
      />
    </header>
  );
}
```

## References

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
- [Web.dev Image Performance](https://web.dev/fast/#optimize-your-images)
