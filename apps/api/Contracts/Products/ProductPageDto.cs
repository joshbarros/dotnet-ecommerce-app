namespace Ecommerce.Api.Contracts.Products;

public record ProductPageDto(
    IReadOnlyList<ProductDto> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages
);