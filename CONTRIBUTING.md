# Contributing to Abe Garage

Thank you for contributing to Abe Garage.

## Basic Guidelines

- Keep changes focused and understandable.
- Follow the existing coding style and project structure.
- Test your changes before submitting them.
- Never commit passwords, API keys, database credentials, or real `.env` files.
- Communicate with the relevant team members when a change affects shared code or interfaces.

## Git Workflow

- `main`: stable code intended for releases and demonstrations.
- `dev`: integration branch for completed features.
- `feat/<short-description>`: branch for a new feature.
- `fix/<short-description>`: branch for a bug fix.

Create feature and fix branches from `dev`. When your work is ready, open a pull request targeting `dev`.

Changes intended for `main` should be tested before merging.

## Pull Requests

Each pull request should:

1. Have a clear title and description.
2. Explain what changed and why.
3. Reference a related issue when one exists.
4. Include relevant testing information.
5. Identify any known limitations or follow-up work.

Reviewers should check correctness, readability, security, and compatibility with existing code.

## Security

- Keep secrets in environment variables.
- Use parameterized SQL queries.
- Do not expose private customer or employee information through public endpoints.
- Report security concerns privately to the repository maintainers rather than publishing sensitive details in an issue.

## Collaboration

Respect each member's responsibilities, communicate changes that affect shared work, and coordinate before making incompatible changes to shared interfaces or database structures.