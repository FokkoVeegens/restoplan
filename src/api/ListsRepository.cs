using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Cosmos.Linq;

namespace Restoplan.Api;

public class ListsRepository
{
    private readonly Container _listsCollection;
    private readonly Container _itemsCollection;

    public ListsRepository(CosmosClient client, IConfiguration configuration)
    {
        var database = client.GetDatabase(configuration["AZURE_COSMOS_DATABASE_NAME"]);
        _listsCollection = database.GetContainer("RestoplanList");
        _itemsCollection = database.GetContainer("RestoplanItem");
    }

    public async Task<IEnumerable<RestoplanList>> GetListsAsync(int? skip, int? batchSize)
    {
        return await ToListAsync(
            _listsCollection.GetItemLinqQueryable<RestoplanList>(),
            skip,
            batchSize);
    }

    public async Task<RestoplanList?> GetListAsync(string listId)
    {
        var response = await _listsCollection.ReadItemAsync<RestoplanList>(listId, new PartitionKey(listId));
        return response?.Resource;
    }

    public async Task DeleteListAsync(string listId)
    {
        await _listsCollection.DeleteItemAsync<RestoplanList>(listId, new PartitionKey(listId));
    }

    public async Task AddListAsync(RestoplanList list)
    {
        list.Id = Guid.NewGuid().ToString("N");
        await _listsCollection.UpsertItemAsync(list, new PartitionKey(list.Id));
    }

    public async Task UpdateList(RestoplanList existingList)
    {
        await _listsCollection.ReplaceItemAsync(existingList, existingList.Id, new PartitionKey(existingList.Id));
    }

    public async Task<IEnumerable<RestoplanItem>> GetListItemsAsync(string listId, int? skip, int? batchSize)
    {
        return await ToListAsync(
            _itemsCollection.GetItemLinqQueryable<RestoplanItem>().Where(i => i.ListId == listId),
            skip,
            batchSize);
    }

    public async Task<IEnumerable<RestoplanItem>> GetListItemsByStateAsync(string listId, string state, int? skip, int? batchSize)
    {
        return await ToListAsync(
            _itemsCollection.GetItemLinqQueryable<RestoplanItem>().Where(i => i.ListId == listId && i.State == state),
            skip,
            batchSize);
    }

    public async Task AddListItemAsync(RestoplanItem item)
    {
        item.Id = Guid.NewGuid().ToString("N");
        await _itemsCollection.UpsertItemAsync(item, new PartitionKey(item.ListId));
    }

    public async Task<RestoplanItem?> GetListItemAsync(string listId, string itemId)
    {
        var response = await _itemsCollection.ReadItemAsync<RestoplanItem>(itemId, new PartitionKey(listId));
        if (response?.Resource.ListId != listId)
        {
            return null;
        }
        return response.Resource;
    }

    public async Task DeleteListItemAsync(string listId, string itemId)
    {
        await _itemsCollection.DeleteItemAsync<RestoplanItem>(itemId, new PartitionKey(listId));
    }

    public async Task UpdateListItem(RestoplanItem existingItem)
    {
        await _itemsCollection.ReplaceItemAsync(existingItem, existingItem.Id, new PartitionKey(existingItem.ListId));
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