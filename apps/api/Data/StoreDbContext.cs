using Ecommerce.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Data;

public class StoreDbContext(DbContextOptions<StoreDbContext> options)
    : IdentityDbContext<Customer, IdentityRole, string>(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

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

        var order = modelBuilder.Entity<Order>();
        order.HasKey(o => o.Id);
        order.Property(o => o.CustomerId).HasMaxLength(36).IsRequired();
        order.Property(o => o.IdempotencyKey).HasMaxLength(100).IsRequired();
        order.HasIndex(o => new { o.CustomerId, o.IdempotencyKey }).IsUnique();
        order.Property(o => o.Subtotal).HasColumnType("numeric(12,2)");
        order.Property(o => o.Shipping).HasColumnType("numeric(12,2)");
        order.Property(o => o.Total).HasColumnType("numeric(12,2)");
        order.HasMany(o => o.Items).WithOne().HasForeignKey(i => i.OrderId);

        var orderItem = modelBuilder.Entity<OrderItem>();
        orderItem.HasKey(i => i.Id);
        orderItem.Property(i => i.Name).HasMaxLength(100).IsRequired();
        orderItem.Property(i => i.Price).HasColumnType("numeric(12,2)");
    }
}
