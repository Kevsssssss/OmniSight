# OmniSight

OmniSight is a professional grade LAN based parental monitoring and control system. It consists of a high performance Admin Dashboard and a stealthy Client Service designed for Windows environments.

## Core Features

*   Live Screen Monitoring: High speed screen capture with adjustable quality and frame rates.
*   Secure Admin Dashboard: Modern SaaS inspired interface built with React and Next.js, hosted within a native .NET desktop application.
*   Remote Commands: Instant PC locking, shutdown, and custom broadcast messages.
*   Tamper Resistance: The client operates as a system level Windows Service with restricted file permissions to prevent unauthorized removal or termination.
*   Cross Device Access: The dashboard is accessible via desktop or mobile devices on the same network.
*   Security: Built in authentication with trusted device support and secure installer passwords.

## Architecture

The system is split into three main components:

1.  OmniSight Dashboard (Admin): A .NET WPF application using WebView2 to host the React frontend. It acts as the SignalR hub for the network.
2.  OmniSight Client (Managed): A headless Windows Service and user session application that handles screen capture and command execution.
3.  OmniSight Common: A shared library containing data models and hub definitions used by both the Admin and Client.

## Project Structure

```text
OmniSight/
├── build.ps1               (Release build script)
├── installer-admin.iss     (Inno Setup script for Dashboard)
├── installer-client.iss    (Inno Setup script for Client)
├── src/
│   ├── OmniSight.Dashboard/ (WPF + ASP.NET Core Server)
│   ├── OmniSight.Client/    (Windows Service + User App)
│   ├── OmniSight.Common/    (Shared DTOs and Hub interfaces)
│   └── omnisight-dashboard-ui/ (React/Next.js Frontend)
└── bin/
    └── Installer/          (Output directory for setup files)
```

## Setup and Installation

### Prerequisites

*   .NET 10 SDK or later
*   Node.js (for UI development and building)
*   Inno Setup (to generate installers)

### Building the Project

1.  Open a terminal in the project root.
2.  Run the build script:
    ```powershell
    .\build.ps1
    ```
    This script compiles the .NET projects and builds the Next.js frontend into the dashboard static assets folder.

### Generating Installers

1.  Open Inno Setup Compiler.
2.  Open and compile `installer-admin.iss` to create the Dashboard installer.
3.  Open and compile `installer-client.iss` to create the Client installer.
4.  The generated `.exe` files will be located in `bin/Installer/`.

## Usage

### Admin Setup
1.  Install the Admin Dashboard on the primary monitoring machine.
2.  During setup, specify your desired administrator username and password.
3.  Launch the app and log in.
4.  Note your PC IP address (visible in the Dashboard status or via `ipconfig`).

### Client Setup
1.  Install the Client on the target machine.
2.  Provide the Dashboard IP address and set an uninstallation password.
3.  The client will automatically start in the background and appear on the Dashboard.

### Mobile Access
To monitor from your phone, ensure it is on the same Wi-Fi network and navigate to:
`http://[DASHBOARD-IP]:5000`

## License

This project is licensed under the MIT License. See the LICENSE file for details.
