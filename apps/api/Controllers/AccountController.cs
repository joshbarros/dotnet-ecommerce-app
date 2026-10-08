using Ecommerce.Api.Contracts.Account;
using Ecommerce.Api.Contracts.Auth;
using Ecommerce.Api.Models;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Ecommerce.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/account")]
public class AccountController(UserManager<Customer> userManager, IAntiforgery antiforgery) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<CustomerDto>> Me()
    {
        var customer = await LoadAsync();
        if (customer is null)
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Unauthorized.");
        return Ok(await ToDto(customer));
    }

    [HttpPut]
    public async Task<ActionResult<CustomerDto>> Update(UpdateProfileRequest request)
    {
        if (!await antiforgery.IsRequestValidAsync(HttpContext))
            return ValidationProblem("Missing or invalid antiforgery token.");

        if (string.IsNullOrWhiteSpace(request.Name))
            return ValidationProblem("Name is required.");

        var customer = await LoadAsync();
        if (customer is null)
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Unauthorized.");

        customer.Name = request.Name;
        await userManager.UpdateAsync(customer);

        return Ok(await ToDto(customer));
    }

    private Task<Customer?> LoadAsync() => userManager.FindByIdAsync(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "");

    private async Task<CustomerDto> ToDto(Customer customer) => new(
        customer.Id,
        customer.Name,
        customer.Email!,
        (await userManager.GetRolesAsync(customer)).ToList()
    );
}
