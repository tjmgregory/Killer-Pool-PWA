using System.Security.Cryptography;
using KillerPoolApi.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace KillerPoolApi.Database;

public class DataContext : DbContext
{
    public DataContext(DbContextOptions options)
        : base(options)
    {
    }

#nullable disable

    public DbSet<Game> Games { get; set; }

    public DbSet<Player> Players { get; set; }

    public DbSet<Participation> Participations { get; set; }

#nullable enable

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Participation>()
            .HasKey(e => new {e.GameId, e.PlayerId});

        modelBuilder
            .Entity<Participation>()
            .HasOne(e => e.Game)
            .WithMany(e => e.Participants)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder
            .Entity<Participation>()
            .HasOne(e => e.Player)
            .WithMany(e => e.JoinedGames)
            .OnDelete(DeleteBehavior.Cascade);
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.UseNpgsql().UseSnakeCaseNamingConvention();

    public async Task<string> GetNewGameId()
    {
        const string AllowableCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const byte length = 6;
        var randomNumberGenerator = RandomNumberGenerator.Create();

        string token;

        var bytes = new byte[length];
        using (var random = randomNumberGenerator)
        {
            random.GetBytes(bytes);
        }

        do
        {
            token = new(
                bytes.Select(x => AllowableCharacters[x % AllowableCharacters.Length])
                    .ToArray());
        } while (await Games.AnyAsync(e => e.Id == token));

        return token;
    }
}
