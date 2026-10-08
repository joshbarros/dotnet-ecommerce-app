namespace Ecommerce.Api.Contracts.Orders;

public record CreateOrderRequest(
    IReadOnlyList<OrderItemRequest> Items,
    DeliveryRequest? Delivery
);
