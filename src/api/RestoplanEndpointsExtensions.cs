using Microsoft.AspNetCore.Http.HttpResults;

namespace Restoplan.Api
{
    public static class RestoplanEndpointsExtensions
    {
        public static RouteGroupBuilder MapRestoplanApi(this RouteGroupBuilder group)
        {
            group.MapGet("/", GetProjects);
            group.MapPost("/", CreateProject);
            group.MapGet("/{projectId}", GetProject);
            group.MapPut("/{projectId}", UpdateProject);
            group.MapDelete("/{projectId}", DeleteProject);
            return group;
        }

        public static async Task<Ok<IEnumerable<RestoplanProject>>> GetProjects(ProjectsRepository repository, int? skip = null, int? batchSize = null)
        {
            return TypedResults.Ok(await repository.GetProjectsAsync(skip, batchSize));
        }

        public static async Task<IResult> CreateProject(ProjectsRepository repository, CreateUpdateRestoplanProject project)
        {
            var newProject = new RestoplanProject(project.name)
            {
                Description = project.description,
                Brand = project.brand,
                Type = project.type
            };

            await repository.AddProjectAsync(newProject);

            return TypedResults.Created($"/projects/{newProject.Id}", newProject);
        }

        public static async Task<IResult> GetProject(ProjectsRepository repository, string projectId)
        {
            var project = await repository.GetProjectAsync(projectId);

            return project == null ? TypedResults.NotFound() : TypedResults.Ok(project);
        }

        public static async Task<IResult> UpdateProject(ProjectsRepository repository, string projectId, CreateUpdateRestoplanProject project)
        {
            var existing = await repository.GetProjectAsync(projectId);
            if (existing == null)
            {
                return TypedResults.NotFound();
            }

            existing.Name = project.name;
            existing.Description = project.description;
            existing.Brand = project.brand;
            existing.Type = project.type;
            existing.UpdatedDate = DateTimeOffset.UtcNow;

            await repository.UpdateProject(existing);

            return TypedResults.Ok(existing);
        }

        public static async Task<IResult> DeleteProject(ProjectsRepository repository, string projectId)
        {
            if (await repository.GetProjectAsync(projectId) == null)
            {
                return TypedResults.NotFound();
            }

            await repository.DeleteProjectAsync(projectId);

            return TypedResults.NoContent();
        }
    }

    public record CreateUpdateRestoplanProject(string name, string? description = null, string? brand = null, string? type = null);
}