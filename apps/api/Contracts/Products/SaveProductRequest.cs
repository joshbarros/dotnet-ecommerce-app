namespace Ecommerce.Api.Contracts.Products;

public record SaveProductRequest(
    string Name,
    string Description,
    decimal Price,
    int Stock,
    string Category,
    string Kind,
    string Color,
    bool Featured = false
);