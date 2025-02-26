# My AI Chat App Overview

My AI Chat App is a full-stack application allowing users to interact with multiple AI models via a chat interface. It provides real-time chat, news browsing, and personal note-taking while integrating robust security features like user authentication and multi-factor authentication (MFA).

## Key Features

- **Chat Interface**  
  - **Multi-Model Support:** Chat with AI models such as [`4o-mini`](src/services/chatTitleGenerator.ts) and others via the [`getAIBackendResponse`](src/services/backendapi.ts) API.
  - **Real-time Updates:** Realtime chat updates are implemented using Supabase channels ([`supabaseClient`](src/services/supabaseClient.ts) & [`backendapi.ts`](src/services/backendapi.ts)).
  - **Markdown & Code Highlighting:** Response messages support Markdown, math (via KaTeX), and syntax highlighting with interactive copy functionality ([`ChatBubble.tsx`](src/components/chat/ChatBubble.tsx) and [`CodeBlock`](src/pages/LandingPage.tsx)).

- **User Authentication and Security**  
  - **Email Sign In/Sign Up:** Users can sign up or log in using email credentials with password strength checking ([`LoginPopup.tsx`](src/components/Login/LoginPopup.tsx) and [`PasswordStrengthMeter.tsx`](src/components/Login/PasswordStrengthMeter.tsx)).
  - **Multi-Factor Authentication (MFA):** MFA is integrated using Supabase’s MFA endpoints. Users can enroll using [`EnrollMFA.tsx`](src/components/MFA/EnrollMFA.tsx) and verify through [`AuthMFA.tsx`](src/components/Login/AuthMFA.tsx).
  - **Password Recovery:** Users can reset their passwords via [`ResetPasswordPopup.tsx`](src/components/other/ResetPasswordPopup.tsx).

- **Navigation and User Interface**  
  - **Responsive Navigation:** A top [`Navbar`](src/components/navbar/navbar.tsx) and a collapsible [`Sidebar`](src/components/navbar/sidebar/sidebar.tsx) provide seamless navigation across chats, news, and notes.
  - **Dropdown Menus:** Contextual menus allow quick access to different pages (e.g. Home, News, Notes) implemented in [`SimpleNavbar.tsx`](src/components%20news/navbar/SimpleNavbar.tsx) and within the Navbar.

- **Additional Pages**  
  - **News:** The [`NewsPage.tsx`](src/pages/NewsPage.tsx) shows news articles with static content and future opportunities for dynamic updates. (not fully developed)
  - **Notes:** The [`NotesPage.tsx`](src/pages/NotesPage.tsx) lets users create, edit, and view personal notes. (not fully developed)

- **Configuration and Build Setup**  
  - **Environment Variables:** Managed via `.env` and `.env.development` files with key variables loaded by [`env.config.ts`](src/config/env.config.ts).
  - **Styling:** Tailwind CSS is used for styling; configuration is maintained in [`tailwind.config.js`](tailwind.config.js) and processed through [`postcss.config.cjs`](postcss.config.cjs).
  - **Build & Development:** The project is bootstrapped with Vite for a fast development experience (see scripts in [package.json](package.json)).

- **Backend Implementation**  
  - **Express Server:** The backend in [`server.ts`](server.ts) sets up an Express server with CORS, API client integrations (OpenAI, Anthropic, Google Generative AI), and serves static content.
  - **Routes and API Endpoints:** The `/api/chat` endpoint processes incoming chat prompts and manages API calls while providing detailed error reporting (integrated with [`discordWebhook.ts`](src/services/discordWebhook.ts)).

## How It’s Implemented

1. **Frontend and Routing:**  
   The single-page application is built with React and React Router ([`src/index.tsx`](src/index.tsx), [`App.tsx`](src/App.tsx)), providing multiple pages including chat, news, and notes.

2. **Chat Functionality:**  
   - The chat sends user input to the backend via `/api/chat` and renders responses using Markdown.
   - Conversation state is updated in real time and synced to Supabase for persistent chat history ([`LandingPage.tsx`](src/pages/LandingPage.tsx)).

3. **User Authentication and MFA:**  
   - The authentication flow uses Supabase ([`auth.ts`](src/services/auth.ts)) to manage user sessions.
   - MFA enrollment and verification are integrated seamlessly to improve account security.

4. **Independent Modules:**  
   Each feature is compartmentalized:
   - Chat-related code under [`components/chat`](src/components/chat/),
   - Navigation components under [`components/navbar`](src/components/navbar/),
   - Additional features in their respective folders (e.g. [`pages/NotesPage.tsx`](src/pages/NotesPage.tsx), [`pages/NewsPage.tsx`](src/pages/NewsPage.tsx)).

---

This overview provides a snapshot of the project’s features and implementation details. For further exploration, you can review the individual files linked throughout this document.
