# Smart Nutrition PWA

An "Edge-First" Progressive Web Application (PWA) built with [Next.js](https://nextjs.org), featuring an AI Voice Coach, Bluetooth scale integration, and seamless offline-to-online MongoDB synchronization.



## 🌟 Key Features
* **AI Voice Coach**: Conversational, "alive" AI that reads out macro breakdowns and provides professional nutrition advice using the Web Speech API.
* **Offline-First Architecture**: Log meals without an internet connection. Data is stored locally in IndexedDB (via Dexie.js) and is automatically synced to MongoDB via background Service Workers when connectivity is restored.
* **Bluetooth Scale Integration**: Pull food weights directly from a smart kitchen scale using the Web Bluetooth API.
* **Dynamic Macro Tracking**: Calculates daily caloric and macronutrient targets based on user profiles and live updates as you build your plate.

---

## 🚀 Getting Started & Installation

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd smart-nutrition-pwa
2. Install all required dependencies
Run the following command to install the core packages needed for the application, offline database, UI, and backend:

Bash
npm install next react react-dom axios dexie lucide-react next-pwa mongoose jsonwebtoken bcryptjs
Install the developer dependencies (for Tailwind CSS and TypeScript):

Bash
npm install -D tailwindcss postcss autoprefixer typescript @types/node @types/react @types/react-dom
3. Configure Environment Variables
Create a file named .env.local in the root of your project. Note: This file is ignored by Git and will not be pushed to GitHub. Add the following keys:

Plaintext
NEXT_PUBLIC_API_URL=http://localhost:3000
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_secret_key_here
4. Run the Development Server
Start your local server:

Bash
npm run dev
# or
yarn dev
Open http://localhost:3000 with your browser to see the application.

🛠️ Tech Stack & Built With
Frontend UI: Next.js (App Router), React, Tailwind CSS, Lucide Icons

Offline Storage & PWA: next-pwa (Service Workers/Workbox), Dexie.js (IndexedDB API wrapper)

Backend / Database: Next.js API Routes, MongoDB, Mongoose ORM

Hardware / Web APIs: Web Bluetooth API, Web Speech Synthesis API

📱 PWA Configuration (Next-PWA)
Because this app uses next-pwa, the build process automatically generates service worker files (sw.js, workbox-*.js).

In development mode, offline capabilities might behave differently.

To test the full Offline-First synchronization properly, build and start the production app:

Bash
npm run build
npm run start