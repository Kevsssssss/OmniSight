using Microsoft.AspNetCore.SignalR.Client;
using OmniSight.Client.Services;
using OmniSight.Common.Models;
using System.Diagnostics;

namespace OmniSight.Client;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly ScreenCaptureService _captureService;
    private readonly SystemActionService _actionService;
    private readonly BroadcastOverlay _broadcastOverlay;
    private HubConnection? _connection;
    private readonly string _customName;
    private readonly string _dashboardUrl;
    private readonly bool _isSession0;
    private ClientSettingsDto _settings = new();

    public Worker(ILogger<Worker> _logger, IConfiguration configuration)
    {
        this._logger = _logger;
        this._captureService = new ScreenCaptureService();
        this._actionService = new SystemActionService();
        this._broadcastOverlay = new BroadcastOverlay();
        this._customName = configuration["MachineName"] ?? Environment.MachineName;
        this._dashboardUrl = configuration["DashboardUrl"] ?? "http://localhost:5000";
        this._isSession0 = Process.GetCurrentProcess().SessionId == 0;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("OmniSight Worker starting. Mode: {Mode}", _isSession0 ? "Service (Session 0)" : "Interactive (User)");

        _connection = new HubConnectionBuilder()
            .WithUrl($"{_dashboardUrl.TrimEnd('/')}/monitorHub", options => {
                options.ApplicationMaxBufferSize = 10 * 1024 * 1024;
                options.TransportMaxBufferSize = 10 * 1024 * 1024;
            })
            .WithAutomaticReconnect()
            .Build();

        _connection.Reconnected += async (connectionId) =>
        {
            _logger.LogInformation("Reconnected! ID: {Id}", connectionId);
            await _connection.InvokeAsync("RegisterClient", _customName, stoppingToken);
        };

        _connection.On<string>("ReceiveNotification", (message) =>
        {
            _logger.LogInformation("Notification received: {Message}", message);
            var parts = message.Split(':', 2);
            var type = parts[0];
            var payload = parts.Length > 1 ? parts[1] : "";

            switch (type)
            {
                case "Lock": _actionService.LockPC(); break;
                case "Shutdown": 
                    if (_isSession0)
                    {
                        // In session 0, just wait and then kill
                        Task.Run(async () => {
                            await Task.Delay(5000);
                            _actionService.ShutdownPC();
                        });
                    }
                    else
                    {
                        // In user session, show the beautiful red countdown
                        _broadcastOverlay.ShowCountdown("System Administrator", 5, () => _actionService.ShutdownPC());
                    }
                    break;
                case "Message": _broadcastOverlay.Show(payload); break;
                case "CloseMessage": _broadcastOverlay.Close(); break;
            }
        });

        _connection.On<ClientSettingsDto>("ReceiveSettings", (s) => _settings = s);

        while (!stoppingToken.IsCancellationRequested)
        {
            if (_connection.State == HubConnectionState.Disconnected)
            {
                try 
                { 
                    _logger.LogInformation("Attempting to connect to {Url}...", _dashboardUrl);
                    await _connection.StartAsync(stoppingToken); 
                    _logger.LogInformation("Connected successfully.");
                    await _connection.InvokeAsync("RegisterClient", _customName, stoppingToken);
                } 
                catch (Exception ex)
                { 
                    _logger.LogError(ex, "Connection failed. Retrying in 5s...");
                    await Task.Delay(5000, stoppingToken); 
                    continue; 
                }
            }

            if (_connection.State == HubConnectionState.Connected && !_isSession0 && _settings.IsStreaming)
            {
                try
                {
                    var data = _captureService.CapturePrimaryScreen(_settings.JpegQuality);
                    if (data != null && data.Length > 0)
                    {
                        await _connection.InvokeAsync("SendScreenFrame", new ScreenFrameDto {
                            MachineName = _customName, Data = data, Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                        }, stoppingToken);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogTrace(ex, "Failed to send frame.");
                }
            }
            
            // Sleep based on target FPS, or 1 second if in Session 0 (just to keep connection alive)
            int delay = _isSession0 ? 1000 : (1000 / Math.Max(1, _settings.TargetFps));
            await Task.Delay(delay, stoppingToken);
        }
    }
}
