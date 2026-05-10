using System.Text.Json;
using OmniSight.Common.Models;
using System.IO;

namespace OmniSight.Dashboard.Services;

public static class GlobalSettingsStore
{
    private static readonly string SettingsPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "OmniSight", "global_settings.json");

    public static ClientSettingsDto Current { get; private set; } = new();
    
    // Admin Credentials (defaulting to admin/admin123)
    public static string AdminUsername { get; private set; } = "admin";
    public static string AdminPassword { get; private set; } = "admin123";
    public static string CurrentToken { get; private set; } = Guid.NewGuid().ToString();

    static GlobalSettingsStore()
    {
        Load();
    }

    private class FullSettings
    {
        public ClientSettingsDto ClientSettings { get; set; } = new();
        public string Username { get; set; } = "admin";
        public string Password { get; set; } = "admin123";
        public string AuthToken { get; set; } = string.Empty;
    }

    public static void Update(ClientSettingsDto settings)
    {
        Current = settings;
        Save();
    }

    public static void UpdateAdminCredentials(string username, string password)
    {
        AdminUsername = username;
        AdminPassword = password;
        Save();
    }

    private static void Save()
    {
        try
        {
            var dir = Path.GetDirectoryName(SettingsPath)!;
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
            
            var full = new FullSettings 
            { 
                ClientSettings = Current,
                Username = AdminUsername,
                Password = AdminPassword,
                AuthToken = CurrentToken
            };
            File.WriteAllText(SettingsPath, JsonSerializer.Serialize(full));
        }
        catch { }
    }

    private static void Load()
    {
        try
        {
            if (File.Exists(SettingsPath))
            {
                var json = File.ReadAllText(SettingsPath);
                var loaded = JsonSerializer.Deserialize<FullSettings>(json);
                if (loaded != null)
                {
                    Current = loaded.ClientSettings;
                    AdminUsername = loaded.Username;
                    AdminPassword = loaded.Password;
                    if (!string.IsNullOrEmpty(loaded.AuthToken))
                        CurrentToken = loaded.AuthToken;
                }
            }
        }
        catch { }
    }
}
