using Ecommerce.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("api/products")]
public sealed class ProductsController : ControllerBase
{
    private static readonly Product[] Products =
    [
        new(1, "Mechanical Keyboard", "Tactile switches, a compact layout and a warm desk glow.", 349.90m, 12, "Workspace"),
        new(2, "Studio Headphones", "Clear sound and soft cushions for your focus sessions.", 499.90m, 8, "Audio"),
        new(3, "Everyday Backpack", "A lightweight home for your laptop and daily essentials.", 229.90m, 20, "Everyday")
    ];

    [HttpGet]
    public ActionResult<IEnumerable<Product>> GetAll() => Ok(Products);

    [HttpGet("{id:int}")]
    public ActionResult<Product> GetById(int id)
    {
        var product = Products.FirstOrDefault(product => product.Id == id);
        return product is null
            ? Problem(statusCode: 404, title: "Product not found", detail: $"Product {id} does not exist.")
            : Ok(product);
    }
}

