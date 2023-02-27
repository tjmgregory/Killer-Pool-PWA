namespace KillerPoolApi.Models;

public class StartGameData
{
    public Guid HostId { get; set; } = Guid.Empty;
    public string GameId { get; set; } = string.Empty;
}
