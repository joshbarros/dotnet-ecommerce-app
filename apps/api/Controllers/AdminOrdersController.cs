using Ecommerce.Api.Contracts.Orders;
using Ecommerce.Api.Data;
using Ecommerce.Api.Models;
using Ecommerce.Api.Services;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin/orders")]
public class AdminOrdersController(StoreDbContext db, OrderService orderService, IAntiforgery antiforgery)
    : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<AdminOrderPageDto>> List(int page = 1, int pageSize = 20)
    {
        if (page < 1)
            return ValidationProblem("Page must be a positive integer.");
        if (pageSize is < 1 or > 50)
            return ValidationProblem("PageSize must be between 1 and 50.");

        var query = db.Orders.AsNoTracking();
        var totalItems = await query.CountAsync();
        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new OrderSummaryDto(
                o.Id,
                o.CreatedAt,
                o.Status,
                o.Total,
                o.Items.Sum(i => i.Quantity)))
            .ToListAsync();

        return new AdminOrderPageDto(
            items,
            page,
            pageSize,
            totalItems,
            (int)Math.Ceiling(totalItems / (double)pageSize));
    }

    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<OrderDto>> UpdateStatus(int id, UpdateOrderStatusRequest request)
    {
        if (!await antiforgery.IsRequestValidAsync(HttpContext))
            return ValidationProblem("Missing or invalid antiforgery token.");

        if (string.IsNullOrWhiteSpace(request.Status))
            return ValidationProblem("Status is required.");

        try
        {
            var order = await orderService.UpdateOrderStatusAsync(id, request.Status);
            if (order is null)
                return Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Order not found.");
            return Ok(ToDto(order));
        }
        catch (OrderValidationException ex)
        {
            return ValidationProblem(ex.Message);
        }
    }

    private static OrderDto ToDto(Order order) => new(
        order.Id,
        order.CreatedAt,
        order.Status,
        order.Items.Select(i => new OrderItemDto(i.ProductId, i.Name, i.Price, i.Quantity)).ToList(),
        order.Subtotal,
        order.Shipping,
        order.Total,
        new DeliveryDto(
            order.DeliveryName,
            order.DeliveryEmail,
            order.DeliveryPostalCode,
            order.DeliveryStreet,
            order.DeliveryCity,
            order.DeliveryState));
}
