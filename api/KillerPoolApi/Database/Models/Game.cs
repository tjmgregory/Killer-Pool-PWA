using System.ComponentModel.DataAnnotations;

namespace KillerPoolApi.Database.Models;

public class Game
{
    [Key] public string Id { get; set; } = string.Empty;

    public DateTime Created { get; set; } = DateTime.UtcNow;

    public string Name { get; set; } = string.Empty;

    public bool Started { get; set; }

    public ICollection<Participation>? Participants { get; set; }

    public bool Finished => Started && Participants?.Count >= 2 && Participants?.Count(p => p.Lives > 0) == 1;

    public Guid? NextPlayer { get; set; }
    
    public Guid HostId => Participants?.FirstOrDefault(p => p.IsHost)?.PlayerId ?? Guid.Empty;
    
    public Guid? WinnerId => Finished ? Participants?.Single(p => p.Lives > 0).PlayerId : null;
}
