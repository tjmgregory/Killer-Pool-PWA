using Npgsql;

namespace KillerPoolApi.Configuration;

public sealed class PushConfig
{
    public string Subject { get; init; } = string.Empty;

    public string PublicKey { get; init; } = string.Empty;

    public string PrivateKey { get; init; } = string.Empty;
}
