using System.Net;
using System.Net.Http.Json;
using Ecommerce.Api.Contracts.Orders;
using Ecommerce.Api.Data;
using Ecommerce.Api.Models;
using Ecommerce.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Ecommerce.Api.Tests;

public class AdminOrdersTests : IClassFixture<ApiFactory>
{
    private const string AdminEmail = "admin@e2e.local";
    private const string AdminPassword = "AdminPass!123";
    private readonly ApiFactory _factory;

    public AdminOrdersTests(ApiFactory factory)
    {
        _factory = factory;
        SeedAdminAsync().GetAwaiter().GetResult();
    }

    private async Task SeedAdminAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<Customer>>();
        var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        if (!await roles.RoleExistsAsync("Admin"))
            await roles.CreateAsync(new IdentityRole("Admin"));
        if (await users.FindByEmailAsync(AdminEmail) is null)
        {
            var admin = new Customer
            {
                UserName = AdminEmail,
                Email = AdminEmail,
                Name = "Store Admin",
                EmailConfirmed = true,
            };
            var result = await users.CreateAsync(admin, AdminPassword);
            if (result.Succeeded)
                await users.AddToRoleAsync(admin, "Admin");
        }
    }

    [Fact]
    public async Task List_Anonymous_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/admin/orders");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task List_RegularCustomer_Returns403()
    {
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/api/auth/register",
            new { name = "Shopper", email = $"u-{Guid.NewGuid():N}@example.com", password = "Pass!word1" });

        var response = await client.GetAsync("/api/admin/orders");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Admin_CanListAndAdvanceOrderStatus()
    {
        var (client, csrf) = await CreateAdminClientAsync();

        var db = _factory.Services.CreateScope().ServiceProvider.GetRequiredService<StoreDbContext>();
        await TestDatabase.ResetAsync(db);
        var productId = await TestDatabase.AddProductAsync(db, "Test Product", 40m, 5);
        using var serviceScope = _factory.Services.CreateScope();
        var service = serviceScope.ServiceProvider.GetRequiredService<OrderService>();
        var (order, _) = await service.CreateOrderAsync(
            "customer-1", "idem-" + Guid.NewGuid().ToString("N"),
            new CreateOrderRequest(
                [new OrderItemRequest(productId, 1)],
                new DeliveryRequest("A", "a@a.com", "00000-000", "Street", "City", "SP")));

        var list = await client.GetFromJsonAsync<AdminPage>("/api/admin/orders?page=1&pageSize=20");
        Assert.NotNull(list);
        Assert.Contains(list!.Items, i => i.Id == order.Id);

        var patch = await PatchAsync(client, csrf, $"/api/admin/orders/{order.Id}/status", "Preparing");
        Assert.Equal(HttpStatusCode.OK, patch.StatusCode);
        var updated = await patch.Content.ReadFromJsonAsync<OrderDto>();
        Assert.Equal(OrderStatus.Preparing, updated!.Status);

        var revert = await PatchAsync(client, csrf, $"/api/admin/orders/{order.Id}/status", "Confirmed");
        Assert.Equal(HttpStatusCode.BadRequest, revert.StatusCode);
    }

    private static Task<HttpResponseMessage> PatchAsync(
        HttpClient client, string csrf, string url, string status)
    {
        var request = new HttpRequestMessage(HttpMethod.Patch, url)
        {
            Content = JsonContent.Create(new { status }),
        };
        request.Headers.Add("X-CSRF-TOKEN", csrf);
        return client.SendAsync(request);
    }

    private async Task<(HttpClient Client, string Csrf)> CreateAdminClientAsync()
    {
        var client = _factory.CreateClient();
        var login = await client.PostAsJsonAsync("/api/auth/login",
            new { email = AdminEmail, password = AdminPassword });
        login.EnsureSuccessStatusCode();
        var csrf = login.Headers.GetValues("X-CSRF-TOKEN").FirstOrDefault() ?? "";
        return (client, csrf);
    }

    private sealed record AdminPage(OrderSummary[] Items, int Page, int PageSize, int TotalItems, int TotalPages);
    private sealed record OrderSummary(int Id, string CreatedAt, string Status, decimal Total, int ItemCount);
}
