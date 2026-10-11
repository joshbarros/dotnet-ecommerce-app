namespace Ecommerce.Api.Contracts.Orders;

public record AdminOrderPageDto(
    IReadOnlyList<OrderSummaryDto> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages);
