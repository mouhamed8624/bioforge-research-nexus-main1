# 🧬 BioForge Research Nexus

<div align="center">
  <img src="/cigass-logo.png" alt="CIGASS Logo" width="200" height="200" />
  
  ### Advanced Laboratory Management & Research Platform
  
  [![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
</div>

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [👥 User Roles & Permissions](#-user-roles--permissions)
- [🏗️ System Architecture](#️-system-architecture)
- [🚀 Getting Started](#-getting-started)
- [📱 Application Modules](#-application-modules)
- [🔧 Technical Stack](#-technical-stack)
- [🌐 Deployment](#-deployment)
- [📸 Screenshots](#-screenshots)

## 🎯 Overview

**BioForge Research Nexus** is a comprehensive laboratory management and research platform designed specifically for CIGASS (Centre International de Gestion des Agences de Santé et de Sécurité). This cutting-edge system streamlines research operations, manages biological samples, tracks inventory, and facilitates collaboration across research teams.

### 🌟 What Makes It Special?

- **🔒 Role-Based Access Control**: 8 distinct user roles with tailored permissions
- **🧪 Laboratory Sample Management**: Bio banks, DBS samples, and plaquettes tracking
- **📊 Real-Time Analytics**: Advanced data visualization and reporting
- **📅 Integrated Scheduling**: Calendar management and equipment reservations
- **💰 Financial Management**: Budget tracking and expense monitoring
- **🔄 Real-Time Collaboration**: Live updates and team coordination
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile

## ✨ Key Features

### 🔬 **Laboratory Management**
- **Bio Banks**: Comprehensive biological sample storage and tracking
- **DBS Samples**: Dry Blood Spot sample management with metadata
- **Plaquettes**: Platelet sample inventory and monitoring
- **International Standards**: Compliance with WHO-2023, ISO-15189, and other standards

### 👥 **Patient Management**
- Complete patient records with demographics and medical history
- Sample collection tracking and lab results
- Consent management and privacy protection
- Timeline view of patient interactions

### 📊 **Analytics & Reporting**
- Real-time dashboard with key performance indicators
- Advanced data visualization with charts and graphs
- Pending submissions tracking
- Export capabilities for reports

### 🗓️ **Scheduling & Coordination**
- Interactive calendar with event management
- Equipment reservation system
- Team coordination and task assignment
- Automated notifications and reminders

### 💼 **Administrative Tools**
- Inventory management with stock tracking
- Financial management and budget allocation
- Team management with attendance tracking
- Settings and system configuration

### 📚 **Research Management**
- Research papers repository with metadata
- Project management with team collaboration
- Todo lists and task tracking
- Document management and version control

## 👥 User Roles & Permissions

### 🏛️ **Executive Level**
- **President**: Full system access, strategic oversight
- **Admin**: System administration, user management, full data access
- **General Director**: Leadership dashboard, team oversight, strategic planning

### 🔬 **Research & Laboratory**
- **Lab**: Laboratory operations, sample management, data analysis
- **Field**: Patient interaction, data collection, mobile access

### 💼 **Operations**
- **Manager**: Team coordination, resource allocation, operational oversight
- **Financial**: Budget management, inventory control, financial reporting
- **Front Desk**: Patient registration, scheduling, basic administrative tasks

### 🔐 **Access Control Matrix**

| Feature | President | Admin | Lab | Financial | Manager | General Director | Field | Front Desk |
|---------|:---------:|:-----:|:---:|:---------:|:-------:|:----------------:|:-----:|:----------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Patients | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Laboratory | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Finance | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Inventory | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Teams | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

## 🏗️ System Architecture

### 🎨 **Frontend Architecture**
```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                       │
├─────────────────────────────────────────────────────────────┤
│  🎨 UI Layer (shadcn/ui + Tailwind CSS)                   │
│  🔄 State Management (React Query + Context API)          │
│  🛣️ Routing (React Router v6)                             │
│  🔐 Authentication (Supabase Auth)                        │
│  📱 Responsive Design (Mobile-First)                      │
└─────────────────────────────────────────────────────────────┘
```

### 🗄️ **Backend Architecture**
```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                         │
├─────────────────────────────────────────────────────────────┤
│  🗃️ PostgreSQL Database                                   │
│  🔐 Row Level Security (RLS)                              │
│  📡 Real-time Subscriptions                               │
│  🔑 Authentication & Authorization                        │
│  📁 File Storage                                          │
│  ⚡ Edge Functions                                        │
└─────────────────────────────────────────────────────────────┘
```

### 🏛️ **Database Schema**
- **Core Tables**: Users, Profiles, User Roles
- **Patient Management**: Patients, Patient Lab Results
- **Laboratory**: Bio Banks, DBS Samples, Plaquettes
- **Operations**: Projects, Calendar Events, Equipment
- **Administrative**: Inventory, Budget Allocation, Team Members
- **Research**: Research Papers, Research Comments

## 🚀 Getting Started

### 📋 Prerequisites
- Node.js 18+ and npm
- Git
- Modern web browser (Chrome, Firefox, Safari, Edge)

### 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd bioforge-research-nexus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Supabase configuration is pre-configured
   # No additional setup required for demo
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:5173
   ```

### 🔑 Demo Access
- The application includes demo data and test users
- Use the role selection dialog to explore different user experiences
- All features are fully functional in the demo environment

## 📱 Application Modules

### 🏠 **Dashboard**
- **Overview**: Personalized dashboard based on user role
- **Key Metrics**: Real-time statistics and KPIs
- **Recent Activities**: Latest actions and updates
- **Quick Actions**: Common tasks and shortcuts

### 👥 **Patient Management**
```
┌─ Patient Registry
│  ├─ Demographics & Contact Information
│  ├─ Medical History & Diagnosis
│  ├─ Sample Collection Tracking
│  └─ Lab Results & Reports
│
├─ Search & Filtering
│  ├─ Advanced Search Capabilities
│  ├─ Filter by Demographics/Diagnosis
│  └─ Export Patient Lists
│
└─ Timeline View
   ├─ Visit History
   ├─ Sample Collections
   └─ Lab Result Timeline
```

### 🧪 **Laboratory Management**

#### 🏦 **Bio Banks**
- Sample storage with environmental tracking
- Barcode generation and scanning
- Temperature and volume monitoring
- Sample status tracking (stored, used, disposed)

#### 🩸 **DBS (Dry Blood Spot) Samples**
- Card type and spot count tracking
- Collection time and location metadata
- Analysis status and results
- International standards compliance

#### 🧫 **Plaquettes**
- Platelet sample inventory
- Storage condition monitoring
- Expiration date tracking
- Quality control metrics

### 📊 **Analytics & Visualization**
```
┌─ Real-time Dashboards
├─ Interactive Charts & Graphs
├─ Custom Report Builder
├─ Data Export (PDF, Excel, CSV)
└─ Trend Analysis & Forecasting
```

### 🗓️ **Calendar & Scheduling**
- **Event Management**: Create, edit, and manage calendar events
- **Equipment Reservations**: Book laboratory equipment and resources
- **Team Coordination**: Assign tasks and track deadlines
- **Automated Reminders**: Email and in-app notifications

### 💰 **Financial Management**
- **Budget Allocation**: Track project budgets and expenses
- **Inventory Costs**: Monitor supply and equipment costs
- **Financial Reports**: Generate cost analysis and budget reports
- **Vendor Management**: Track suppliers and purchase orders

### 👥 **Team Management**
- **User Profiles**: Manage team member information
- **Attendance Tracking**: Monitor work hours and presence
- **Role Assignment**: Configure permissions and access levels
- **Performance Metrics**: Track productivity and contributions

### 📚 **Research Papers**
- **Repository**: Centralized paper storage and organization
- **Metadata Management**: Authors, keywords, categories
- **Collaboration**: Comments and peer review system
- **Publication Tracking**: Status and version control

## 🔧 Technical Stack

### 🎨 **Frontend Technologies**
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Type-safe JavaScript for better development experience
- **Vite**: Lightning-fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **shadcn/ui**: Beautiful and accessible component library
- **React Query**: Server state management and caching
- **React Router v6**: Client-side routing with advanced features

### 🗄️ **Backend & Database**
- **Supabase**: Backend-as-a-Service with PostgreSQL
- **PostgreSQL**: Robust relational database with advanced features
- **Row Level Security**: Fine-grained access control
- **Real-time Subscriptions**: Live data updates
- **Edge Functions**: Serverless functions for custom logic

### 📦 **Key Libraries**
- **Lucide React**: Beautiful icons and graphics
- **Date-fns**: Date manipulation and formatting
- **React Hook Form**: Efficient form handling
- **Zod**: Schema validation
- **html2canvas**: Screenshot and export capabilities
- **jsPDF**: PDF generation
- **React Barcode**: Barcode generation for samples

### 🔒 **Security Features**
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permission system
- **Row Level Security**: Database-level access control
- **HTTPS Encryption**: Secure data transmission
- **Input Validation**: Client and server-side validation
- **CORS Protection**: Cross-origin request security

## 🌐 Deployment

### ☁️ **Cloud Deployment**
The application is configured for easy deployment on modern cloud platforms:

#### 🚀 **Recommended Platforms**
- **Vercel**: Optimized for React applications
- **Netlify**: Simple deployment with Git integration
- **AWS Amplify**: Scalable hosting with CI/CD
- **Google Cloud**: Enterprise-grade infrastructure

#### 📋 **Deployment Steps**
1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to your platform**
   ```bash
   # For Vercel
   npx vercel deploy
   
   # For Netlify
   npm run build && netlify deploy --prod --dir=dist
   ```

3. **Configure environment variables** on your hosting platform

### 🏢 **Self-Hosted Deployment**
For organizations requiring on-premises deployment:
- Docker containerization available
- Kubernetes deployment configurations
- Database migration scripts included
- Monitoring and logging setup guides

## 📸 Screenshots

### 🏠 Dashboard Views
<div align="center">
  <img src="https://via.placeholder.com/800x500/4338ca/ffffff?text=Dashboard+Overview" alt="Dashboard Overview" />
  <p><em>Personalized dashboard with role-based metrics and quick actions</em></p>
</div>

### 🧪 Laboratory Interface
<div align="center">
  <img src="https://via.placeholder.com/800x500/7c3aed/ffffff?text=Laboratory+Management" alt="Laboratory Management" />
  <p><em>Comprehensive sample tracking and laboratory operations</em></p>
</div>

### 👥 Patient Management
<div align="center">
  <img src="https://via.placeholder.com/800x500/059669/ffffff?text=Patient+Records" alt="Patient Records" />
  <p><em>Complete patient information and medical history tracking</em></p>
</div>

### 📊 Analytics Dashboard
<div align="center">
  <img src="https://via.placeholder.com/800x500/dc2626/ffffff?text=Data+Visualization" alt="Data Visualization" />
  <p><em>Real-time analytics and interactive data visualization</em></p>
</div>

---

## 🤝 Contributing

We welcome contributions from the research and development community:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 **Email**: support@cigass.org
- 📚 **Documentation**: [Wiki Pages](https://github.com/your-repo/wiki)
- 🐛 **Bug Reports**: [Issues](https://github.com/your-repo/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

## 🙏 Acknowledgments

- **CIGASS Team**: For their vision and requirements
- **React Community**: For the amazing ecosystem
- **Supabase Team**: For the excellent backend platform
- **Open Source Contributors**: For the libraries and tools that make this possible

---

<div align="center">
  <p>Built with ❤️ for the scientific research community</p>
  <p><strong>© 2024 CIGASS - Centre International de Gestion des Agences de Santé et de Sécurité</strong></p>
</div>
