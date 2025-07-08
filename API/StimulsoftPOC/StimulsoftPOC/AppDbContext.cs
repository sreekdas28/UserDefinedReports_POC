using Microsoft.EntityFrameworkCore;

namespace StimulsoftPOC
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
    }
}
