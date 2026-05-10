using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using OmniSight.Dashboard.Hubs;
using System.IO;
using System.Reflection;

namespace OmniSight.Dashboard.Services;

public class LocalWebServer
{
    private WebApplication? _app;
    public string ServerUrl { get; private set; } = "http://localhost:5000";

    public async Task StartAsync()
    {
        var exePath = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location)!;
        
        var options = new WebApplicationOptions
        {
            ContentRootPath = exePath,
            WebRootPath = Path.Combine(exePath, "wwwroot"),
            Args = new[] { "--urls", "http://0.0.0.0:5000" }
        };

        var builder = WebApplication.CreateBuilder(options);
        
        builder.Services.AddSignalR(options =>
        {
            options.MaximumReceiveMessageSize = 10 * 1024 * 1024;
        }).AddJsonProtocol(options => 
        {
            options.PayloadSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        });
        builder.Services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy.AllowAnyHeader()
                      .AllowAnyMethod()
                      .SetIsOriginAllowed(_ => true)
                      .AllowCredentials();
            });
        });

        _app = builder.Build();

        _app.UseDefaultFiles();
        _app.UseStaticFiles();
        _app.UseCors();
        
        _app.MapHub<MonitorHub>("/monitorHub");

        await _app.StartAsync();
    }

    public async Task StopAsync()
    {
        if (_app != null)
        {
            await _app.StopAsync();
            await _app.DisposeAsync();
        }
    }
}
