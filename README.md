# Hive — Property Management Platform

A production-ready long-term property rental and management platform built with React 19, TypeScript, Firebase, Cloudinary, and EmailJS.

---

## Features

- **Public listings** — Browse available properties without logging in
- **Role-based access** — Visitor, Tenant, Owner, Admin
- **Property CRUD** — Create, edit, delete, and toggle visibility
- **Rental contracts** — Create, view, and download PDF contracts
- **Maintenance requests** — Submit, track, and resolve issues
- **Image uploads** — Cloudinary integration for all media
- **Email notifications** — EmailJS for contact and alerts
- **Firebase Auth** — Secure authentication
- **Firestore** — Real-time database with security rules

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Routing | React Router v6 |
| Auth | Firebase Authentication |
| Database | Firebase Firestore |
| Storage | Cloudinary |
| Email | EmailJS |
| Fonts | DM Serif Display + DM Sans |

---

## Getting Started

### 1. Clone and Install

```bash
git clone <your-repo>
cd hive
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database** → Start in production mode
5. Go to Project Settings → Your apps → Web → Copy config

### 3. Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Settings → Upload → Add upload preset
3. Set preset mode to **Unsigned**
4. Note your **Cloud Name** and **Preset Name**

### 4. EmailJS Setup

1. Sign up at [emailjs.com](https://emailjs.com)
2. Create a service (Gmail, Outlook, etc.)
3. Create an email template with variables:
   - `{{to_name}}`, `{{to_email}}`, `{{from_name}}`, `{{subject}}`, `{{message}}`
4. Note your **Service ID**, **Template ID**, and **Public Key**

### 5. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

```env
# Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# EmailJS
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

### 6. Run Locally

```bash
npm run dev
```

Visit `http://localhost:5173`

---

## Firestore Security Rules

Deploy the included rules:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

Or paste `firestore.rules` content into Firebase Console → Firestore → Rules.

---

## Firestore Indexes

Deploy the composite indexes:

```bash
firebase deploy --only firestore:indexes
```

---

```bash
npm run build
wrangler pages deploy dist --project-name=terrra
firebase deploy --only firestore:rules --project hive-def63
```


## User Roles

| Role | Capabilities |
|------|-------------|
| **Visitor** | Browse public listings, view property details |
| **Tenant** | View assigned property, contracts, submit/track maintenance |
| **Owner** | Full property CRUD, create contracts, manage maintenance |
| **Admin** | Full access to all data |

---

## Deploy to Firebase Hosting

```bash
# Build the app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

Your app will be live at `https://your-project.web.app`

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Add all environment variables in Vercel's dashboard under Settings → Environment Variables.

---

## Project Structure

```
hive/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── PropertyCard.tsx
│   │   ├── PropertyGallery.tsx
│   │   ├── ContractViewer.tsx
│   │   └── MaintenanceForm.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── PropertyDetail.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── OwnerDashboard.tsx
│   │   ├── TenantDashboard.tsx
│   │   ├── ContractsPage.tsx
│   │   ├── MaintenancePage.tsx
│   │   └── AdminDashboard.tsx
│   ├── services/
│   │   ├── firebase.ts
│   │   ├── authService.ts
│   │   ├── propertyService.ts
│   │   ├── contractService.ts
│   │   └── maintenanceService.ts
│   ├── utils/
│   │   ├── cloudinaryUpload.ts
│   │   └── emailService.ts
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   └── useToast.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── .env.example
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Making the First Admin

After creating your account, manually update your user document in Firebase Console:

1. Go to Firestore → users → your-uid
2. Change `role` from `tenant` to `admin`

---

## License

MIT
