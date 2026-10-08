using Ecommerce.Api.Contracts.Orders;
using Ecommerce.Api.Data;
using Ecommerce.Api.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Data;

namespace Ecommerce.Api.Services;

public class OrderService(StoreDbContext db)
{
    private const decimal FreeShippingThreshold = 500m;
    private const decimal ShippingFee = 25m;

    public async Task<(Order Order, bool IsReplay)> CreateOrderAsync(
        string customerId, string idempotencyKey, CreateOrderRequest request)
    {
        if (request.Items is null || request.Items.Count == 0)
            throw new OrderValidationException("At least one item is required.");
        if (request.Delivery is null ||
            string.IsNullOrWhiteSpace(request.Delivery.Name) ||
            string.IsNullOrWhiteSpace(request.Delivery.Email) ||
            string.IsNullOrWhiteSpace(request.Delivery.PostalCode) ||
            string.IsNullOrWhiteSpace(request.Delivery.Street) ||
            string.IsNullOrWhiteSpace(request.Delivery.City) ||
            string.IsNullOrWhiteSpace(request.Delivery.State))
            throw new OrderValidationException("Complete delivery details are required.");

        if (request.Items.Any(i => i.Quantity <= 0))
            throw new OrderValidationException("Quantities must be positive.");

        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await db.Products
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync();
        var byId = products.ToDictionary(p => p.Id);

        foreach (var item in request.Items)
            if (!byId.ContainsKey(item.ProductId))
                throw new OrderValidationException($"Product {item.ProductId} not found.");

        decimal subtotal = 0m;
        foreach (var item in request.Items)
            subtotal += byId[item.ProductId].Price * item.Quantity;

        decimal shipping = subtotal >= FreeShippingThreshold ? 0m : ShippingFee;
        decimal total = subtotal + shipping;

        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        var existing = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.CustomerId == customerId && o.IdempotencyKey == idempotencyKey);
        if (existing is not null)
        {
            await tx.CommitAsync();
            return (existing, true);
        }

        foreach (var item in request.Items)
        {
            var updated = await db.Products
                .Where(p => p.Id == item.ProductId && p.Stock >= item.Quantity)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.Stock, p => p.Stock - item.Quantity));
            if (updated != 1)
                throw new InsufficientStockException($"Insufficient stock for '{byId[item.ProductId].Name}'.");
        }

        var order = new Order
        {
            CustomerId = customerId,
            IdempotencyKey = idempotencyKey,
            Status = OrderStatus.Confirmed,
            CreatedAt = DateTimeOffset.UtcNow,
            Subtotal = subtotal,
            Shipping = shipping,
            Total = total,
            DeliveryName = request.Delivery!.Name,
            DeliveryEmail = request.Delivery!.Email,
            DeliveryPostalCode = request.Delivery!.PostalCode,
            DeliveryStreet = request.Delivery!.Street,
            DeliveryCity = request.Delivery!.City,
            DeliveryState = request.Delivery!.State,
            Items = request.Items.Select(i => new OrderItem
            {
                ProductId = i.ProductId,
                Name = byId[i.ProductId].Name,
                Price = byId[i.ProductId].Price,
                Quantity = i.Quantity,
            }).ToList(),
        };
        db.Orders.Add(order);

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            await tx.RollbackAsync();
            var replay = await db.Orders
                .AsNoTracking()
                .Include(o => o.Items)
                .FirstAsync(o => o.CustomerId == customerId && o.IdempotencyKey == idempotencyKey);
            return (replay, true);
        }

        await tx.CommitAsync();
        return (order, false);
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is PostgresException { SqlState: "23505" };
}

public class OrderValidationException(string message) : Exception(message);

public class InsufficientStockException(string message) : Exception(message);
