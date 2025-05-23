# ChatZone 💬

A real-time chat application built using **Next.js**, **Supabase**, and **Tailwind CSS**, designed with a sleek WhatsApp-style UI and smooth user experience.

![ChatZone Preview](public/preview.png)

---

## ✨ Features

* ✅ Real-time messaging using Supabase Realtime
* ✅ WhatsApp-like UI with user list, chat bubbles, and icons
* ✅ Typing interface with emoji, mic, and attachment icons
* ✅ User authentication (email signup/login)
* ✅ Mobile-responsive layout using Tailwind CSS
* ✅ One-click deployment with Vercel

---

## 🔧 Tech Stack

| Tech             | Purpose            |
| ---------------- | ------------------ |
| **Next.js**      | React framework    |
| **Supabase**     | Auth, DB, Realtime |
| **Tailwind CSS** | Styling            |
| **Lucide Icons** | Interface icons    |
| **TypeScript**   | Type safety        |

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/sudhanshuk1404/ChatZone.git
cd ChatZone
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in your Supabase dashboard under Project Settings → API.

### 4. Run the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 📦 Deployment on Vercel

1. Push your code to GitHub
2. Go to [https://vercel.com](https://vercel.com)
3. Import your repository
4. Set the environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
5. Click **Deploy**



## 🙋‍♂️ Author

Built with ❤️ by [@sudhanshuk1404](https://github.com/sudhanshuk1404)

---


