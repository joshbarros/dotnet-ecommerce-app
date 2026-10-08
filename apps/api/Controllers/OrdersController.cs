using Ecommerce.Api.Contracts.Orders;
using Ecommerce.Api.Data;
using Ecommerce.Api.Models;
using Ecommerce.Api.Services;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Ecommerce.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/orders")]
public class OrdersController(StoreDbContext db, OrderService orderService, IAntiforgery antiforgery) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<OrderDto>> Create(CreateOrderRequest request)
    {
        if (!await antiforgery.IsRequestValidAsync(HttpContext))
            return ValidationProblem("Missing or invalid antiforgery token.");

        var idempotencyKey = Request.Headers["idempotency-key"].ToString();
        if (string.IsNullOrWhiteSpace(idempotencyKey))
            return ValidationProblem("An Idempotency-Key header is required.");
        if (idempotencyKey.Length > 100)
            return ValidationProblem("Idempotency-Key must be at most 100 characters.");

        var customerId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

        try
        {
            var (order, isReplay) =
                await orderService.CreateOrderAsync(customerId, idempotencyKey, request);
            var dto = ToDto(order);
            return isReplay
                ? Ok(dto)
                : Created($"/api/orders/{order.Id}", dto);
        }
        catch (OrderValidationException ex)
        {
            return ValidationProblem(ex.Message);
        }
        catch (InsufficientStockException ex)
        {
            return Problem(statusCode: StatusCodes.Status409Conflict, title: ex.Message);
        }
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OrderSummaryDto>>> List()
    {
        var customerId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        var orders = await db.Orders.AsNoTracking()
            .Include(o => o.Items)
            .Where(o => o.CustomerId == customerId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(orders.Select(o => new OrderSummaryDto(
            o.Id,
            o.CreatedAt,
            o.Status,
            o.Total,
            o.Items.Sum(i => i.Quantity)
        )).ToList());
    }


    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> Detail(int id)
    {
        var customerId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        var isAdmin = User.IsInRole("Admin");

        var order = await db.Orders.AsNoTracking()
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id && (o.CustomerId == customerId || isAdmin));
        if (order is null)
            return Problem(statusCode: StatusCodes.Status404NotFound, title: "Order not found.");

        return Ok(ToDto(order));
    }

    private static OrderDto ToDto(Order o) => new(
        o.Id,
        o.CreatedAt,
        o.Status,
        o.Items.Select(i => new OrderItemDto(i.ProductId, i.Name, i.Price, i.Quantity)).ToList(),
        o.Subtotal,
        o.Shipping,
        o.Total,
        new DeliveryDto(
            o.DeliveryName,
            o.DeliveryEmail,
            o.DeliveryPostalCode,
            o.DeliveryStreet,
            o.DeliveryCity,
            o.DeliveryState));

}
