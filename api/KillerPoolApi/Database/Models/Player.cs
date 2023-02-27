using System.ComponentModel.DataAnnotations;

namespace KillerPoolApi.Database.Models;

public class Player
{
    [Key] public Guid Id { get; set; } = Guid.Empty;

    public string Name { get; set; } = string.Empty;
    
    public ICollection<Participation>? JoinedGames { get; set; }
}
