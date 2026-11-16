# HTTPS development on a phone

AudioWorklet requires a secure context. An HTTP LAN address is not a secure context, even when `npm run dev` works on the development PC.

On Windows, run once in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup-dev-https.ps1
npm run dev:https
```

The script creates a local development CA and a server certificate for localhost and the PC's current IPv4 addresses. The CA certificate, server private key, and password are stored outside the repository in `%LOCALAPPDATA%\chris-page\dev-https`. Never share the `.pfx` or password. The CA private key is not exported.

Copy only `development-ca.cer` to the phone over a trusted connection and install it as a trusted CA using the phone's certificate settings. On iOS, the installed certificate must also be enabled under Settings > General > About > Certificate Trust Settings. On Android, the exact installation steps depend on the device. Trusting a CA has security implications; use it only on devices you control and remove it when finished.

Open the **HTTPS Network URL** printed by Vite on the phone. The PC and phone must be able to reach each other, and the firewall must allow the Vite port. The development server listens on the network, so use it only on a trusted network and stop it when finished. Do not use the HTTP Network URL. For testing on the PC without trusting a certificate, `npm run dev` and its `http://localhost:3000` URL continue to work.

If the PC's network IP changes, remove the old development CA from all test devices, back up or remove the development certificate directory, then run the setup script again and install the new CA. Do not regenerate certificates while an HTTPS server is running.
