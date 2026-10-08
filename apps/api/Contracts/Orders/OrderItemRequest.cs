namespace Ecommerce.Api.Contracts.Orders;

public record OrderItemRequest(
    int ProductId,
    int Quantity
);
