using System.Collections.Concurrent;
using Ecommerce.Api.Contracts.Orders;
using Ecommerce.Api.Models;
using Ecommerce.Api.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Ecommerce.Api.Tests;

public class OrderConcurrencyTests
{
    private static CreateOrderRequest Order(IEnumerable<OrderItemRequest> items) => new(
        items.ToList(),
        new DeliveryRequest(
            "Alex Example", "alex@example.com", "01001-000",
            "123 Example Street", "Sao Paulo", "SP"));

    [Fact]
    public async Task LastUnit_TwoConcurrentPurchases_ProducesAtMostOneOrder()
    {
        var db = await TestDatabase.OpenAsync();
        await TestDatabase.ResetAsync(db);
        var productId = await TestDatabase.AddProductAsync(db, "Rare Item", 50m, 1);

        var created = new ConcurrentBag<int>();
        var failed = new ConcurrentBag<Exception>();

        var tasks = Enumerable.Range(0, 2).Select(n => Task.Run(async () =>
        {
            try
            {
                var service = new OrderService(TestDatabase.Create());
                var (order, _) = await service.CreateOrderAsync(
                    $"customer-{n}", $"idem-{n}",
                    Order([new OrderItemRequest(productId, 1)]));
                created.Add(order.Id);
            }
            catch (Exception ex)
            {
                failed.Add(ex);
            }
        })).ToArray();

        await Task.WhenAll(tasks);

        var check = TestDatabase.Create();
        var stock = await check.Products.Where(p => p.Id == productId).Select(p => p.Stock).FirstAsync();
        var orderCount = await check.Orders.CountAsync();

        Assert.Single(created);
        Assert.Single(failed);
        Assert.Equal(0, stock);
        Assert.Equal(1, orderCount);
    }
}