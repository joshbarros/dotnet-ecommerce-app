using Ecommerce.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Data;

public class StoreDbContext(DbContextOptions<StoreDbContext> options)
    : IdentityDbContext<Customer, IdentityRole, string>(options)
{
    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        var product = modelBuilder.Entity<Product>();
        product.HasKey(p => p.Id);
        product.Property(p => p.Name).HasMaxLength(100).IsRequired();
        product.Property(p => p.Description).HasMaxLength(1000);
        product.Property(p => p.Price).HasColumnType("numeric(12,2)");
        product.Property(p => p.Category).HasMaxLength(50).IsRequired();
        product.Property(p => p.Kind).HasMaxLength(20).IsRequired();
        product.Property(p => p.Color).HasMaxLength(7).IsRequired();
    }
}