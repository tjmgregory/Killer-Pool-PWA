using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using KillerPoolApi.Configuration;
using KillerPoolApi.Database;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration.Get<ApiConfig>() ?? throw new("Could not read config.");
builder.WebHost.ConfigureKestrel(
    options =>
    {
        options.ListenAnyIP(
            config.Port,
            listenOptions => { listenOptions.Protocols = HttpProtocols.Http1; });
    });

builder.Services.AddHealthChecks();
builder.Services.AddLogging(
    b => b
#if DEBUG
        .AddConsole()
#else
                    .AddJsonConsole(
                        c =>
                        {
                            c.UseUtcTimestamp = true;
                            c.TimestampFormat = "dd.MM.yyyy - HH:mm:ss";
                        })
#endif
        .AddConfiguration(builder.Configuration));
builder.Services
    .AddDbContext<DataContext>(
        db => db
#if DEBUG
            .EnableDetailedErrors()
            .EnableSensitiveDataLogging()
#endif
            .UseNpgsql(config.Database.ConnectionString));
builder.Services.AddControllers().AddJsonOptions(x =>
{
    x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    x.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});
builder.Services.AddCors(
    o => o.AddDefaultPolicy(
        p => p
            .AllowAnyMethod()
            .SetPreflightMaxAge(TimeSpan.FromHours(1))
            .AllowAnyHeader()
            .AllowAnyOrigin()));

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DataContext>();
    await db.Database.MigrateAsync();
}

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseForwardedHeaders(
        new()
        {
            ForwardedHeaders = ForwardedHeaders.XForwardedProto,
            KnownNetworks = {new IPNetwork(IPAddress.Parse("0.0.0.0"), 0)},
        });
    app.UseHsts();
}

app.UseRouting();
app.UseCors();

app.MapHealthChecks("/healthz");
app.MapControllers();

await app.RunAsync();
