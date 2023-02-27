namespace KillerPoolApi.Models;

public class AdvanceGameData
{
    public Guid PlayerId { get; set; }
    /// <summary>
    /// Can be either:
    /// -1 (lose a life)
    /// 0 (stay same)
    /// +1 (gain a life)
    /// </summary>
    public short Result { get; set; }
}
