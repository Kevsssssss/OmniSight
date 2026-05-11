from fpdf import FPDF
import datetime

class OmniSightManual(FPDF):
    def header(self):
        if self.page_no() > 1:
            self.set_fill_color(2, 6, 23) # Slate 950
            self.rect(0, 0, 210, 20, 'F')
            self.set_font('helvetica', 'B', 10)
            self.set_text_color(255, 255, 255)
            self.cell(0, 10, 'OMNISIGHT TECHNICAL MANUAL', 0, 0, 'L')
            self.set_font('helvetica', '', 8)
            self.set_text_color(100, 116, 139)
            self.cell(0, 10, f'Page {self.page_no()}', 0, 1, 'R')
            self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(100, 116, 139)
        self.cell(0, 10, f'Confidential - OmniSight Project Documentation - {datetime.datetime.now().strftime("%Y")}', 0, 0, 'C')

    def chapter_title(self, title):
        self.set_font('helvetica', 'B', 16)
        self.set_text_color(255, 255, 255)
        self.set_fill_color(30, 41, 59) # Slate 800
        self.cell(0, 12, f'  {title.upper()}', 0, 1, 'L', fill=True)
        self.ln(4)

    def chapter_body(self, body):
        self.set_font('helvetica', '', 11)
        self.set_text_color(203, 213, 225) # Slate 300
        self.multi_cell(0, 7, body)
        self.ln()

    def add_section_header(self, text):
        self.set_font('helvetica', 'B', 12)
        self.set_text_color(59, 130, 246) # Blue 500
        self.cell(0, 10, text.upper(), 0, 1, 'L')
        self.ln(2)

def create_manual():
    pdf = OmniSightManual()
    pdf.set_auto_page_break(auto=True, margin=15)
    
    # --- Cover Page ---
    pdf.add_page()
    pdf.set_fill_color(2, 6, 23) # Slate 950
    pdf.rect(0, 0, 210, 297, 'F')
    
    pdf.set_y(100)
    pdf.set_font('helvetica', 'B', 48)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 20, 'OMNISIGHT', 0, 1, 'C')
    
    pdf.set_font('helvetica', 'B', 12)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(0, 10, 'PROFESSIONAL LAN MONITORING & CONTROL', 0, 1, 'C')
    
    pdf.set_y(250)
    pdf.set_font('helvetica', 'B', 10)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 10, 'TECHNICAL OPERATIONAL MANUAL', 0, 1, 'C')
    pdf.set_font('helvetica', '', 8)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(0, 5, 'VERSION 1.0.1 | MAY 2026', 0, 1, 'C')

    # --- Introduction ---
    pdf.add_page()
    pdf.set_fill_color(2, 6, 23) # Slate 950
    pdf.rect(0, 0, 210, 297, 'F')
    
    pdf.chapter_title('1. Project Overview')
    pdf.chapter_body(
        "OmniSight is a high-performance, LAN-based monitoring and control system designed for "
        "parental oversight and commercial environments such as Internet Cafes. It provides real-time "
        "visibility and administrative command capabilities over local network machines."
    )
    
    pdf.add_section_header('Key Features')
    pdf.chapter_body(
        "- Live Screen Stream: Low-latency JPEG-compressed desktop monitoring.\n"
        "- Stealth Operation: Client runs as a hidden LocalSystem Windows Service.\n"
        "- Remote Commands: Instant Lock, Shutdown, and Broadcast Messaging.\n"
        "- Secure Access: Password-protected Admin Dashboard and client uninstallation.\n"
        "- Web-Based UI: Modern React/Next.js interface hosted via .NET WebView2."
    )

    # --- Architecture ---
    pdf.chapter_title('2. System Architecture')
    pdf.chapter_body(
        "The system utilizes a client-server model optimized for local network stability."
    )
    
    pdf.add_section_header('Components')
    pdf.chapter_body(
        "1. Admin Dashboard (.NET + React): The central hub hosting the SignalR server and UI.\n"
        "2. Managed Client (.NET Worker): The headless service performing capture and execution.\n"
        "3. SignalR Communication: Real-time duplex communication for commands and data."
    )

    # --- Installation ---
    pdf.add_page()
    pdf.set_fill_color(2, 6, 23) # Slate 950
    pdf.rect(0, 0, 210, 297, 'F')
    
    pdf.chapter_title('3. Setup & Installation')
    
    pdf.add_section_header('Admin Setup')
    pdf.chapter_body(
        "1. Deploy 'installer-admin.exe' on the monitoring PC.\n"
        "2. Configure Administrator credentials during the first launch.\n"
        "3. Ensure Firewall ports for SignalR (Default: 5000) are open."
    )
    
    pdf.add_section_header('Client Deployment')
    pdf.chapter_body(
        "1. Deploy 'installer-client.exe' on target machines.\n"
        "2. Enter the Admin PC's IP address when prompted.\n"
        "3. Set a secure uninstallation password to prevent tampering."
    )

    # --- Operation ---
    pdf.chapter_title('4. Admin Dashboard Operation')
    
    pdf.add_section_header('Monitoring & Optimization')
    pdf.chapter_body(
        "Select a device from the 'Active Devices' sidebar to view its live screen. "
        "The system is optimized for LAN efficiency: only the currently viewed machine "
        "transmits data. Toggling the monitor to 'Offline' or switching devices "
        "immediately stops the data stream from the client."
    )
    
    pdf.add_section_header('Remote Commands')
    pdf.chapter_body(
        "- Broadcast: Send instant pop-up messages to one or all clients.\n"
        "- System Lock: Immediately restrict user access to the desktop.\n"
        "- Shutdown: Remotely power off machines for maintenance or closing time."
    )

    # --- Technical Specifications ---
    pdf.add_page()
    pdf.set_fill_color(2, 6, 23) # Slate 950
    pdf.rect(0, 0, 210, 297, 'F')
    
    pdf.chapter_title('5. Technical Specifications')
    pdf.chapter_body(
        "Capture Engine: GDI+ Screen Scraper\n"
        "Compression: Adaptive JPEG (1-100 Quality)\n"
        "Transport: SignalR over WebSockets/Long Polling\n"
        "UI Framework: Tailwind CSS + Next.js (Static Export)\n"
        "Host: .NET 10.0 WPF with WebView2 Runtime"
    )
    
    pdf.set_y(-60)
    pdf.set_fill_color(15, 23, 42) # Slate 900
    pdf.rect(15, pdf.get_y(), 180, 40, 'F')
    pdf.set_y(pdf.get_y() + 5)
    pdf.set_font('helvetica', 'B', 10)
    pdf.set_text_color(59, 130, 246)
    pdf.cell(0, 10, 'SECURITY NOTICE', 0, 1, 'C')
    pdf.set_font('helvetica', '', 9)
    pdf.set_text_color(255, 255, 255)
    pdf.multi_cell(0, 5, "Access to the OmniSight Dashboard is restricted to authorized personnel. "
                         "Unauthorized use or distribution of this manual or the software is prohibited.", align='C')

    pdf.output("docs/manual/OmniSight_Manual.pdf")
    print("PDF Manual generated successfully at docs/manual/OmniSight_Manual.pdf")

if __name__ == "__main__":
    create_manual()
