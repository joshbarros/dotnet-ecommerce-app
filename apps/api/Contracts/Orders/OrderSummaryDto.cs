using Ecommerce.Api.Models;

namespace Ecommerce.Api.Contracts.Orders;

public record OrderSummaryDto(
    int Id,
    DateTimeOffset CreatedAt,
    OrderStatus Status,
    decimal Total,
    int ItemCount
);