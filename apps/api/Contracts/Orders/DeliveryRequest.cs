namespace Ecommerce.Api.Contracts.Orders;

public record DeliveryRequest(
    string Name,
    string Email,
    string PostalCode,
    string Street,
    string City,
    string State
);
