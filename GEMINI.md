# FarmaGenius - Dashboard Inteligente

## Project Overview

This is a Next.js application that serves as an intelligent dashboard for pharmaceutical automation, data processing, and analysis. It uses Next.js for the frontend and backend, with Supabase as the database. The application features user authentication, a dashboard for data visualization, and various services for interacting with the database.

## Building and Running

To get the application running locally, follow these steps:

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the application on [http://localhost:3000](http://localhost:3000).

3.  **Build for production:**
    ```bash
    npm run build
    ```

4.  **Start the production server:**
    ```bash
    npm run start
    ```

## Development Conventions

*   **Authentication:** The application uses NextAuth.js for authentication, with the configuration located in `lib/auth.ts`.
*   **Database:** The project uses Supabase for the database. The `lib/database.ts` file provides a `DatabaseService` class for interacting with the database, along with services for each table.
*   **Styling:** The project uses Tailwind CSS for styling. The configuration is in `tailwind.config.ts`.
*   **Linting:** The project uses ESLint for linting. The configuration is in `.eslintrc.json`. To run the linter, use the following command:
    ```bash
    npm run lint
    ```
