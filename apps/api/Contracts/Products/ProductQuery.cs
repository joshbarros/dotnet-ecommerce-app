namespace Ecommerce.Api.Contracts.Products;

public class ProductQuery
{
    public string? Q { get; set; }
    public string? Category { get; set; }
    public string? Sort { get; set; } = "featured";
    public bool? InStock { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 6;
}