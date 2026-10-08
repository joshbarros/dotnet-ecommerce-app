namespace Ecommerce.Api.Models;

public class Order
{
    public int Id { get; set; }
    public string CustomerId { get; set; } = "";
    public string IdempotencyKey { get; set; } = "";
    public OrderStatus Status { get; set; } = OrderStatus.Confirmed;
    public DateTimeOffset CreatedAt { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Shipping { get; set; }
    public decimal Total { get; set; }
    public string DeliveryName { get; set; } = "";
    public string DeliveryEmail { get; set; } = "";
    public string DeliveryPostalCode { get; set; } = "";
    public string DeliveryStreet { get; set; } = "";
    public string DeliveryCity { get; set; } = "";
    public string DeliveryState { get; set; } = "";
    public List<OrderItem> Items { get; set; } = [];
}
