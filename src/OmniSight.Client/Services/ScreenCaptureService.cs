using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

namespace OmniSight.Client.Services;

public class ScreenCaptureService
{
    [DllImport("user32.dll")]
    private static extern IntPtr GetDesktopWindow();

    [DllImport("user32.dll")]
    private static extern int GetSystemMetrics(int nIndex);

    public byte[] CapturePrimaryScreen(long quality = 30L)
    {
        try 
        {
            // Session 0 check: If we can't get a valid desktop window, we skip capture
            IntPtr desktopHandle = GetDesktopWindow();
            if (desktopHandle == IntPtr.Zero) return Array.Empty<byte>();

            int width = GetSystemMetrics(0);
            int height = GetSystemMetrics(1);

            if (width <= 0 || height <= 0) return Array.Empty<byte>();

            using var bitmap = new Bitmap(width, height);
            using (var g = Graphics.FromImage(bitmap))
            {
                // This is where 'Handle is invalid' usually throws in Session 0
                g.CopyFromScreen(0, 0, 0, 0, bitmap.Size);
            }

            using var ms = new MemoryStream();
            var encoder = GetEncoder(ImageFormat.Jpeg);
            var encoderParameters = new EncoderParameters(1);
            encoderParameters.Param[0] = new EncoderParameter(Encoder.Quality, quality);

            bitmap.Save(ms, encoder!, encoderParameters);
            return ms.ToArray();
        }
        catch 
        {
            // Silent return to avoid flooding logs with Win32 errors
            return Array.Empty<byte>();
        }
    }

    private ImageCodecInfo? GetEncoder(ImageFormat format)
    {
        return ImageCodecInfo.GetImageDecoders()
            .FirstOrDefault(codec => codec.FormatID == format.Guid);
    }
}
