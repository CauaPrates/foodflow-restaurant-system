# 🍽️ FoodFlow - Restaurant Management System

A complete restaurant management system with modern interface and advanced features, built with React, Node.js, and C# desktop launcher.

![FoodFlow Logo](https://img.shields.io/badge/FoodFlow-Restaurant%20System-blue?style=for-the-badge&logo=restaurant)

## 🚀 Features

- 📱 **Modern Web Interface** - Responsive React frontend with modern UI/UX
- 🍕 **Menu Management** - Complete CRUD operations for menu items
- 📋 **Order Management** - Real-time order tracking and processing
- 👥 **Staff Management** - Employee control and role management
- 📊 **Analytics & Reports** - Comprehensive business insights
- 🖥️ **Desktop Launcher** - Easy system control with modern C# interface
- 🔄 **Real-time Updates** - Live synchronization across all components
- 🗄️ **Database Management** - SQLite with Prisma ORM for data persistence

## 🛠️ Technologies

### Frontend
- **React** with TypeScript
- **Modern CSS** with gradients and animations
- **Responsive Design** for all devices

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Prisma ORM** for database operations
- **SQLite** database

### Desktop Application
- **C# Windows Forms** with modern UI
- **Gradient backgrounds** and smooth animations
- **System tray integration**

### Development Tools
- **PowerShell scripts** for automation
- **Batch files** for quick operations
- **Hot reload** development environment

## 📦 Installation

### Prerequisites
- **Node.js** (v16 or higher)
- **.NET 6.0** or higher
- **Windows OS** (for desktop launcher)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/foodflow-restaurant-system.git
   cd foodflow-restaurant-system
   ```

2. **Run the Desktop Launcher** (Recommended)
   ```bash
   # Build the launcher
   dotnet build RestauranteLauncher/RestauranteLauncher.csproj -c Release
   
   # Run the launcher
   ./RestauranteLauncher/bin/Release/net6.0-windows/RestauranteLauncher.exe
   ```

3. **Manual Installation** (Alternative)
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   
   # Setup database
   cd ../backend
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

## 🎯 Usage

### Using Desktop Launcher (Recommended)
1. Run `RestauranteLauncher.exe`
2. Click **"▶️ START SYSTEM"**
3. Wait for the system to initialize
4. Access the web interface at `http://localhost:3000`

### Manual Startup
1. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm start
   ```

3. **Access Application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`

## 📁 Project Structure

```
foodflow-restaurant-system/
├── 📁 frontend/                 # React frontend application
│   ├── 📁 src/
│   │   ├── 📁 components/       # Reusable UI components
│   │   ├── 📁 pages/           # Application pages
│   │   ├── 📁 contexts/        # React contexts
│   │   └── 📁 services/        # API services
│   ├── 📁 public/              # Static assets
│   └── 📄 package.json         # Frontend dependencies
├── 📁 backend/                  # Node.js backend API
│   ├── 📁 src/
│   │   ├── 📁 routes/          # API routes
│   │   ├── 📁 middleware/      # Express middleware
│   │   ├── 📁 lib/            # Utility libraries
│   │   └── 📄 server.ts        # Main server file
│   ├── 📁 prisma/              # Database schema and migrations
│   │   ├── 📄 schema.prisma    # Database schema
│   │   ├── 📄 seed.ts         # Database seeding
│   │   └── 📁 migrations/      # Database migrations
│   └── 📄 package.json         # Backend dependencies
├── 📁 RestauranteLauncher/      # C# desktop launcher
│   ├── 📄 ControllerForm.cs    # Main UI form
│   ├── 📄 Program.cs          # Application entry point
│   └── 📄 RestauranteLauncher.csproj
├── 📄 database_setup.sql       # Database initialization
├── 📄 MYSQL_SETUP.md          # MySQL setup guide
├── 📄 LAUNCHER_README.md      # Launcher documentation
└── 📁 scripts/                 # Automation scripts
    ├── 📄 start-app.ps1       # PowerShell start script
    ├── 📄 stop-app.ps1        # PowerShell stop script
    ├── 📄 build-launcher.ps1  # Launcher build script
    └── 📄 build-and-run.bat   # Batch automation
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Settings
FRONTEND_URL=http://localhost:3000
```

### Database Setup
The system uses SQLite by default with Prisma ORM:

```bash
# Generate Prisma client
npx prisma generate

# Apply database schema
npx prisma db push

# Seed initial data
npx prisma db seed
```

## 🎨 Desktop Launcher Features

- **Modern UI** with gradients and smooth animations
- **System Status Monitoring** - Real-time port checking
- **One-Click Startup** - Automatic dependency installation
- **Process Management** - Start/stop backend and frontend
- **Visual Feedback** - Status icons and progress indicators
- **Drag & Drop** - Moveable window interface
- **Close Button** - Elegant X button for closing

## 🚀 Development

### Running in Development Mode

1. **Backend Development**
   ```bash
   cd backend
   npm run dev  # Runs with nodemon for hot reload
   ```

2. **Frontend Development**
   ```bash
   cd frontend
   npm start    # Runs with hot reload
   ```

3. **Launcher Development**
   ```bash
   dotnet run --project RestauranteLauncher/RestauranteLauncher.csproj
   ```

### Building for Production

```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd ../backend
npm run build

# Build launcher
dotnet build RestauranteLauncher/RestauranteLauncher.csproj -c Release
```

## 📋 API Endpoints

### Menu Management
- `GET /api/menu` - Get all menu items
- `POST /api/menu` - Create new menu item
- `PUT /api/menu/:id` - Update menu item
- `DELETE /api/menu/:id` - Delete menu item

### Order Management
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order status
- `DELETE /api/orders/:id` - Cancel order

### Staff Management
- `GET /api/staff` - Get all staff members
- `POST /api/staff` - Add new staff member
- `PUT /api/staff/:id` - Update staff information
- `DELETE /api/staff/:id` - Remove staff member

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing frontend framework
- Node.js community for the robust backend platform
- Prisma team for the excellent ORM
- Microsoft for .NET and C# development tools

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/foodflow-restaurant-system/issues) page
2. Create a new issue with detailed information
3. Contact the development team

---

<div align="center">
  <strong>Made with ❤️ for restaurant management</strong>
  <br>
  <sub>FoodFlow - Streamlining restaurant operations</sub>
</div>
