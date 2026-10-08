using Ecommerce.Api.Data;
using Ecommerce.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Tests;

public static class TestDatabase
{
    public const string ConnectionString =
        "Host=localhost;Port=5432;Database=ecommerce_test;Username=devstore;Password=devstore";

    private static readonly DbContextOptions<StoreDbContext> Options =
        new DbContextOptionsBuilder<StoreDbContext>().UseNpgsql(ConnectionString).Options;

    public static StoreDbContext Create() => new(Options);

    public static async Task<StoreDbContext> OpenAsync()
    {
        var db = Create();
        await db.Database.MigrateAsync();
        return db;
    }

    public static async Task ResetAsync(StoreDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"OrderItems\";");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"Orders\";");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"Products\";");
    }

    public static async Task<int> AddProductAsync(StoreDbContext db, string name, decimal price, int stock)
    {
        var product = new Product
        {
            Name = name,
            Description = "Test product.",
            Price = price,
            Stock = stock,
            Category = "Workspace",
            Kind = "keyboard",
            Color = "#e8eddf",
            Featured = false,
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();
        return product.Id;
    }
}