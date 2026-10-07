namespace Ecommerce.Api.Contracts.Auth;

public record CustomerDto(
    string Id,
    string Name,
    string Email,
    IReadOnlyList<string> Roles
);