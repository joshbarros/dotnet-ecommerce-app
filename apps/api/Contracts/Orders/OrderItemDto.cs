namespace Ecommerce.Api.Contracts.Orders;

public record OrderItemDto(
    int ProductId,
    string Name,
    decimal Price,
    int Quantity
);
