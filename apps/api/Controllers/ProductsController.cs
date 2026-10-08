using Ecommerce.Api.Contracts.Products;
using Ecommerce.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL;

namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController(StoreDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ProductPageDto>> List([FromQuery] ProductQuery query)
    {
        if (query.Page < 1)
            return ValidationProblem("Page must be a positive integer.");
        if (query.PageSize is < 1 or > 50)
            return ValidationProblem("PageSize must be between 1 and 50.");
        if (query.Sort is not null && query.Sort is not ("featured" or "price-low" or "price-high" or "name"))
            return ValidationProblem("Sort must be one of: featured, price-low, price-high, name.");

        var queryable = db.Products.AsNoTracking();

        if (query.Category is not null)
            queryable = queryable.Where(p => p.Category == query.Category);
        if (query.InStock is true)
            queryable = queryable.Where(p => p.Stock > 0);
        if (!string.IsNullOrWhiteSpace(query.Q))
        {
            var q = $"%{query.Q.Trim()}%";
            queryable = queryable.Where(p =>
                EF.Functions.ILike(p.Name + " " + p.Description + " " + p.Category, q));
        }

        queryable = query.Sort switch
        {
            "price-low" => queryable.OrderBy(p => p.Price),
            "price-high" => queryable.OrderByDescending(p => p.Price),
            "name" => queryable.OrderBy(p => p.Name),
            _ => queryable.OrderByDescending(p => p.Featured).ThenBy(p => p.Id),
        };

        var totalItems = await queryable.CountAsync();
        var items = await queryable
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(p => new ProductDto(p.Id, p.Name, p.Description, p.Price, p.Stock, p.Category, p.Kind, p.Color, p.Featured))
            .ToListAsync();

        return new ProductPageDto(
            items,
            query.Page,
            query.PageSize,
            totalItems,
            (int)Math.Ceiling(totalItems / (double)query.PageSize));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDto>> Detail(int id)
    {
        var product = await db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
        if (product is null)
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Product not found.",
                detail: $"No product with id {id}.");
        return new ProductDto(product.Id, product.Name, product.Description, product.Price, product.Stock, product.Category, product.Kind, product.Color, product.Featured);
    }
}
