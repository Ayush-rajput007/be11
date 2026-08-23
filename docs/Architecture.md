# Architecture Documentation

## Overview

The `be11` cricket ground booking platform is built with a decoupled monorepo approach split into three core segments:
1. **Frontend**: React application leveraging Feature-based architecture.
2. **Backend**: Node.js Express service configured with modular architecture.
3. **Shared**: Common TypeScript definitions, constant mapping, validation schemas, and lightweight shared utilities.

## Folder Conventions

- All directory names are in lowercase.
- Kebab-case is utilized where appropriate.
- Singular names are used unless the folder holds a natural collection (e.g. `components`, `routes`, `features`).
