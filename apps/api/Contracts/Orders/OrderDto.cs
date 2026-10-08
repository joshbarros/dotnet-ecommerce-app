using Ecommerce.Api.Models;

namespace Ecommerce.Api.Contracts.Orders;

public record OrderDto(
    int Id,
    DateTimeOffset CreatedAt,
    OrderStatus Status,
    IReadOnlyList<OrderItemDto> Items,
    decimal Subtotal,
    decimal Shipping,
    decimal Total,
    DeliveryDto Delivery
);
