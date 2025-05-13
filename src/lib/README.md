
# Library Directory

This directory contains shared utilities, helpers, and common code used across the application.

## Contents

- `api/` - API client and related utilities
- `hooks/` - Custom React hooks
- `utils/` - General utility functions
  - `combatUtils.ts` - Combat-related calculations and logic
  - `questUtils.ts` - Quest generation and management

## Best Practices

1. Keep utility functions small and focused
2. Write thorough tests for utility functions
3. Document complex functions with JSDoc comments
4. Use TypeScript for better type safety and IDE support

## Project Architecture

As part of the refactoring, we've organized the code into a feature-based structure:

- `src/features/` - Contains feature-specific code organized by domain
  - `combat/` - Combat system, enemies, and battle mechanics
  - `exploration/` - Map exploration, location discovery, and walking
  - `inventory/` - Item management, equipment, and storage
  - `quests/` - Quest system, rewards, and progression
  - `user/` - User profile, authentication, and user settings
- `src/lib/` - Contains shared utilities and code used across features
- `src/components/` - Contains shared UI components
- `src/context/` - Contains global context providers

Each feature folder contains:
- `components/` - React components specific to the feature
- `context/` - Context providers for feature-specific state
- `hooks/` - Custom hooks related to the feature
- `types/` - TypeScript interfaces and types
- `utils/` - Utility functions specific to the feature
