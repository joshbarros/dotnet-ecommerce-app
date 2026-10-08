using Microsoft.AspNetCore.Identity;

namespace Ecommerce.Api.Models;

public class Customer : IdentityUser
{
    public string Name { get; set; } = "";
}
