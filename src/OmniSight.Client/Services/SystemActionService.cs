using System.Diagnostics;
using System.Runtime.InteropServices;

namespace OmniSight.Client.Services;

public class SystemActionService
{
    [DllImport("user32.dll")]
    private static extern bool LockWorkStation();

    [DllImport("wtsapi32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    private static extern bool WTSSendMessage(
        IntPtr hServer,
        int SessionId,
        string pTitle,
        int TitleLength,
        string pMessage,
        int MessageLength,
        int Style,
        int Timeout,
        out int pResponse,
        bool bWait);

    private static readonly IntPtr WTS_CURRENT_SERVER_HANDLE = IntPtr.Zero;
    private const int WTS_CURRENT_SESSION = -1;

    public void LockPC()
    {
        LockWorkStation();
    }

    public void ShutdownPC()
    {
        Process.Start(new ProcessStartInfo
        {
            FileName = "shutdown",
            Arguments = "/s /t 5 /f", // Shutdown in 5 seconds, force close apps
            CreateNoWindow = true,
            UseShellExecute = false
        });
    }

    public void ShowMessage(string message)
    {
        // Shows a message box even from a background service to the active user
        Task.Run(() => {
            WTSSendMessage(
                WTS_CURRENT_SERVER_HANDLE,
                WTS_CURRENT_SESSION,
                "OmniSight System Message",
                "OmniSight System Message".Length * 2,
                message,
                message.Length * 2,
                0, // MB_OK
                0,
                out _,
                false);
        });
    }
}
