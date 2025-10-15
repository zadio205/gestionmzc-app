# Design System

**Status**: Proposed  
**Component**: UI Components  
**Priority**: Medium

## Overview

Create consistent, accessible, and well-documented component library to standardize UI across the application.

## ADDED Requirements

### Requirement: Design Tokens
The system SHALL define design tokens for colors, spacing, typography, and other visual properties.

#### Scenario: Token consistency
- **WHEN** styling components
- **THEN** use design tokens instead of hardcoded values
- **AND** tokens defined in single source of truth
- **AND** tokens exportable to CSS and TypeScript
- **AND** support theming

#### Scenario: Token updates
- **WHEN** design tokens change
- **THEN** automatically update throughout application
- **AND** no manual find/replace needed
- **AND** maintain visual consistency

### Requirement: Primitive Components
The system SHALL provide base UI components (Button, Input, Card, etc.) built with design tokens.

#### Scenario: Component variants
- **WHEN** using primitive component
- **THEN** support multiple variants (primary, secondary, etc.)
- **AND** support multiple sizes (sm, md, lg)
- **AND** support disabled and loading states
- **AND** maintain consistent API

#### Scenario: Accessibility
- **WHEN** component renders
- **THEN** meet WCAG 2.1 AA standards
- **AND** support keyboard navigation
- **AND** include proper ARIA attributes
- **AND** test with screen readers

### Requirement: Pattern Components
The system SHALL provide composed patterns (Form, DataTable, etc.) built from primitives.

#### Scenario: Form pattern
- **WHEN** building form
- **THEN** use Form pattern component
- **AND** handle validation consistently
- **AND** show errors uniformly
- **AND** support all input types

#### Scenario: DataTable pattern
- **WHEN** displaying tabular data
- **THEN** use DataTable pattern
- **AND** support sorting and filtering
- **AND** handle pagination
- **AND** support loading states

### Requirement: Component Documentation
The system SHALL document all design system components in Storybook.

#### Scenario: Component stories
- **WHEN** component exists
- **THEN** create Storybook stories
- **AND** show all variants and states
- **AND** provide interactive playground
- **AND** document props and usage

#### Scenario: Documentation accessibility
- **WHEN** viewing Storybook
- **THEN** see component examples
- **AND** read usage guidelines
- **AND** view accessibility notes
- **AND** copy code snippets

### Requirement: Consistency Enforcement
The system SHALL enforce design system usage throughout the application.

#### Scenario: ESLint rules
- **WHEN** code is written
- **THEN** lint for direct Tailwind usage
- **AND** suggest design system alternative
- **AND** fail CI on violations
- **AND** provide auto-fix where possible

#### Scenario: Component audit
- **WHEN** design system updated
- **THEN** audit component usage
- **AND** identify non-compliant components
- **AND** create migration tasks
- **AND** track adoption metrics

## Design System Structure

```
src/design-system/
  tokens/
    colors.ts           # Color palette
    spacing.ts          # Spacing scale
    typography.ts       # Font scales
    shadows.ts          # Shadow/elevation
    borders.ts          # Border radius, width
    animations.ts       # Transitions, durations
    index.ts           # Export all tokens
  
  primitives/
    Button/
      Button.tsx
      Button.test.tsx
      Button.stories.tsx
      index.ts
    Input/
    Card/
    Modal/
    ... (20+ components)
  
  patterns/
    Form/              # Composed form pattern
    DataTable/         # Table with features
    Navigation/        # Nav patterns
    ... (10+ patterns)
  
  hooks/
    useTheme.ts        # Theme context
    useMediaQuery.ts   # Responsive utilities
  
  index.ts             # Public API
```

## Design Tokens

### Colors

```typescript
// src/design-system/tokens/colors.ts
export const colors = {
  // Brand
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    // ... 900
  },
  
  // Semantic
  success: {
    light: '#10b981',
    DEFAULT: '#059669',
    dark: '#047857',
  },
  error: {
    light: '#ef4444',
    DEFAULT: '#dc2626',
    dark: '#b91c1c',
  },
  
  // Neutral
  gray: {
    50: '#f9fafb',
    // ... 900
  },
} as const;

export type Color = keyof typeof colors;
```

### Spacing

```typescript
// src/design-system/tokens/spacing.ts
export const spacing = {
  0: '0',
  1: '0.25rem',    // 4px
  2: '0.5rem',     // 8px
  3: '0.75rem',    // 12px
  4: '1rem',       // 16px
  6: '1.5rem',     // 24px
  8: '2rem',       // 32px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
} as const;
```

### Typography

```typescript
// src/design-system/tokens/typography.ts
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Roboto Mono', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;
```

## Primitive Components

### Button Component

```typescript
// src/design-system/primitives/Button/Button.tsx
import { forwardRef } from 'react';
import { cn } from '@/shared/utils/cn';

export interface ButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    disabled,
    className,
    children,
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'button',
          `button-${variant}`,
          `button-${size}`,
          loading && 'button-loading',
          className
        )}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    );
  }
);
```

### CSS with Tokens

```css
/* globals.css */
:root {
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --spacing-4: 1rem;
  --border-radius: 0.375rem;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  border-radius: var(--border-radius);
  transition: all 150ms;
}

.button-primary {
  background-color: var(--color-primary);
  color: white;
}

.button-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.button-md {
  padding: var(--spacing-2) var(--spacing-4);
  font-size: 0.875rem;
}
```

## Pattern Components

### Form Pattern

```typescript
// src/design-system/patterns/Form/Form.tsx
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function Form<T extends FieldValues>({
  schema,
  onSubmit,
  children,
}: FormProps<T>) {
  const methods = useForm<T>({
    resolver: zodResolver(schema),
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {children}
      </form>
    </FormProvider>
  );
}

export function FormField({ name, label, ...props }: FormFieldProps) {
  const { register, formState: { errors } } = useFormContext();
  
  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <Input
        id={name}
        {...register(name)}
        error={errors[name]?.message}
        {...props}
      />
    </div>
  );
}
```

## Storybook Configuration

```typescript
// .storybook/main.ts
export default {
  stories: ['../src/**/*.stories.tsx'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  framework: '@storybook/nextjs',
};

// .storybook/preview.tsx
import '../src/app/globals.css';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};
```

### Component Story

```typescript
// src/design-system/primitives/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
  },
};

export const Loading: Story = {
  args: {
    children: 'Loading',
    loading: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};
```

## Usage Example

```typescript
// ❌ Before: Inconsistent, direct Tailwind
<button className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded">
  Click Me
</button>

<button className="bg-blue-600 hover:bg-blue-800 text-white px-3 py-1.5 rounded-md">
  Another Button
</button>

// ✅ After: Consistent, design system
import { Button } from '@/design-system';

<Button variant="primary">Click Me</Button>
<Button variant="primary">Another Button</Button>
```

## Component Checklist

Every design system component should have:
- [ ] TypeScript types
- [ ] Variants and sizes
- [ ] Loading and disabled states
- [ ] Accessibility attributes
- [ ] Unit tests
- [ ] Storybook stories
- [ ] Usage documentation
- [ ] Design token usage

## Migration Strategy

1. **Create design system foundation**
2. **Build primitive components**
3. **Document in Storybook**
4. **Migrate one feature at a time**
5. **Add ESLint rules to enforce usage**
6. **Remove direct Tailwind usage**

## Benefits

- **Consistency**: Same look/feel throughout app
- **Productivity**: Faster development with ready components
- **Maintainability**: Single place to update styles
- **Accessibility**: Built-in a11y standards
- **Documentation**: Self-documenting with Storybook
- **Testing**: Components tested in isolation

## References

- [Storybook Documentation](https://storybook.js.org/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [Tailwind Component Examples](https://tailwindui.com/)
- [Accessible Components](https://www.w3.org/WAI/ARIA/apg/)
