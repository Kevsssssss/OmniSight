using OmniSight.Common.Models;

namespace OmniSight.Common.Hubs;

public interface IMonitorClient
{
    Task ReceiveScreenFrame(ScreenFrameDto frame);
    Task ReceiveNotification(string message);
    Task ReceiveSettings(ClientSettingsDto settings);
}
