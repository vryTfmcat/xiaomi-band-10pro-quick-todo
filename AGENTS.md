# Quick todo prototype boundaries

- Keep the life-log app unchanged. Reuse its pinned build tooling only; never use WorkBuddy implementation or signing keys.
- This app has its own package, signing identity and storage key. Do not reuse real device data.
- No real device install, production service change or real Vault write without explicit authorization.
- Do not equate compilation, isolated tests or screenshots with device runtime validation.
- No phone/desktop transport is implemented in this prototype. Keep local logs intact, reject writes on storage errors or capacity; never silently clear.
