namespace KillerPoolApi.Database.Models;

public class Participation
{
    public bool IsHost { get; set; }

    public short Order { get; set; }

    public short Lives { get; set; } = 3;

    public Game? Game { get; set; }

    public string GameId { get; set; } = string.Empty;
    
    public Player? Player { get; set; }

    public Guid PlayerId { get; set; } = Guid.Empty;
}
