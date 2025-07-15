using Azure.Identity;
using Microsoft.Azure.Cosmos;
using SimpleTodo.Api;

var credential = new DefaultAzureCredential();
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<ListsRepository>();
var cosmosEndpoint = builder.Configuration["AZURE_COSMOS_ENDPOINT"];
var cosmosKey = builder.Configuration["AZURE_COSMOS_KEY"];
var cosmosClient = new CosmosClient(cosmosEndpoint, cosmosKey, new CosmosClientOptions
{
    SerializerOptions = new CosmosSerializationOptions
    {
        PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase
    }
});

// Ensure database and containers exist
var databaseName = builder.Configuration["AZURE_COSMOS_DATABASE_NAME"];
await cosmosClient.CreateDatabaseIfNotExistsAsync(databaseName);
var database = cosmosClient.GetDatabase(databaseName);
await database.CreateContainerIfNotExistsAsync("TodoList", "/id");
await database.CreateContainerIfNotExistsAsync("TodoItem", "/listId");

builder.Services.AddSingleton(_ => cosmosClient);
builder.Services.AddCors();
builder.Services.AddApplicationInsightsTelemetry(builder.Configuration);
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
app.UseSwaggerUI(options => {
    options.SwaggerEndpoint("./openapi.yaml", "v1");
    options.RoutePrefix = "";
});

app.UseStaticFiles(new StaticFileOptions{
    // Serve openapi.yaml file
    ServeUnknownFileTypes = true,
});

app.MapGroup("/lists")
    .MapTodoApi()
    .WithOpenApi();
app.Run();