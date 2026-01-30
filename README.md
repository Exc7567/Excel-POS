# Sumber Kasih POS System

A modern, high-performance Point of Sale (POS) application designed for efficiency and ease of use. Built with the latest web technologies, this system provides a seamless experience across desktop and mobile devices, making it ideal for retail management.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC.svg?logo=tailwind-css)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?logo=vite)

## 🚀 Features

### Core Functionality
- **Transaction Processing**: Fast and intuitive checkout interface with support for Grosir, Eceran, and Net pricing tiers.
- **Inventory Management**: Easy product lookup, editing, and deletion. Support for bulk import/export via Excel/CSV.
- **Responsive Design**: Fully optimized for mobile and desktop. Features a unique adaptive sidebar navigation that maximizes screen real estate on smaller devices.
- **Search & Filter**: Instant search capabilities to find products and transactions quickly.

### Analytics & Reporting
- **Sales Reports**: Visualize sales performance with interactive charts (Revenue, Transaction Count).
- **Date Range Filtering**: Analyze data by Today, Week, Month, or custom date ranges.
- **Transaction History**: Detailed logs of past sales with the ability to reprint receipts.

### Technical Highlights
- **Local-First Architecture**: Fast performance with local data handling.
- **Receipt Printing**: Integrated ESC/POS thermal printer support logic.
- **Modern UI/UX**: Clean, professional interface using Tailwind CSS for a consistent look and feel.

## 🛠️ Tech Stack

- **Frontend**: [React](https://reactjs.org/) (TypeScript)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Data Handling**: [XLSX](https://github.com/SheetJS/sheetjs) (for Excel import/export)
- **Visualization**: [Recharts](https://recharts.org/)
- **Date Utilities**: [date-fns](https://date-fns.org/)

## 📦 Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/fctanu/Excel-POS.git
    cd Excel-POS
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```

4.  **Build for production:**
    ```bash
    npm run build
    ```

## 📱 Mobile Experience

The application features a dedicated mobile layout:
- **Smart Sidebar**: Hidden by default on mobile to prioritize content, accessible via a subtle top-left trigger.
- **Adaptive Tables**: Data views automatically adjust for smaller screens.
- **Touch-Friendly**: Button sizes and spacing are optimized for touch interaction.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
