# 📝 MASTER CONTEXT DOCUMENT: GROOMINGPET PROJECT

This document serves as the master technical reference for developers working on the GroomingPet platform. It compiles system architecture details, environment rules, current VPS infrastructure, recent modifications, and core deployment guides.

---

## 1. Project Overview & Tech Stack
* **Business Model**: Premium mobile pet grooming service operating in Florida, USA (primarily Miami-Dade and Broward counties).
* **UI/UX Aesthetic**: Neo-Brutalist premium style featuring strong 4px dark borders, drop shadows, and clean layouts. Requires parity of data and layout alignment between desktop and mobile versions.
* **Core Tech Stack**:
  * **Framework**: Next.js 15+ (App Router)
  * **Styling**: Tailwind CSS v4 (Vanilla CSS integrations)
  * **Database**: PostgreSQL mapped via Prisma ORM
  * **Internationalization**: Bilingual structure (English/Spanish) using `next-intl`
  * **Authentication**: NextAuth.js (Auth.js v5)

---

## 2. Infrastructure & Live VPS Specifications
* **Host Provider**: Hostinger VPS (KVM 4 VM running Ubuntu/Debian).
* **IP Address**: `2.24.104.9` (accessed via `root` SSH).
* **Production Directory**: `/var/www/groomingpet`
* **Process Manager**: PM2 handles application processes.
  * **PM2 Process Name**: `groomingpet` (runs cluster instances on internal port `3000`).
* **Web Server**: Nginx acts as a reverse proxy, mapping the official domain to port `3000` and serving the `/uploads/` assets folder statically.
* **Official Production Domain**: [https://groomersincathome.com](https://groomersincathome.com)

---

## 3. Critical Services & Environment Config
### A. SMTP Transactional Mail (Gmail)
* **Account**: `groomersincpetspa@gmail.com`
* **Protocol**: Nodemailer SMTP, SSL enabled on port `465`.
* **Credentials**: Authenticated using a 16-digit Google App Password (`--Vhfpabq23821@/Mega1321@--` or environment overrides) to avoid Google `EAUTH` authentication blockages.

### B. Image Storage
* File uploads are saved directly to the VPS NVMe persistent storage disk under `/public/uploads/` instead of an ephemeral cloud storage bucket.
* Nginx serves these images directly for maximum caching efficiency:
  ```nginx
  location /uploads/ {
      alias /var/www/groomingpet/public/uploads/;
      expires 30d;
      add_header Cache-Control "public, no-transform";
  }
  ```

---

## 4. Recent Core Implementations & Fixes

### A. Strict English Notifications
* **Rule**: All outbound notifications (Emails and WhatsApp messages) sent to final customers must be strictly in English, regardless of the browser locale they used to submit their booking.
* **Template Directories**:
  * **Email Templates**: `src/lib/templates/email-en/` (appointment confirmed, etc.)
  * **WhatsApp Templates**: `src/lib/templates/whatsapp-en/` (dynamic WhatsApp API messages)

### B. Global Domain Migration
* The site domain has been updated globally. All references to the old domain `groomersincpetspa.com` have been replaced with the correct production domain: **`groomersincathome.com`**.
* The server and build tasks utilize `NEXT_PUBLIC_SITE_URL` for constructing redirects.

### C. Waiver & Print Agreement Refactoring
* **The Problem**: Previously, printing the contract resulted in CSS tags displaying as literal text on Page 1, a huge distorted logo stretching across Page 2, and form fields squished on Page 3. This was caused by CSS rules trying to override the parent `.admin-scope` elements' `overflow: hidden` and `height: 100vh` attributes using destructive `display: block !important` rules.
* **The Solution**:
  1. **Layout Isolation**: Moved the Waiver print page out of the `/admin` dashboard route group into `/[locale]/admin-print/waiver-template`. Because it's outside `/admin`, it does **not** inherit the sidebar, header bar, or parent dashboard layout wrappers.
  2. **Security**: Protected the route using a layout-level server session validation inside `src/app/[locale]/admin-print/layout.tsx`. Only logged-in admins can access it.
  3. **Aesthetics & Paging**:
     * **1 Pet**: The contract fits on **exactly 1 page** (the print page margins, input boxes, signature lines, and the terms box at `7.2pt` were tightened).
     * **2+ Pets / Blank Contract**: Easily flows into **2 pages**.
     * **No-Break rules**: Applied `.no-break` to major sections (Client info, terms, signatures, and internal boxes) and `.pet-card` to individual pet blocks. Page breaks occur naturally between sections or pets, never splitting signature boxes or tables.

---

## 5. Developer Run & Deploy Workflow

### Local Development Commands
Run these commands from the project root (`e:\PROYECTOS PGRM\GroomingPet`):

* **Typechecking**:
  ```bash
  cmd /c npx tsc --noEmit
  ```
* **Clear Next Cache** (if you encounter TypeScript import errors after renaming folders):
  ```bash
  cmd /c rmdir /s /q .next
  ```

### VPS Remote Deployment (Git-Based Workflow)
Instead of transferring files directly over SFTP, all deployments must flow through GitHub. 

To deploy local updates to the production VPS:
1. Commit and push your local modifications to GitHub:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```
2. Run the deployment script from the project root directory:
   ```bash
   node deploy_vps_git.js
   ```
   *This script connects to the VPS via SSH (trying your SSH key in `~/.ssh/id_ed25519` first, and falling back to password), tells the VPS to pull the latest commits from GitHub (`git reset --hard origin/main`), updates dependencies, runs `npx prisma generate`, compiles the build (`npm run build`), and restarts the application via PM2.*