# Workspace Storage Architecture Domain

This directory contains the canonical specifications, architecture guidelines, and operational procedures for the **Workspace Storage Architecture Specification**.

## Structure
- [`SKILL.md`](./SKILL.md): Comprehensive skill defining the `User` $\to$ `AppUserContext` $\to$ `Workspace` storage hierarchy, `WorkspaceStorageAdapter` contract (Local, Google Drive, OneDrive, Supabase, Firebase), provider-independent `WorkspaceFS`, and high-reliability `SyncEngine`.
