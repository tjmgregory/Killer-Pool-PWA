namespace KillerPoolApi.Models;

public class CreateNewGameData
{
    public string Name { get; set; } = string.Empty;
    public Guid HostId { get; set; } = Guid.Empty;
    public string HostName { get; set; } = string.Empty;
}
