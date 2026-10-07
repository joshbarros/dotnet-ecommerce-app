namespace Ecommerce.Api.Contracts.Auth;

public record RegisterRequest(
    string Name,
    string Email,
    string Password
);