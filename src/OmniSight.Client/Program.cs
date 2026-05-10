using OmniSight.Client;
using Microsoft.Extensions.Hosting.WindowsServices;
using System.Reflection;
using System.Threading;
using System.Diagnostics;

// Ensure we use the folder where the EXE is located as the base path
var exePath = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location)!;
Directory.SetCurrentDirectory(exePath);

// Detect if running in Session 0 (Service) or interactive session
bool isSession0 = Process.GetCurrentProcess().SessionId == 0;
string mutexName = isSession0 ? @"Global\OmniSightServiceMutex" : @"Global\OmniSightClientMutex";

// Single instance protection (Global prefix handles cross-session checks)
using Mutex mutex = new Mutex(true, mutexName, out bool createdNew);
if (!createdNew) return;

var builder = Host.CreateApplicationBuilder(new HostApplicationBuilderSettings
{
    Args = args,
    ContentRootPath = exePath
});

builder.Services.AddHostedService<Worker>();
builder.Services.AddWindowsService(options =>
{
    options.ServiceName = "OmniSightClient";
});

var host = builder.Build();
host.Run();
