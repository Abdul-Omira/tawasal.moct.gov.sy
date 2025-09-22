# Development Guide

## Overview

This guide covers the development workflow, coding standards, testing procedures, and contribution guidelines for the Ministry Platform project.

## Getting Started

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **PostgreSQL**: 16.0 or higher
- **Redis**: 7.0 or higher
- **Git**: 2.30.0 or higher
- **Docker**: 20.10.0 or higher (optional)

### Development Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ministry-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create database
   createdb ministry_platform
   
   # Run migrations
   npm run db:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev:all
   ```

## Project Structure

```
ministry-platform/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utility libraries
│   │   ├── types/         # TypeScript type definitions
│   │   └── locales/       # Internationalization files
│   └── public/            # Static assets
├── server/                # Backend Node.js application
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic services
│   ├── middleware/        # Express middleware
│   ├── database/          # Database layer
│   └── security/          # Security utilities
├── shared/                # Shared code between client and server
│   └── schema.ts          # Database schema definitions
├── tests/                 # Test files
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   ├── e2e/              # End-to-end tests
│   └── performance/       # Performance tests
├── docs/                  # Documentation
├── monitoring/            # Monitoring configuration
├── k8s/                   # Kubernetes manifests
└── scripts/               # Utility scripts
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode in `tsconfig.json`
- Use explicit types instead of `any`
- Prefer interfaces over types for object shapes
- Use enums for constants

```typescript
// Good
interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

// Bad
const user: any = {
  id: 1,
  username: 'john'
};
```

### React Components

- Use functional components with hooks
- Use TypeScript for props and state
- Prefer composition over inheritance
- Use meaningful component names
- Extract reusable logic into custom hooks

```typescript
// Good
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'small' | 'medium' | 'large';
  onClick: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  onClick,
  children
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

### API Routes

- Use RESTful conventions
- Include proper error handling
- Use middleware for common functionality
- Validate input data
- Include proper HTTP status codes

```typescript
// Good
router.post('/api/forms', 
  validateFormData,
  requirePermission(PERMISSIONS.CREATE_FORMS),
  async (req: Request, res: Response) => {
    try {
      const form = await storage.createForm(req.body);
      res.status(201).json(form);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create form' });
    }
  }
);
```

### Database

- Use Drizzle ORM for database operations
- Define schemas in `shared/schema.ts`
- Use transactions for complex operations
- Include proper error handling
- Use prepared statements

```typescript
// Good
export const createUser = async (userData: CreateUserData) => {
  return await db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values(userData).returning();
    await tx.insert(auditLogs).values({
      action: 'USER_CREATED',
      userId: user.id,
      details: { username: user.username }
    });
    return user;
  });
};
```

## Testing

### Unit Tests

- Test individual functions and components
- Use Jest for unit testing
- Aim for 90% code coverage
- Mock external dependencies
- Test edge cases and error conditions

```typescript
// Example unit test
describe('UserService', () => {
  it('should create user with valid data', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };

    const user = await userService.createUser(userData);
    
    expect(user).toBeDefined();
    expect(user.username).toBe('testuser');
    expect(user.email).toBe('test@example.com');
  });

  it('should throw error for invalid email', async () => {
    const userData = {
      username: 'testuser',
      email: 'invalid-email',
      password: 'password123'
    };

    await expect(userService.createUser(userData))
      .rejects.toThrow('Invalid email format');
  });
});
```

### Integration Tests

- Test API endpoints
- Test database operations
- Use test database
- Test authentication and authorization
- Test error handling

```typescript
// Example integration test
describe('Forms API', () => {
  it('should create form with valid data', async () => {
    const formData = {
      title: 'Test Form',
      description: 'A test form',
      components: []
    };

    const response = await request(app)
      .post('/api/forms')
      .set('Authorization', `Bearer ${authToken}`)
      .send(formData)
      .expect(201);

    expect(response.body.title).toBe('Test Form');
  });
});
```

### End-to-End Tests

- Test complete user workflows
- Use Playwright for E2E testing
- Test across different browsers
- Test responsive design
- Test accessibility

```typescript
// Example E2E test
test('should complete form creation workflow', async ({ page }) => {
  await page.goto('/form-builder');
  await page.fill('[data-testid="form-title"]', 'Test Form');
  await page.click('[data-testid="save-form-button"]');
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=auth.test.ts
```

## Development Workflow

### Git Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Push and create pull request**
   ```bash
   git push origin feature/new-feature
   ```

4. **Review and merge**
   - Create pull request
   - Request code review
   - Address feedback
   - Merge to main

### Commit Message Convention

Use conventional commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat(auth): add multi-factor authentication
fix(forms): resolve form validation issue
docs(api): update API documentation
test(users): add user service tests
```

### Code Review Process

1. **Self-review**
   - Check code quality
   - Run tests locally
   - Verify functionality
   - Update documentation

2. **Peer review**
   - Review code changes
   - Check for bugs
   - Verify test coverage
   - Suggest improvements

3. **Approval criteria**
   - All tests pass
   - Code follows standards
   - Documentation updated
   - Security considerations addressed

## Debugging

### Frontend Debugging

1. **Browser DevTools**
   - Use React DevTools extension
   - Check console for errors
   - Use Network tab for API calls
   - Use Performance tab for optimization

2. **React Debugging**
   ```typescript
   // Add debug logging
   console.log('Component rendered:', { props, state });
   
   // Use React DevTools profiler
   import { Profiler } from 'react';
   
   <Profiler id="FormBuilder" onRender={onRenderCallback}>
     <FormBuilder />
   </Profiler>
   ```

### Backend Debugging

1. **Node.js Debugging**
   ```bash
   # Start with debugger
   node --inspect server/index.ts
   
   # Use VS Code debugger
   # Set breakpoints in code
   # Use debug console
   ```

2. **Database Debugging**
   ```sql
   -- Enable query logging
   SET log_statement = 'all';
   
   -- Check slow queries
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC;
   ```

3. **API Debugging**
   ```bash
   # Use curl for API testing
   curl -X POST http://localhost:3000/api/forms \
     -H "Content-Type: application/json" \
     -d '{"title": "Test Form"}'
   
   # Use Postman or Insomnia
   # Import API collection
   # Test different scenarios
   ```

## Performance Optimization

### Frontend Optimization

1. **Code Splitting**
   ```typescript
   // Lazy load components
   const FormBuilder = lazy(() => import('./FormBuilder'));
   
   // Use dynamic imports
   const { FormRenderer } = await import('./FormRenderer');
   ```

2. **Memoization**
   ```typescript
   // Memoize expensive calculations
   const expensiveValue = useMemo(() => {
     return calculateExpensiveValue(data);
   }, [data]);
   
   // Memoize callbacks
   const handleClick = useCallback(() => {
     doSomething();
   }, [dependency]);
   ```

3. **Bundle Optimization**
   ```typescript
   // Use tree shaking
   import { specificFunction } from 'large-library';
   
   // Optimize images
   import logo from './logo.png?url';
   ```

### Backend Optimization

1. **Database Optimization**
   ```sql
   -- Add indexes
   CREATE INDEX idx_forms_created_by ON forms(created_by);
   CREATE INDEX idx_submissions_form_id ON form_submissions(form_id);
   
   -- Use prepared statements
   PREPARE get_user AS SELECT * FROM users WHERE id = $1;
   ```

2. **Caching**
   ```typescript
   // Use Redis for caching
   const cachedData = await redis.get('key');
   if (!cachedData) {
     const data = await expensiveOperation();
     await redis.setex('key', 3600, JSON.stringify(data));
   }
   ```

3. **Connection Pooling**
   ```typescript
   // Configure connection pool
   const pool = new Pool({
     max: 20,
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

## Security Best Practices

### Input Validation

```typescript
// Validate input data
const validateFormData = (req: Request, res: Response, next: NextFunction) => {
  const { error } = formSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};
```

### Authentication

```typescript
// Use secure password hashing
const hashedPassword = await bcrypt.hash(password, 12);

// Use secure JWT tokens
const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);
```

### Authorization

```typescript
// Check permissions
const hasPermission = (user: User, permission: string) => {
  return user.permissions.includes(permission) || user.isAdmin;
};
```

### Data Sanitization

```typescript
// Sanitize user input
import DOMPurify from 'dompurify';

const sanitizedHtml = DOMPurify.sanitize(userInput);
```

## Documentation

### Code Documentation

```typescript
/**
 * Creates a new form with the provided data
 * @param formData - The form data to create
 * @param userId - The ID of the user creating the form
 * @returns Promise<Form> - The created form
 * @throws {ValidationError} When form data is invalid
 * @throws {PermissionError} When user lacks permission
 */
export const createForm = async (
  formData: CreateFormData,
  userId: string
): Promise<Form> => {
  // Implementation
};
```

### API Documentation

- Use OpenAPI/Swagger for API docs
- Include request/response examples
- Document error codes
- Include authentication requirements

### README Files

- Include setup instructions
- Document configuration options
- Provide usage examples
- Include troubleshooting guide

## Contributing

### Before Contributing

1. **Read the documentation**
2. **Check existing issues**
3. **Discuss major changes**
4. **Follow coding standards**

### Pull Request Process

1. **Fork the repository**
2. **Create feature branch**
3. **Make changes**
4. **Add tests**
5. **Update documentation**
6. **Submit pull request**

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow the project's values

## Troubleshooting

### Common Issues

1. **Build Errors**
   ```bash
   # Clear node_modules
   rm -rf node_modules package-lock.json
   npm install
   
   # Check TypeScript errors
   npm run type-check
   ```

2. **Test Failures**
   ```bash
   # Run tests with verbose output
   npm test -- --verbose
   
   # Run specific test
   npm test -- --testNamePattern="should create user"
   ```

3. **Database Issues**
   ```bash
   # Check database connection
   npm run db:push
   
   # Reset database
   npm run db:migrate:reset
   ```

### Getting Help

1. **Check documentation**
2. **Search existing issues**
3. **Ask in discussions**
4. **Create new issue with details**

## Resources

### Documentation
- [React Documentation](https://react.dev/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

### Tools
- [VS Code](https://code.visualstudio.com/)
- [Postman](https://www.postman.com/)
- [Docker](https://www.docker.com/)
- [Kubernetes](https://kubernetes.io/)

### Testing
- [Jest Documentation](https://jestjs.io/docs/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
