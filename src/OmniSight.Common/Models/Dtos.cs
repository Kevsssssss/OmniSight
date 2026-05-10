namespace OmniSight.Common.Models;

public class ScreenFrameDto
{
    public string ClientId { get; set; } = string.Empty;
    public string MachineName { get; set; } = string.Empty;
    public byte[] Data { get; set; } = Array.Empty<byte>();
    public long Timestamp { get; set; }
}

public class CommandDto
{
    public string TargetClientId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
}

public class ClientSettingsDto
{
    public int TargetFps { get; set; } = 5;
    public int JpegQuality { get; set; } = 30;
}

public class ClientInfo
{
    public string ConnectionId { get; set; } = string.Empty;
    public string MachineName { get; set; } = string.Empty;
    public DateTime LastSeen { get; set; }
}

public class AuthRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public bool Success { get; set; }
    public string Token { get; set; } = string.Empty;
    public string Error { get; set; } = string.Empty;
}
