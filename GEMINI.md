# CEISH Espoch Frontend - Gemini CLI Context

This project is a modern Angular application designed for the medical and ethical research evaluation platform (CEISH). It follows a strict **Clean Architecture** and **Domain-Driven Design (DDD)** pattern.

## Project Overview

- **Main Technology:** Angular 20
- **Language:** TypeScript
- **Styling:** SCSS (Sass)
- **Architecture:** Clean Architecture (Domain, Application, Infrastructure, Presentation)

## Directory Structure & Architecture

The project is located in the `ceish-espoch-frontend/` directory.

### 1. Domain Layer (`src/app/features/*/domain`)
- **Entities:** Business objects (e.g., `user.entity.ts`).
- **Repository Ports:** Interfaces defining the contracts for data access (e.g., `auth-repository.port.ts`).
- **Value Objects:** Objects that represent a descriptive aspect of the domain but have no identity (e.g., `email.vo.ts`).
- **Rules:** Business rules and logic.

### 2. Application Layer (`src/app/features/*/application`)
- **Use Cases:** Orchestrate the flow of data to and from the domain layer (e.g., `register-user.use-case.ts`).
- **Factories/Strategies:** Patterns used to create objects or define algorithms.

### 3. Infrastructure Layer (`src/app/features/*/infrastructure`)
- **Repositories:** Implementations of the Repository Ports (e.g., `auth-http.repository.ts`). Currently, some implementations use `localStorage` for mocking/testing.
- **Mappers:** Convert data between different layers (e.g., DTO to Entity).
- **Services:** External services integration.

### 4. Presentation Layer (`src/app/features/*/presentation`)
- **Components:** UI components.
- **Pages:** Routed components.
- **Modules/Routing:** Feature-specific configuration.

### 5. Core & Shared
- **Core:** Global singleton services, interceptors, guards, and cross-cutting concerns.
- **Shared:** Reusable UI components, directives, pipes, and common models.

## Development Conventions

### Naming Standards
- **Use Cases:** `*.use-case.ts`
- **Repository Ports (Interfaces):** `*-repository.port.ts`
- **Repository Implementations:** `*-http.repository.ts`
- **Entities:** `*.entity.ts`
- **Mappers:** `*.mapper.ts`
- **Value Objects:** `*.vo.ts`

### Best Practices
- **Dependency Inversion:** Use cases should depend on Repository Ports (interfaces), not implementations.
- **Reactive Programming:** Extensive use of RxJS for asynchronous operations.
- **Modularization:** Features are isolated and lazy-loaded via `AppRoutingModule`.

## Building and Running

Commands should be executed within the `ceish-espoch-frontend/` directory.

- **Start Development Server:** `npm start` or `ng serve`
- **Build for Production:** `npm run build` or `ng build`
- **Run Unit Tests:** `npm test` or `ng test`
- **Linting:** `ng lint` (if configured)

## Known Discrepancies

- **Root vs. Sub-project:** There is a `package.json` in the project root with Angular 17 dependencies, while the active project in `ceish-espoch-frontend/` uses Angular 20. Always prioritize the configuration within the `ceish-espoch-frontend/` directory.
- **NGRX:** Root dependencies suggest NGRX usage, but the feature modules in `ceish-espoch-frontend/` are currently using a more service-based state management approach.
