using Azure.Identity;
using Microsoft.Azure.Cosmos;
using Restoplan.Api;

var credential = new DefaultAzureCredential();
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<ProjectsRepository>();
var cosmosEndpoint = builder.Configuration["AZURE_COSMOS_ENDPOINT"];
var cosmosKey = builder.Configuration["AZURE_COSMOS_KEY"];
var cosmosClientOptions = new CosmosClientOptions
{
    SerializerOptions = new CosmosSerializationOptions
    {
        PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase
    }
};

// Allow the self-signed certificate used by the Azure Cosmos DB local emulator.
// The CosmosClient (and its internal HttpClient) is registered as a singleton and
// lives for the lifetime of the application, so disposal is managed by the host shutdown.
if (Uri.TryCreate(cosmosEndpoint, UriKind.Absolute, out var cosmosUri) && cosmosUri.IsLoopback)
{
    cosmosClientOptions.HttpClientFactory = () => new HttpClient(new HttpClientHandler
    {
        ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
    });
    cosmosClientOptions.ConnectionMode = ConnectionMode.Gateway;
    // Skip account-metadata discovery (GET /) which the emulator rejects; go directly
    // to data-plane operations.  Safe for the emulator; has no effect in production.
    cosmosClientOptions.LimitToEndpoint = true;
}

var cosmosClient = new CosmosClient(cosmosEndpoint, cosmosKey, cosmosClientOptions);

// Ensure database and containers exist.
// For loopback (emulator) connections the service may still be initializing even
// after the health check passes, so retry a few times before giving up.
var databaseName = builder.Configuration["AZURE_COSMOS_DATABASE_NAME"];
var maxInitAttempts = cosmosUri?.IsLoopback == true ? 3 : 1;
for (var attempt = 1; attempt <= maxInitAttempts; attempt++)
{
    try
    {
        await cosmosClient.CreateDatabaseIfNotExistsAsync(databaseName);
        var database = cosmosClient.GetDatabase(databaseName);
        await database.CreateContainerIfNotExistsAsync("RestoplanProject", "/id");
        break;
    }
    catch (Exception) when (attempt < maxInitAttempts)
    {
        Console.Error.WriteLine($"Cosmos DB not ready (attempt {attempt}/{maxInitAttempts}), retrying in 5s...");
        await Task.Delay(5000);
    }
}

builder.Services.AddSingleton(_ => cosmosClient);
builder.Services.AddCors();
// Only register Application Insights when a connection string is available; otherwise
// the SDK throws a DI exception at startup (e.g. in local/CI environments without telemetry).
if (!string.IsNullOrEmpty(builder.Configuration["APPLICATIONINSIGHTS_CONNECTION_STRING"]))
{
    builder.Services.AddApplicationInsightsTelemetry(builder.Configuration);
}
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
var app = builder.Build();

app.UseCors(policy =>
{
    policy.AllowAnyOrigin();
    policy.AllowAnyHeader();
    policy.AllowAnyMethod();
});

// Swagger UI
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("./openapi.yaml", "v1");
    options.RoutePrefix = "";
});

app.UseStaticFiles(new StaticFileOptions
{
    // Serve openapi.yaml file
    ServeUnknownFileTypes = true,
});

app.MapGroup("/projects")
    .MapRestoplanApi();
app.Run();