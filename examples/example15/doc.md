# Example 15: Managed Services Orchestration

This example demonstrates how a Krnl system can manage and orchestrate external micro-server processes.

## Features Demonstrated
1. **Service Registration**: Using `system.registerManagedService()` to define external processes.
2. **Dynamic Port Assignment**: The system automatically assigns free ports to each service.
3. **Sequential Startup**: Services start in the order they are registered.
4. **Startup Synchronization**: Using `waitForStartup: true` to ensure a service is listening on its port before starting the next one.
5. **Environment Injection**: The assigned port is injected into the child process's environment (e.g., `process.env.PORT`).
6. **Graceful Orchestration**: All managed processes are automatically sent `SIGTERM` when the system shuts down.

## How to Run
```bash
node run_test.js
```

## Rationale
In a microservices architecture, certain services (like databases or auth providers) must be ready before dependent services start. KrnlTS provides a built-in mechanism to manage these dependencies without external process managers like PM2 or Docker Compose during development and lightweight deployments.
