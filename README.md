# MX!-SAJID বাকি হিসাব (Baki Hisab)

A secure, real-time customer and transaction management application built with Vanilla JS, Tailwind CSS, and Firebase.

## Features

- **Secure PIN Lock**: Protect your data with a 4-digit PIN.
- **Real-time Sync**: Powered by Firebase Firestore.
- **Authentication**: Secure Login and Sign Up using Firebase Auth.
- **Dark/Light Mode**: Responsive design with theme support.
- **Transaction History**: Track customer balances and transaction logs.
- **Wallpaper Customization**: Personalize your workspace.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd baki-hisab-vanilla
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase:
   - Create a `.env` file based on `.env.example`.
   - Add your Firebase configuration details to the `.env` file.

4. Start the development server:
   ```bash
   npm run dev
   ```

### Deployment

#### Netlify

This project is ready for Netlify. Simply connect your GitHub repository to Netlify and it will automatically build and deploy using the `netlify.toml` configuration.

- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

#### GitHub Pages

You can deploy to GitHub Pages in two ways:

1.  **Manual Deployment**: Use the provided `deploy` script:
    ```bash
    npm run deploy
    ```
2.  **GitHub Actions**: The project includes a `.github/workflows/build.yml` file that automatically verifies the build on every push to the `main` branch. You can further configure this to deploy to GitHub Pages automatically.

### CI/CD

A GitHub Action is configured to ensure your code builds correctly on every push or pull request.

## License

MIT
