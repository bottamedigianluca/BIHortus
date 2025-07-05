# Contributing to BiHortus

## 🤝 Welcome Contributors!

We appreciate your interest in contributing to BiHortus! This document provides guidelines for contributing to the project.

## 📋 Code of Conduct

This project follows a Code of Conduct that we expect all contributors to adhere to:

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a welcoming environment
- Report inappropriate behavior

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm 8+
- Git
- SQL Server (for Arca Evolution integration)

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/bihortus.git
   cd bihortus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.template .env
   # Edit .env with your configuration
   ```

4. **Initialize database**
   ```bash
   npm run setup
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🏗️ Architecture Overview

BiHortus is built with:

- **Frontend**: React + TypeScript + Chakra UI
- **Backend**: Node.js + Express + SQLite
- **Integration**: SQL Server (Arca Evolution)
- **Sync**: Cloud sync with encryption
- **Real-time**: Socket.IO for live updates

## 📝 Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow existing code formatting
- Use meaningful variable names
- Add JSDoc comments for functions
- Keep functions small and focused

### Git Workflow

1. Create a feature branch from `develop`
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. Make your changes with clear commits
   ```bash
   git add .
   git commit -m "feat: add bank reconciliation fuzzy matching"
   ```

3. Push and create a Pull Request
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Messages

Follow conventional commit format:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation updates
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/modifications
- `chore:` Maintenance tasks

### Testing

- Write tests for new features
- Ensure existing tests pass
- Add integration tests for API endpoints
- Test with mock and real data

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## 🔍 Areas for Contribution

### High Priority

1. **Machine Learning Enhancements**
   - Improve matching algorithms
   - Add learning from user feedback
   - Pattern recognition for descriptions

2. **Banking API Integrations**
   - Add support for major Italian banks
   - Real-time transaction monitoring
   - Automated import workflows

3. **Advanced Analytics**
   - Predictive cash flow analysis
   - Client behavior insights
   - Risk assessment tools

4. **Mobile Application**
   - React Native companion app
   - Push notifications
   - Approval workflows

### Medium Priority

1. **User Interface Improvements**
   - Enhanced data visualization
   - Better mobile responsiveness
   - Accessibility improvements

2. **Performance Optimizations**
   - Database query optimization
   - Caching improvements
   - Bundle size reduction

3. **Security Enhancements**
   - Multi-factor authentication
   - Advanced audit logging
   - Penetration testing

### Documentation

- API documentation improvements
- User guides and tutorials
- Video demonstrations
- Translation to other languages

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment details**
   - OS and version
   - Node.js version
   - Browser (if frontend issue)

2. **Steps to reproduce**
   - Clear step-by-step instructions
   - Expected vs actual behavior
   - Screenshots/logs if helpful

3. **Additional context**
   - Error messages
   - Configuration details
   - Related issues

## 💡 Feature Requests

For new features:

1. **Check existing issues** to avoid duplicates
2. **Describe the use case** and problem being solved
3. **Propose a solution** if you have ideas
4. **Consider the scope** and complexity

## 🔧 Development Tips

### Database Development

- SQLite for local development
- Use migrations for schema changes
- Test with realistic data volumes
- Document query performance

### API Development

- Follow RESTful conventions
- Include proper error handling
- Add input validation
- Write comprehensive tests

### Frontend Development

- Use TypeScript for components
- Follow React best practices
- Optimize for performance
- Test across browsers

### Arca Integration

- Always use READ-ONLY connections
- Handle connection failures gracefully
- Cache frequently accessed data
- Document database schema dependencies

## 📚 Resources

### Documentation

- [Technical Specifications](TECHNICAL_SPECS.md)
- [Setup Guide](SETUP_COMPLETE.md)
- [Arca Evolution Manual](manuale-arca.txt)

### Tools

- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Node.js Debugging](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [SQL Server Management](https://docs.microsoft.com/en-us/sql/ssms/)

## 🎉 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes for significant contributions
- Project documentation

## 📞 Support

Need help? Reach out:

- **Issues**: GitHub Issues for bugs and features
- **Discussions**: GitHub Discussions for questions
- **Email**: support@bottamedi.com for private inquiries

## 🔄 Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by project maintainers
3. **Testing** in development environment
4. **Documentation** updates if needed
5. **Merge** to develop branch

## 📋 Checklist for Pull Requests

- [ ] Code follows project style guidelines
- [ ] Tests are added/updated and passing
- [ ] Documentation is updated if needed
- [ ] Commit messages follow conventional format
- [ ] PR description explains the changes
- [ ] Related issues are referenced
- [ ] Screenshots for UI changes

Thank you for contributing to BiHortus! 🚀