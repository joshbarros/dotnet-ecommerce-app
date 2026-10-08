namespace Ecommerce.Api.Contracts.Orders;

public record DeliveryDto(
    string Name,
    string Email,
    string PostalCode,
    string Street,
    string City,
    string State
);
