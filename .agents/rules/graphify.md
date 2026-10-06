---
trigger: always_on
description: Consult the graphify knowledge graph at graphify-out/ for codebase and architecture questions.
---

## Graphify-First Development Rule

For every project-related task, ALWAYS use the project's Graphify knowledge graph as the primary source of codebase context before making decisions, answering architecture questions, or modifying code.

### Mandatory workflow

1. First determine whether the current project has a Graphify knowledge graph.

2. If Graphify is available, consult it BEFORE reading or modifying source files.

3. Use the most relevant Graphify operation for the task:
   - Query: `graphify query "<question>"`
   - Explain a symbol/file/concept: `graphify explain "<symbol>"`
   - Trace relationships: `graphify path "<source>" "<target>"`

4. Use Graphify to understand relevant:
   - files, functions, classes, components, imports, dependencies, API relationships, data flow, module relationships, database/model relationships, related implementations

5. After understanding the relevant architecture through Graphify, inspect only the source files necessary to complete the task.

6. Do not blindly grep/search the entire codebase when Graphify can answer the architectural question.

7. Before modifying existing code, identify:
   - where the functionality currently exists
   - what depends on it
   - what other files may be affected
   - whether an existing implementation can be reused

8. Make the smallest safe change necessary to complete the task.

9. Do not rewrite, duplicate, or replace existing functionality unnecessarily.

10. Preserve the existing project's architecture, coding patterns, naming conventions, API contracts, database relationships, component/module relationships, and existing behavior.

### Graph freshness

If the Graphify graph may be outdated because files have recently changed, first run:
`graphify update .`
Then perform the required Graphify query again. Do NOT blindly trust stale Graphify results.

### Before implementation

For non-trivial tasks, follow this order:
User Request → Graphify Context → Trace Relevant Relationships → Read Relevant Source Files → Understand Existing Implementation → Plan Minimal Change → Implement → Verify Affected Dependencies → Test/Validate

### Important

Graphify is a context and architecture tool, NOT a replacement for reading source code.
Use Graphify to discover and understand relationships, then inspect the actual source code before making changes.
Never invent project architecture when it can be verified through Graphify or the source code.
If Graphify is not installed, unavailable, or the project has no graph yet, continue using normal project inspection methods instead of blocking the task.
For simple tasks where Graphify provides no meaningful additional context, do not waste time performing unnecessary Graphify queries.

The goal is: **UNDERSTAND FIRST → MODIFY SECOND**.
