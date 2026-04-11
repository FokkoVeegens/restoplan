namespace Restoplan.Api;

public class RestoplanProject
{
    public RestoplanProject(string name)
    {
        Name = name;
    }

    public string? Id { get; set; }
    public string Name { get; set; }
    public string? Description { get; set; }
    public string? Brand { get; set; }
    public string? Type { get; set; }
    public DateTimeOffset CreatedDate { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedDate { get; set; }
}
