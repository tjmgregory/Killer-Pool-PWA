using Npgsql;

namespace KillerPoolApi.Configuration;

public sealed class DatabaseConfig
{
    public string ConnectionString => new NpgsqlConnectionStringBuilder
    {
        Host = Host,
        Database = Database,
        SearchPath = Schema,
        Username = User,
        Password = Pass,
        SslMode = SslMode.Disable,
        Pooling = true,
        MaxPoolSize = 10,
    }.ToString();

    public string Host { get; init; } = string.Empty;

    public string Database { get; init; } = string.Empty;

    public string Schema { get; init; } = string.Empty;

    public string User { get; init; } = string.Empty;

    public string Pass { get; init; } = string.Empty;
}
