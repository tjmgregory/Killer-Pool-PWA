using KillerPoolApi.Database;
using KillerPoolApi.Database.Models;
using KillerPoolApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KillerPoolApi.Controller;

[Route("games")]
public class GameController : ControllerBase
{
    private readonly DataContext _db;

    public GameController(DataContext db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> CreateNew([FromBody] CreateNewGameData data)
    {
        var newId = await _db.GetNewGameId();
        var existingPlayer = await _db.Players.FirstOrDefaultAsync(p => p.Id == data.HostId);
        var game = await _db.Games.AddAsync(new()
        {
            Id = newId,
            Name = data.Name,
            Participants = new List<Participation>
            {
                new()
                {
                    IsHost = true,
                    Player = existingPlayer ?? new()
                    {
                        Id = data.HostId,
                        Name = data.HostName,
                    },
                },
            }
        });
        await _db.SaveChangesAsync();
        return Ok(game.Entity.Id);
    }

    [HttpGet]
    public async Task<IActionResult> GetParticipatingGames([FromQuery] Guid userId)
    {
        var games = await _db.Games.Include(g => g.Participants)
            .Where(g => g.Participants!.Any(p => p.PlayerId == userId)).ToListAsync();

        return Ok(games);
    }

    [HttpGet("{gameId}")]
    public async Task<IActionResult> FetchGame(string gameId)
    {
        var game = await _db.Games.Include(g => g.Participants!).ThenInclude(p => p.Player)
            .FirstOrDefaultAsync(g => g.Id == gameId);
        if (game is null)
        {
            return NotFound();
        }

        return Ok(game);
    }

    [HttpPost("start")]
    public async Task<IActionResult> Start([FromBody] StartGameData data)
    {
        var game = await _db.Games.Include(g => g.Participants).FirstOrDefaultAsync(g => g.Id == data.GameId);
        if (game is null)
        {
            return NotFound();
        }

        if (game.Started)
        {
            return Conflict();
        }

        if (game.Participants?.Any(p => p.IsHost && p.PlayerId == data.HostId) != true)
        {
            return Forbid();
        }

        if (game.Participants?.Count < 2)
        {
            return BadRequest("Not enough players");
        }

        game.Started = true;
        game.Participants = game.Participants?.OrderBy(_ => Guid.NewGuid()).Select((participation, idx) =>
        {
            participation.Order = (short) idx;
            return participation;
        }).ToList();
        game.NextPlayer = game.Participants?.First().PlayerId;

        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{gameId}/participants")]
    public async Task<IActionResult> Join(string gameId, [FromBody] PlayerData data)
    {
        var game = await _db.Games.Include(g => g.Participants).FirstOrDefaultAsync(g => g.Id == gameId);
        if (game is null)
        {
            return NotFound();
        }

        if (game.Started)
        {
            return Conflict("Game already started");
        }

        var player = await _db.Players.SingleOrDefaultAsync(p => p.Id == data.Id)
            ?? (await _db.Players.AddAsync(new()
            {
                Id = data.Id,
                Name = data.Name,
            })).Entity;
        
        if (game.Participants?.Any(p => p.PlayerId == data.Id) != true)
        {
            await _db.Participations.AddAsync(new()
            {
                PlayerId = player.Id,
                GameId = game.Id,
            });

            await _db.SaveChangesAsync();
        }

        return NoContent();
    }

    [HttpDelete("{gameId}/participants/{playerId:guid}")]
    public async Task<IActionResult> Leave(string gameId, Guid playerId)
    {
        var game = await _db.Games.Include(g => g.Participants).FirstOrDefaultAsync(g => g.Id == gameId);
        if (game is null)
        {
            return NotFound();
        }

        if (game.Started)
        {
            return Conflict("Game already started");
        }

        var participation = game.Participants?.FirstOrDefault(p => p.PlayerId == playerId);
        if (participation is not null)
        {
            game.Participants?.Remove(participation);
            await _db.SaveChangesAsync();
        }

        return NoContent();
    }

    [HttpPut("{gameId}")]
    public async Task<IActionResult> Advance(string gameId, [FromBody] AdvanceGameData data)
    {
        var game = await _db.Games.Include(g => g.Participants).FirstOrDefaultAsync(g => g.Id == gameId);
        if (game is null || game.Participants?.Any(p => p.PlayerId == data.PlayerId) != true)
        {
            return NotFound();
        }

        if (!game.Started)
        {
            return Conflict("Game not started yet");
        }

        var participation = game.Participants!.First(p => p.PlayerId == data.PlayerId);
        participation.Lives += data.Result;
        game.NextPlayer = game.Participants?.OrderBy(p => p.Order).ToList()[(participation.Order + 1) % game.Participants.Count].PlayerId;

        await _db.SaveChangesAsync();

        return NoContent();
    }
}
