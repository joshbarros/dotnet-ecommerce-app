using System.Net;
using System.Net.Http.Json;
using Ecommerce.Api.Data;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Ecommerce.Api.Tests;

public class ProductsControllerTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;
    public ProductsControllerTests(ApiFactory factory) => _factory = factory;
    private async Task<IReadOnlyList<int>> SeedProductsAsync(params (decimal Price, int Stock)[] products)
    {
        var db = _factory.Services.CreateScope().ServiceProvider.GetRequiredService<StoreDbContext>();
        await TestDatabase.ResetAsync(db);
        var ids = new List<int>();
        foreach (var (price, stock) in products)
            ids.Add(await TestDatabase.AddProductAsync(db, "Test Product", price, stock));
        return ids;
    }

    [Fact]
    public async Task List_ReturnsPagedContract()
    {
        await SeedProductsAsync((10m, 5), (20m, 5), (30m, 5));
        var client = _factory.CreateClient();

        var page = await client.GetFromJsonAsync<PageResult>("/api/products?page=1&pageSize=2");

        Assert.NotNull(page);
        Assert.Equal(2, page!.Items.Length);
        Assert.Equal(3, page.TotalItems);
        Assert.Equal(2, page.TotalPages);
        Assert.All(page.Items, i => Assert.True(i.Price > 0));
    }

    [Fact]
    public async Task Detail_ReturnsProduct()
    {
        var ids = await SeedProductsAsync((10m, 5), (20m, 5));
        var client = _factory.CreateClient();

        var product = await client.GetFromJsonAsync<Product>($"/api/products/{ids[0]}");

        Assert.NotNull(product);
        Assert.Equal(ids[0], product!.Id);
        Assert.Equal(10m, product.Price);
    }

    [Fact]
    public async Task Detail_MissingProduct_ReturnsProblemDetails()
    {
        await SeedProductsAsync((10m, 5));
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/products/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Contains("problem+json", response.Content.Headers.ContentType!.MediaType!);
        var problem = await response.Content.ReadFromJsonAsync<Problem>();
        Assert.Equal(404, problem!.Status);
    }

    [Fact]
    public async Task List_InvalidPage_Returns400()
    {
        await SeedProductsAsync((10m, 5));
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/products?page=0");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private sealed record PageResult(Product[] Items, int Page, int PageSize, int TotalItems, int TotalPages);
    private sealed record Product(int Id, string Name, decimal Price, int Stock, string Category, string Kind, string Color, bool Featured);
    private sealed record Problem(int Status, string Title);
}
