using Ecommerce.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Data;

public static class DevelopmentSeeder
{
    private const string AdminEmail = "admin@devstore.local";
    private const string AdminPassword = "DevStoreAdmin!42";

    public static async Task SeedIdentityAsync(UserManager<Customer> users, RoleManager<IdentityRole> roles)
    {
        if (!await roles.RoleExistsAsync("Admin"))
            await roles.CreateAsync(new IdentityRole("Admin"));

        if (await users.FindByEmailAsync(AdminEmail) is null)
        {
            var admin = new Customer
            {
                UserName = AdminEmail,
                Email = AdminEmail,
                Name = "Store Admin",
                EmailConfirmed = true,
            };
            var result = await users.CreateAsync(admin, AdminPassword);
            if (result.Succeeded)
                await users.AddToRoleAsync(admin, "Admin");
        }
    }

    public static async Task SeedProductsAsync(StoreDbContext db)
    {
        if (await db.Products.AnyAsync())
            return;

        db.Products.AddRange(
            new Product { Id = 1, Name = "Mechanical Keyboard", Description = "Tactile switches, a compact layout and a warm desk glow. A considered companion for your best work.", Price = 349.9m, Stock = 12, Category = "Workspace", Kind = "keyboard", Color = "#e8eddf", Featured = true },
            new Product { Id = 2, Name = "Studio Headphones", Description = "Clear sound, soft cushions and an adjustable fit. Find a little more focus in your everyday.", Price = 499.9m, Stock = 8, Category = "Audio", Kind = "headphones", Color = "#e7e5e0", Featured = true },
            new Product { Id = 3, Name = "Everyday Backpack", Description = "A lightweight home for your laptop and daily essentials. Thoughtful pockets, comfortable straps, timeless shape.", Price = 229.9m, Stock = 20, Category = "Everyday", Kind = "backpack", Color = "#e9e4d9", Featured = true },
            new Product { Id = 4, Name = "Focus Desk Lamp", Description = "Warm, gentle light with a simple adjustable head. Make space for a slower evening.", Price = 189.9m, Stock = 9, Category = "Workspace", Kind = "lamp", Color = "#e7e8df", Featured = true },
            new Product { Id = 5, Name = "Wireless Mouse", Description = "A quiet click and a comfortable profile. A small upgrade for the things you do every day.", Price = 129.9m, Stock = 18, Category = "Workspace", Kind = "mouse", Color = "#e3e8ed", Featured = false },
            new Product { Id = 6, Name = "Daily Water Bottle", Description = "An insulated stainless steel bottle for wherever the day takes you. 750 ml of everyday simplicity.", Price = 89.9m, Stock = 24, Category = "Everyday", Kind = "bottle", Color = "#e3e8dd", Featured = false },
            new Product { Id = 7, Name = "Travel Headphones", Description = "A compact companion for playlists, podcasts and long journeys. Foldable design with padded ear cups.", Price = 299.9m, Stock = 6, Category = "Audio", Kind = "headphones", Color = "#eee4df", Featured = false },
            new Product { Id = 8, Name = "Weekend Backpack", Description = "Room for an extra layer, a good book and an unplanned adventure. Durable fabric in an easygoing silhouette.", Price = 279.9m, Stock = 0, Category = "Everyday", Kind = "backpack", Color = "#e3e6ee", Featured = false },
            new Product { Id = 9, Name = "Compact Keyboard", Description = "A smaller footprint for a clearer desk. Low-profile keys and a comfortable typing experience.", Price = 249.9m, Stock = 7, Category = "Workspace", Kind = "keyboard", Color = "#ece6df", Featured = false });

        await db.SaveChangesAsync();

        await db.Database.ExecuteSqlRawAsync(
            "SELECT setval(pg_get_serial_sequence('\"Products\"', 'Id'), COALESCE((SELECT MAX(\"Id\") FROM \"Products\"), 1));");
    }
}