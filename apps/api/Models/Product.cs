namespace Ecommerce.Api.Models;

public sealed record Product(int Id, string Name, string Description, decimal Price, int Stock, string Category);

