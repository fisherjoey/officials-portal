# Contributing to Officials Portal

Thank you for your interest in contributing to Officials Portal! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

1. Check existing issues to avoid duplicates
2. Create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, browser)
   - Screenshots if applicable

### Suggesting Features

1. Check existing issues and discussions
2. Create a new issue or discussion with:
   - Clear description of the feature
   - Use case and benefits
   - Possible implementation approach

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Write/update tests if applicable
5. Ensure code passes linting: `npm run lint`
6. Commit with clear messages
7. Push to your fork
8. Create a Pull Request

#### PR Guidelines

- Reference related issues
- Describe changes clearly
- Include screenshots for UI changes
- Keep PRs focused and reasonably sized
- Ensure CI passes

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local`
4. Run development server: `npm run dev`

## Code Style

- TypeScript for all new code
- Follow existing patterns and conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep components focused and reusable

### File Naming

- Components: PascalCase (`MyComponent.tsx`)
- Utilities: camelCase (`myHelper.ts`)
- Config files: lowercase with dashes (`my-config.ts`)

### Component Structure

```typescript
// Imports
import { useState } from 'react'
import { orgConfig } from '@/config/organization'

// Types
interface MyComponentProps {
  title: string
}

// Component
export default function MyComponent({ title }: MyComponentProps) {
  const [state, setState] = useState(false)

  return (
    <div>
      <h1>{title}</h1>
    </div>
  )
}
```

## Testing

Currently, the project uses manual testing. Contributions to add automated testing are welcome!

## Documentation

- Update README.md for significant changes
- Add JSDoc comments for public functions
- Update inline comments as needed

## Questions?

- Open a Discussion for general questions
- Create an Issue for specific problems
- Check existing issues and discussions first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Officials Portal!
