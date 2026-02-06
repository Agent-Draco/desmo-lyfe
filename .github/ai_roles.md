# AI Roles and Responsibilities

## Overview
This document defines the specific roles and responsibilities of each AI agent working on the Asterisk Portal project. Each AI has distinct expertise and should be tagged appropriately for their domain.

---

## 🎯 BlackBox - New Feature Foundation (Foundationer)
**Primary Role**: New feature development and architectural foundation

### Responsibilities:
- **Feature Architecture**: Design and implement new features from scratch
- **Foundation Building**: Create the underlying structure for new functionality
- **Component Creation**: Build reusable components and hooks
- **API Integration**: Set up new external service integrations
- **Database Schema**: Design and implement new database tables/migrations
- **Type Definitions**: Create TypeScript interfaces and types
- **Initial Implementation**: Write the first version of new features

### When to Tag @BlackBox:
- New feature requests that don't exist yet
- Creating new components, hooks, or utilities
- Setting up new API integrations
- Database schema changes
- Architectural decisions for new functionality
- Creating foundation code that others will build upon

### Expertise Areas:
- API integration patterns
- State management setup
- Feature planning and implementation

---

## 🔧 Windsurf Cascade - Error Fixing
**Primary Role**: Bug resolution and error handling

### Responsibilities:
- **Error Resolution**: Fix TypeScript compilation errors
- **Runtime Bug Fixes**: Resolve application runtime issues
- **Performance Optimization**: Fix performance bottlenecks
- **Build Issues**: Resolve build and deployment problems
- **Testing Fixes**: Fix failing tests and test infrastructure
- **Code Quality**: Resolve linting and code quality issues
- **Debugging**: Systematic error identification and resolution

### When to Tag @WindsurfCascade:
- Performance issues
- Test failures
- Linting errors
- Any broken functionality

### Expertise Areas:
- TypeScript error resolution
- React debugging
- Performance profiling
- Test framework debugging
- Error handling patterns

---

## 🌐 Google Jules - Integration Management & AI Flows
**Primary Role**: External integrations and AI workflow orchestration

### Responsibilities:
- **API Integration**: Manage external service connections
- **AI Service Integration**: Implement AI/ML service integrations
- **Data Flow Design**: Design data flow between services
- **Authentication**: Handle OAuth and API authentication
- **Webhook Management**: Set up and manage webhooks
- **Third-party Services**: Integrate with external platforms
- **AI Pipeline**: Design and implement AI processing pipelines

### When to Tag @GoogleJules:
- New API integrations (Spoonacular, Google Vision, Gemini, etc.)
- OAuth/authentication flows
- Webhook implementations
- AI service integrations
- Data pipeline design
- External service connections
- API error handling and retry logic

### Expertise Areas:
- REST API integration
- OAuth 2.0 flows
- Webhook management
- AI service APIs (Google, OpenAI, etc.)
- Data transformation pipelines
- Error handling for external services

---

## 💻 ChatGPT Codex - Logic Implementation
**Primary Role**: Business logic implementation and feature building

### Responsibilities:
- **Business Logic**: Implement core application logic
- **Feature Implementation**: Build complete features from specifications
- **Algorithm Development**: Implement complex algorithms and rules
- **Data Processing**: Handle data transformation and processing
- **State Management**: Implement complex state logic
- **User Interactions**: Build user interaction flows
- **Validation Logic**: Implement form validation and business rules

### When to Tag @ChatGPTCodex:
- Complex business logic implementation
- Feature completion from partial implementations
- Algorithm development
- Data processing requirements
- State management complexity
- User flow implementation
- Business rule implementation

### Expertise Areas:
- React hooks and state management
- Business logic implementation
- Algorithm design
- Data structures and processing
- Form validation
- User interaction patterns

---

## 🎨 Lovable - UI/UX and Build Issues
**Primary Role**: User interface, user experience, and build system management

### Responsibilities:
- **UI/UX Implementation**: Build and refine user interfaces
- **Component Styling**: Implement design systems and styling
- **Responsive Design**: Ensure mobile and desktop compatibility
- **Build System**: Manage Vite, bundling, and deployment
- **Accessibility**: Implement ARIA and accessibility features
- **Animation**: Implement smooth transitions and animations
- **Design System**: Maintain and extend component libraries

### When to Tag @Lovable:
- UI/UX improvements and fixes
- Styling issues and design implementation
- Responsive design problems
- Build and deployment issues
- Accessibility improvements
- Animation and transition work
- Component library maintenance

### Expertise Areas:
- React component styling
- Tailwind CSS and design systems
- Responsive design principles
- Vite build system
- Accessibility (WCAG) standards
- Framer Motion animations
- Component library patterns

---

## 🤝 Collaboration Guidelines

### Tagging Protocol:
1. **Single Responsibility**: Tag the most appropriate AI for the task
2. **Cross-Domain Issues**: If multiple domains are involved, tag the primary AI first
3. **Escalation**: If an AI cannot resolve an issue, they should tag the appropriate specialist
4. **Handoff**: When completing work that touches another domain, notify the relevant AI

### Communication Flow:
1. **Issue Identification**: Anyone can identify issues and tag appropriate AI
2. **Work Assignment**: Tagged AI takes ownership of the issue
3. **Progress Updates**: Regular updates in `ai_comments.md`
4. **Completion**: Mark as complete and notify any dependent AIs
5. **Documentation**: Update relevant documentation files

### Decision Making:
- **Architecture Decisions**: @BlackBox leads with input from others
- **Error Resolution**: @WindsurfCascade has final say on error handling approaches
- **Integration Standards**: @GoogleJules defines integration patterns
- **Logic Implementation**: @ChatGPTCodex determines business logic approaches
- **UI/UX Standards**: @Lovable defines user experience standards

---

## 📋 Task Assignment Matrix

| Task Type | Primary AI | Secondary AI | Notes |
|-----------|-------------|---------------|-------|
| New Feature | @BlackBox | @ChatGPTCodex | Foundation then implementation |
| Bug Fix | @WindsurfCascade | Domain-specific | Error resolution then domain expertise |
| API Integration | @GoogleJules | @BlackBox | Integration then foundation |
| UI Implementation | @Lovable | @BlackBox | UI then component structure |
| Logic Implementation | @ChatGPTCodex | @WindsurfCascade | Logic then error handling |
| Build Issues | @Lovable | @WindsurfCascade | Build then dependency issues |

---

## 🔄 Workflow Examples

### Example 1: New Feature Request
```
User: "Add barcode scanning feature"
→ Tag @BlackBox for architecture
→ @BlackBox creates foundation components
→ Tag @GoogleJules for camera API integration
→ @GoogleJules implements barcode scanning
→ Tag @Lovable for UI implementation
→ @Lovable creates scanning interface
→ Tag @ChatGPTCodex for business logic
→ @ChatGPTCodex implements item addition logic
```

### Example 2: Bug Fix
```
User: "Login button not working"
→ Tag @WindsurfCascade for debugging
→ @WindsurfCascade identifies TypeScript error
→ If it's a logic issue: @ChatGPTCodex
→ If it's a UI issue: @Lovable
→ If it's an integration issue: @GoogleJules
```

---

## 📝 Notes
- Each AI should document their work in `ai_comments.md`
- Use this file to determine the correct AI to tag
- When in doubt, tag the AI whose primary responsibility matches the core issue
- Collaboration is encouraged - AIs should work together on complex issues
