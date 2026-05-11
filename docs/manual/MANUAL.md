# OmniSight Technical Manual
**Version 1.0.1 | May 2026**

## 1. Project Overview
OmniSight is a professional-grade LAN-based monitoring and control system. It is designed for parental oversight and commercial environments such as Internet Cafes. The system provides real-time visibility and administrative command capabilities over local network machines.

### Key Features
*   **Live Screen Monitoring:** High-speed screen capture with adjustable quality and frame rates.
*   **Stealth Operation:** The client operates as a background system service, making it invisible to standard users.
*   **Remote Commands:** Instant PC locking, shutdown, and custom broadcast messages.
*   **Tamper Resistance:** The client operates as a system-level Windows Service with restricted file permissions.
*   **Secure Access:** Password-protected dashboard and uninstaller.

---

## 2. System Architecture
The system consists of three main components communicating over a Local Area Network (LAN):

1.  **OmniSight Dashboard (Admin):** A .NET desktop application using WebView2 to host a React/Next.js frontend. It acts as the SignalR hub.
2.  **OmniSight Client (Managed):** A headless Windows Service and user session application that handles screen capture and command execution.
3.  **OmniSight Common:** A shared library containing data models and hub definitions.

---

## 3. Setup and Installation

### Admin Setup
1.  Install the Admin Dashboard on the primary monitoring machine.
2.  Specify your administrator username and password during the initial setup.
3.  Launch the application and log in to the dashboard.

### Client Setup
1.  Install the Client on the target machine.
2.  Provide the Dashboard's IP address and set an uninstallation password.
3.  The client will automatically connect and appear on the Dashboard.

---

## 4. Operation Guide

### Monitoring
*   Select a device from the "Active Devices" sidebar.
*   The "Monitor" tab provides a live view of the target machine's screen.
*   Use the power icon to toggle monitoring on or off to manage network load.

### Broadcast Messaging
*   Navigate to the "Broadcast" tab.
*   Enter a message and click "Send Message" to display it on the target machine.
*   Use "Send to All Devices" for network-wide announcements.

### Remote Commands
*   **Lock Computer:** Immediately locks the target machine's user session.
*   **Shutdown Computer:** Triggers a remote system shutdown.
*   **Broadcast Message:** Send instant pop-up notifications to clients.

### Settings & Optimization
*   **Network Efficiency:** The system is optimized to only stream video from the currently selected client. When "Offline Mode" is toggled or a client is deselected, video capture stops entirely to save LAN bandwidth.
*   **Performance Controls:** Adjust **Frame Rate (FPS)** and **JPEG Quality** in the "Settings" tab to balance performance and visual clarity.

---

## 5. Security & Maintenance
*   **Credential Updates:** Administrators can update their login credentials via the Settings tab.
*   **Tamper Protection:** The client service is designed to restart automatically if terminated. Uninstallation requires the password set during deployment.

---
*© 2026 OmniSight Project. Confidential Technical Documentation.*
