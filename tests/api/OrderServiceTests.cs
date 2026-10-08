using Ecommerce.Api.Contracts.Orders;
using Ecommerce.Api.Models;
using Ecommerce.Api.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Ecommerce.Api.Tests;

public class OrderServiceTests
{
    private const string CustomerId = "customer-test";

    private static string Idem() => "idem-" + Guid.NewGuid().ToString("N");

    private static CreateOrderRequest Order(IEnumerable<OrderItemRequest> items) => new(
        items.ToList(),
        new DeliveryRequest(
            "Alex Example", "alex@example.com", "01001-000",
            "123 Example Street", "Sao Paulo", "SP"));

    private static async Task<int> SeedProductAsync(decimal price, int stock)
    {
        var db = await TestDatabase.OpenAsync();
        await TestDatabase.ResetAsync(db);
        return await TestDatabase.AddProductAsync(db, "Test Product", price, stock);
    }

    [Fact]
    public async Task CreateOrder_ComputesSubtotalShippingAndTotal()
    {
        var productId = await SeedProductAsync(100m, 10);

        var (order, isReplay) = await new OrderService(TestDatabase.Create())
            .CreateOrderAsync(CustomerId, Idem(), Order([new OrderItemRequest(productId, 2)]));

        Assert.False(isReplay);
        Assert.Equal(200m, order.Subtotal);
        Assert.Equal(25m, order.Shipping);
        Assert.Equal(225m, order.Total);
        Assert.Single(order.Items);
        Assert.Equal("Test Product", order.Items[0].Name);
        Assert.Equal(100m, order.Items[0].Price);
        Assert.Equal(2, order.Items[0].Quantity);
    }

    [Fact]
    public async Task CreateOrder_FreeShippingAtOrAboveThreshold()
    {
        var productId = await SeedProductAsync(250m, 5);

        var (order, _) = await new OrderService(TestDatabase.Create())
            .CreateOrderAsync(CustomerId, Idem(), Order([new OrderItemRequest(productId, 2)]));

        Assert.Equal(500m, order.Subtotal);
        Assert.Equal(0m, order.Shipping);
        Assert.Equal(500m, order.Total);
    }

    [Fact]
    public async Task CreateOrder_EmptyItems_Throws()
    {
        await SeedProductAsync(10m, 5);

        await Assert.ThrowsAsync<OrderValidationException>(
            () => new OrderService(TestDatabase.Create())
                .CreateOrderAsync(CustomerId, Idem(), Order([])));
    }

    [Fact]
    public async Task CreateOrder_NonPositiveQuantity_Throws()
    {
        var productId = await SeedProductAsync(10m, 5);

        await Assert.ThrowsAsync<OrderValidationException>(
            () => new OrderService(TestDatabase.Create())
                .CreateOrderAsync(CustomerId, Idem(), Order([new OrderItemRequest(productId, 0)])));
    }

    [Fact]
    public async Task CreateOrder_UnknownProduct_Throws()
    {
        await SeedProductAsync(10m, 5);

        await Assert.ThrowsAsync<OrderValidationException>(
            () => new OrderService(TestDatabase.Create())
                .CreateOrderAsync(CustomerId, Idem(), Order([new OrderItemRequest(999999, 1)])));
    }

    [Fact]
    public async Task CreateOrder_DecrementsStock()
    {
        var productId = await SeedProductAsync(10m, 5);

        await new OrderService(TestDatabase.Create())
            .CreateOrderAsync(CustomerId, Idem(), Order([new OrderItemRequest(productId, 2)]));

        var db = TestDatabase.Create();
        var stock = await db.Products.Where(p => p.Id == productId).Select(p => p.Stock).FirstAsync();
        Assert.Equal(3, stock);
    }

    [Fact]
    public async Task CreateOrder_InsufficientStock_LeavesInventoryUnchanged()
    {
        var productId = await SeedProductAsync(10m, 1);

        await Assert.ThrowsAsync<InsufficientStockException>(
            () => new OrderService(TestDatabase.Create())
                .CreateOrderAsync(CustomerId, Idem(), Order([new OrderItemRequest(productId, 2)])));

        var db = TestDatabase.Create();
        Assert.Equal(1, await db.Products.Where(p => p.Id == productId).Select(p => p.Stock).FirstAsync());
        Assert.Equal(0, await db.Orders.CountAsync());
    }

    [Fact]
    public async Task CreateOrder_SameIdempotencyKey_ReturnsSameOrder()
    {
        var productId = await SeedProductAsync(10m, 5);
        var service = new OrderService(TestDatabase.Create());
        var key = Idem();
        var request = Order([new OrderItemRequest(productId, 2)]);

        var (first, replayA) = await service.CreateOrderAsync(CustomerId, key, request);
        var (second, replayB) = await service.CreateOrderAsync(CustomerId, key, request);

        Assert.False(replayA);
        Assert.True(replayB);
        Assert.Equal(first.Id, second.Id);

        var db = TestDatabase.Create();
        Assert.Equal(3, await db.Products.Where(p => p.Id == productId).Select(p => p.Stock).FirstAsync());
        Assert.Equal(1, await db.Orders.CountAsync());
    }
}
