using Ecommerce.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace Ecommerce.Api.Tests;

public class ApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:Store", TestDatabase.ConnectionString);
    }

    public StoreDbContext OpenDb() =>
        Services.CreateScope().ServiceProvider.GetRequiredService<StoreDbContext>();
}