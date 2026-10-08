using Ecommerce.Api.Contracts.Auth;
using Ecommerce.Api.Models;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    UserManager<Customer> userManager,
    SignInManager<Customer> signInManager,
    IAntiforgery antiforgery
) : ControllerBase
{
    [HttpPost("register")]
    [IgnoreAntiforgeryToken]
    public async Task<ActionResult<CustomerDto>> Register(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return ValidationProblem("Name is required.");
        if (string.IsNullOrWhiteSpace(request.Email))
            return ValidationProblem("Email is required.");
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
            return ValidationProblem("Password must be at least 8 characters.");

        var customer = new Customer
        {
            UserName = request.Email,
            Email = request.Email,
            Name = request.Name,
        };

        var result = await userManager.CreateAsync(customer, request.Password);
        if (!result.Succeeded)
            return ValidationProblem(result.Errors.FirstOrDefault()?.Description ?? "Registration failed.");

        await signInManager.SignInAsync(customer, isPersistent: false);
        SetAntiforgeryTokens();
        return Ok(await ToDtoAsync(customer));
    }

    [HttpPost("login")]
    [IgnoreAntiforgeryToken]
    public async Task<ActionResult<CustomerDto>> Login(LoginRequest request)
    {
        var customer = await userManager.FindByEmailAsync(request.Email);
        if (customer is null)
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Invalid credentials.");

        var result = await signInManager.PasswordSignInAsync(customer, request.Password, isPersistent: false, lockoutOnFailure: false);
        if (!result.Succeeded)
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Invalid credentials.");

        SetAntiforgeryTokens();
        return Ok(await ToDtoAsync(customer));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await signInManager.SignOutAsync();
        return NoContent();
    }

    private void SetAntiforgeryTokens()
    {
        var tokens = antiforgery.GetAndStoreTokens(HttpContext);
        Response.Headers["X-CSRF-TOKEN"] = tokens.RequestToken!;
    }

    private async Task<CustomerDto> ToDtoAsync(Customer customer) => new(
        customer.Id,
        customer.Name,
        customer.Email!,
        (await userManager.GetRolesAsync(customer)).ToList());
}
