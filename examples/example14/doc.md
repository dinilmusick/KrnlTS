# Example 14: Endpoint Access Control Test

This example verifies the functionality of port-based endpoint access control policies in Krnl.

## Features Verified
1. **Internal Endpoints**: Accessible only to registered internal service ports.
2. **External Free Endpoints**: Accessible to all.
3. **External Keyed Endpoints**: Accessible only with valid `x-krnl-access-key`.
4. **Manual Policy Endpoints**:
   - `allow`: Unconditional pass for listed ports.
   - `allow_with_key`: Pass if key matches.
   - `forbid`: Hard block for listed ports.
   - `default_connection_behaviour`: Strict enforcement for unlisted ports.

## How to Run
```bash
node run_test.js
```
