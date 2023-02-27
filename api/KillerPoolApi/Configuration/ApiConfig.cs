namespace KillerPoolApi.Configuration;

public class ApiConfig
{
    public DatabaseConfig Database { get; set; } = new();
    
    public ushort Port => Environment.GetEnvironmentVariable("PORT") != null
        ? ushort.Parse(Environment.GetEnvironmentVariable("PORT")!)
        : (ushort)5000;
}
