using Ecommerce.Api.Contracts.Products;
using Ecommerce.Api.Data;
using Ecommerce.Api.Models;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Drawing;
using System.Text.RegularExpressions;

namespace Ecommerce.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin/products")]
public class AdminProductsController(StoreDbContext db, IAntiforgery antiforgery) : ControllerBase
{
    private static readonly string[] Kinds = ["keyboard", "headphones", "backpack", "lamp", "mouse", "bottle"];
    private static readonly string[] Categories = ["Workspace", "Audio", "Everyday"];

    [HttpPost]
    public async Task<ActionResult<ProductDto>> Create(SaveProductRequest request)
    {
        if (!await antiforgery.IsRequestValidAsync(HttpContext))
            return ValidationProblem("Missing or invalid antiforgery token.");

        string? error = ValidateRequest(request);
        if (error is not null)
            return ValidationProblem(error);

        var product = new Product
        {
            Name = request.Name.Trim(),
            Description = request.Description,
            Price = request.Price,
            Stock = request.Stock,
            Category = request.Category,
            Kind = request.Kind,
            Color = request.Color,
            Featured = request.Featured,
        };

        db.Products.Add(product);
        await db.SaveChangesAsync();

        return Created($"/api/products/{product.Id}", ToDto(product));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProductDto>> Update(int id, SaveProductRequest request)
    {
        if (!await antiforgery.IsRequestValidAsync(HttpContext))
            return ValidationProblem("Missing or invalid antiforgery token.");

        string? error = ValidateRequest(request);
        if (error is not null)
            return ValidationProblem(error);

        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product is null)
            return Problem(statusCode: StatusCodes.Status404NotFound, title: "Product not found.");

        product.Name = request.Name.Trim();
        product.Description = request.Description;
        product.Price = request.Price;
        product.Stock = request.Stock;
        product.Category = request.Category;
        product.Kind = request.Kind;
        product.Color = request.Color;
        product.Featured = request.Featured;

        await db.SaveChangesAsync();
        return Ok(ToDto(product));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!await antiforgery.IsRequestValidAsync(HttpContext))
            return ValidationProblem("Missing or invalid antiforgery token.");

        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product is null)
            return Problem(statusCode: StatusCodes.Status404NotFound, title: "Product not found.");

        db.Products.Remove(product);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static string? ValidateRequest(SaveProductRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length > 100)
            return "Name must be 1 to 100 characters.";
        if (request.Description is not null && request.Description.Length > 1000)
            return "Description must be at most 1000 characters.";
        if (request.Price <= 0)
            return "Price must be positive.";
        if (request.Stock < 0)
            return "Stock must be zero or greater.";
        if (!Categories.Contains(request.Category))
            return "Category must be one of: Workspace, Audio, Everyday.";
        if (!Kinds.Contains(request.Kind))
            return "Kind must be one of: keyboard, headphones, backpack, lamp, mouse, bottle.";
        if (string.IsNullOrWhiteSpace(request.Color) || !Regex.IsMatch(request.Color, "^#[0-9a-fA-F]{6}$"))
            return "Color must be a six-digit hex color like #e8eddf.";
        return null;
    }

    private static ProductDto ToDto(Product p) => new(
        p.Id,
        p.Name,
        p.Description,
        p.Price,
        p.Stock,
        p.Category,
        p.Kind,
        p.Color,
        p.Featured
    );
}
