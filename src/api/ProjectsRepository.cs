using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Cosmos.Linq;

namespace Restoplan.Api;

public class ProjectsRepository
{
    private readonly Container _projectsCollection;

    public ProjectsRepository(CosmosClient client, IConfiguration configuration)
    {
        var database = client.GetDatabase(configuration["AZURE_COSMOS_DATABASE_NAME"]);
        _projectsCollection = database.GetContainer("RestoplanProject");
    }

    public async Task<IEnumerable<RestoplanProject>> GetProjectsAsync(int? skip, int? batchSize)
    {
        return await ToListAsync(
            _projectsCollection.GetItemLinqQueryable<RestoplanProject>(),
            skip,
            batchSize);
    }

    public async Task<RestoplanProject?> GetProjectAsync(string projectId)
    {
        try
        {
            var response = await _projectsCollection.ReadItemAsync<RestoplanProject>(projectId, new PartitionKey(projectId));
            return response?.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task DeleteProjectAsync(string projectId)
    {
        await _projectsCollection.DeleteItemAsync<RestoplanProject>(projectId, new PartitionKey(projectId));
    }

    public async Task AddProjectAsync(RestoplanProject project)
    {
        project.Id = Guid.NewGuid().ToString("N");
        await _projectsCollection.UpsertItemAsync(project, new PartitionKey(project.Id));
    }

    public async Task UpdateProjectAsync(RestoplanProject project)
    {
        await _projectsCollection.ReplaceItemAsync(project, project.Id, new PartitionKey(project.Id));
    }

    private async Task<List<T>> ToListAsync<T>(IQueryable<T> queryable, int? skip, int? batchSize)
    {
        if (skip != null)
        {
            queryable = queryable.Skip(skip.Value);
        }

        if (batchSize != null)
        {
            queryable = queryable.Take(batchSize.Value);
        }

        using FeedIterator<T> iterator = queryable.ToFeedIterator();
        var items = new List<T>();

        while (iterator.HasMoreResults)
        {
            foreach (var item in await iterator.ReadNextAsync())
            {
                items.Add(item);
            }
        }

        return items;
    }
}
