using Microsoft.AspNetCore.SignalR;
using OmniSight.Common.Hubs;
using OmniSight.Common.Models;
using OmniSight.Dashboard.Services;
using System.Collections.Concurrent;

namespace OmniSight.Dashboard.Hubs;

public class MonitorHub : Hub<IMonitorClient>
{
    private static readonly ConcurrentDictionary<string, string> ConnectionToMachineMap = new();

    public async Task<AuthResponse> Login(AuthRequest request)
    {
        if (request.Username == GlobalSettingsStore.AdminUsername && request.Password == GlobalSettingsStore.AdminPassword)
        {
            return new AuthResponse { Success = true, Token = GlobalSettingsStore.CurrentToken };
        }
        return new AuthResponse { Success = false, Error = "Invalid credentials" };
    }

    public async Task<bool> ValidateToken(string token)
    {
        return token == GlobalSettingsStore.CurrentToken;
    }

    public async Task<bool> ChangeAdminCredentials(AuthRequest request, string token)
    {
        if (token == GlobalSettingsStore.CurrentToken)
        {
            GlobalSettingsStore.UpdateAdminCredentials(request.Username, request.Password);
            return true;
        }
        return false;
    }

    public async Task RegisterClient(string machineName)
    {
        ConnectionToMachineMap[Context.ConnectionId] = machineName;
        // Notify all UI clients that a new device is connected
        await Clients.All.ReceiveScreenFrame(new ScreenFrameDto { 
            ClientId = Context.ConnectionId, 
            MachineName = machineName, 
            Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            Data = Array.Empty<byte>() // No image data yet
        });
    }

    public async Task SendScreenFrame(ScreenFrameDto frame)
    {
        frame.ClientId = Context.ConnectionId;
        ConnectionToMachineMap[Context.ConnectionId] = frame.MachineName;
        await Clients.All.ReceiveScreenFrame(frame);
    }

    public async Task SendCommand(CommandDto command)
    {
        if (string.IsNullOrEmpty(command.TargetClientId) || command.TargetClientId == "all")
            await Clients.All.ReceiveNotification($"{command.Type}:{command.Payload}");
        else
            await Clients.Client(command.TargetClientId).ReceiveNotification($"{command.Type}:{command.Payload}");
    }

    public async Task UpdateSettings(string targetClientId, ClientSettingsDto settings)
    {
        // Persist globally
        GlobalSettingsStore.Update(settings);

        if (targetClientId == "all")
            await Clients.All.ReceiveSettings(settings);
        else
            await Clients.Client(targetClientId).ReceiveSettings(settings);
    }

    public override async Task OnConnectedAsync()
    {
        // Immediately send global settings to the newly connected client
        await Clients.Caller.ReceiveSettings(GlobalSettingsStore.Current);
        await base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        ConnectionToMachineMap.TryRemove(Context.ConnectionId, out _);
        return base.OnDisconnectedAsync(exception);
    }
}
