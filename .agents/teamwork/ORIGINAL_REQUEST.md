# Original User Request

## Initial Request — 2026-10-30T07:39:49Z

Operate as a multidisciplinary product transformation team (Chief Product Designer, Principal UI/UX Designer, Senior Mobile Application Architect, Design Systems Architect, Mobile Interaction Designer, User Experience Researcher, React Native and Expo Specialist, Mobile Performance Engineer, Accessibility Specialist, Mobile Security Engineer, Product Quality Assurance Engineer, Product Strategy Consultant) to transform the existing WhereReady Solar OS Expo / React Native mobile application into a world-class premium mobile SaaS product for solar businesses, vendors, and EPC companies.

Integrity mode: development

## Verification Resources
- Existing repository build, lint, type-check, and test scripts located in package manifests and configuration files across the codebase, along with local environment setup for running and verifying the mobile application.

## Requirements

### R1. Codebase Discovery, Screen Inventory & Design System Foundation
Conduct a complete investigation of the existing Expo mobile application without modifying backend architecture or breaking API contracts, producing structured inventory and audit documentation in `/docs/mobile-product-audit.md`, `/docs/mobile-screen-inventory.md`, and `/docs/mobile-ux-problems.md`. Establish a distinctive, professional design system in `/docs/mobile-design-system.md` with reusable tokens for colors (preserving WhereReady branding with semantic statuses), typography scale with tabular numerals, consistent spacing scale, shape/elevation hierarchy, unified iconography, light and dark theme support, and complete component states (default, active, focused, pressed, disabled, loading, success, error) before screen styling.

### R2. Mobile Information Architecture, Navigation & Business Command Dashboard
Redesign the mobile information architecture and navigation for mobile ergonomics, supporting predictable tab/stack navigation, Android hardware back behaviour, safe areas, role-based access, and authorized global search and quick actions. Transform the main dashboard into a business command centre providing role-personalized operational visibility (KPIs, active projects, sales overview, financial summaries, pending/overdue milestones, team activity, and quick actions) using progressive disclosure and real authorized data without fake statistics.

### R3. End-to-End Module, Screen & Workflow Transformation
Inspect and redesign every existing module, screen, and sub-screen (including Leads/CRM, Project Management, Inventory Management, Installation Management, Staff Management, and Financial/Payment modules) tailored to role-specific tasks while maintaining design system consistency. Implement deliberate application state designs for every screen (loading skeletons, informative empty states with primary actions, human-readable error recovery, offline resilience, partial data handling, and graceful session expiration) and optimize mobile data entry forms with native pickers, logical keyboard handling, field validation, and unsaved change protection.

### R4. Native Android Interactions, Performance & Layout Validation
Deliver a fluid native Android experience with purposeful gestures, native haptics, responsive layouts across diverse screen sizes (handling notches, dynamic font scaling, long strings, keyboard open), and proper permission handling for camera and document uploads. Audit and optimize application performance, list virtualization, memoization, API caching/debounce, startup time, and memory usage without adding unnecessary packages.

### R5. Comprehensive Quality Assurance, Validation & Transformation Reporting
Validate all major user journeys and role-based permissions against functional regressions, simulating edge cases (offline/slow network, API failures, expired sessions, duplicate submissions) and running TypeScript checks, linting, and build verification. Capture actual before-and-after screenshots from the running application on devices/emulators to evaluate visual quality across established quality dimensions (target score 9/10), maintaining `/docs/mobile-transformation-plan.md`, `/docs/mobile-transformation-progress.md`, and `/docs/mobile-transformation-testing.md`, and delivering a comprehensive final completion report covering product audit, design transformation, screen modifications, engineering changes, test results, visual comparisons, and readiness assessment.

## Acceptance Criteria

### Audit & Design System
- [ ] Complete mobile codebase discovery and screen inventory are documented in `/docs/mobile-product-audit.md`, `/docs/mobile-screen-inventory.md`, and `/docs/mobile-ux-problems.md`.
- [ ] Design system tokens (colors, typography, spacing, elevation, semantic statuses, component states) and theme support are established in `/docs/mobile-design-system.md` and applied across reusable components.
- [ ] No existing modules, backend API contracts, or role-based access controls are broken or replaced with static mockups or dummy data.

### Navigation & Dashboard
- [ ] Navigation is structured for mobile usability with clear active states, consistent Android hardware back handling, and unsaved form protection.
- [ ] Role-personalized business command dashboard displays real, authorized operational summaries (KPIs, active projects, sales, finance, overdue tasks, quick actions) without visual clutter or fake statistics.
- [ ] Global search and quick actions operate only on authorized entities and permissions.

### Module Redesign & State Handling
- [ ] Every existing module and submodule (Leads/CRM, Projects, Inventory, Installation, Staff, Finance, and other discovered screens) is redesigned with domain-specific information architecture.
- [ ] Every interactive screen handles all core states: loading (skeletons/indicators), empty states (guidance and actions), error states (human-readable with retry), offline/unstable network, partial data, and session expiration.
- [ ] Mobile forms use appropriate native controls (pickers, numeric/phone/email keyboards), logical focus handling, validation, and keyboard-avoiding layouts.

### Android Experience & Performance
- [ ] Interface renders without horizontal clipping, overflow, or overlapping elements across small, standard, and large Android screen sizes and dynamic font settings.
- [ ] Performance optimizations (list virtualization, API debouncing, caching, memoization) ensure smooth scrolling and responsive transitions without memory leaks.
- [ ] Gestures, transitions, camera capture, file upload, and native haptic feedback function smoothly without intrusive vibrations or navigation traps.

### Testing & Deliverables
- [ ] TypeScript checks, linting, and build verification pass without new transformation-related errors or functional regressions.
- [ ] Core business workflows and role permissions are verified through layered functional testing and simulated network failure states.
- [ ] Transformation progress and test tracking are maintained in `/docs/mobile-transformation-plan.md`, `/docs/mobile-transformation-progress.md`, and `/docs/mobile-transformation-testing.md`.
- [ ] Final deliverables report is produced with comprehensive product audit, screen-by-screen before-and-after screenshots from the running application, engineering summary, test logs, and readiness assessment.
