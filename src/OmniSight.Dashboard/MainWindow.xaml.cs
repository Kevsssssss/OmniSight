using System.Windows;
using OmniSight.Dashboard.Services;
using Microsoft.Web.WebView2.Core;
using System.IO;

namespace OmniSight.Dashboard;

public partial class MainWindow : Window
{
    private readonly LocalWebServer _server;

    public MainWindow()
    {
        InitializeComponent();
        _server = new LocalWebServer();
        Loaded += MainWindow_Loaded;
        Closing += MainWindow_Closing;
    }

    private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
    {
        try
        {
            await _server.StartAsync();
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Failed to start local web server: {ex.Message}", "Startup Error", MessageBoxButton.OK, MessageBoxImage.Error);
            Close();
            return;
        }

        try
        {
            // Set a writable user data folder (crucial for Program Files installs)
            var userDataFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "OmniSight");
            var environment = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
            
            await webView.EnsureCoreWebView2Async(environment);
            
#if DEBUG
            webView.Source = new Uri("http://localhost:3000"); 
#else
            webView.Source = new Uri(_server.ServerUrl);
#endif
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Failed to initialize WebView2: {ex.Message}\n\nMake sure the WebView2 Runtime is installed.", "Browser Error", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    private async void MainWindow_Closing(object? sender, System.ComponentModel.CancelEventArgs e)
    {
        try
        {
            await _server.StopAsync();
        }
        catch { /* Ignore shutdown errors */ }
    }
}
