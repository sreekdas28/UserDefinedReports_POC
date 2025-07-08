namespace StimulsoftPOC
{
    using System;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;

    [Table("PurchaseOrder")]
    public class PurchaseOrder
    {
        [Key]
        public int Id { get; set; }
        public string OrderNumber { get; set; }
        public string ItemCode { get; set; }
        public string ItemDescription { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string VendorName { get; set; }
        public string VendorCode { get; set; }
        public string VendorContact { get; set; }
        public string OrderStatus { get; set; }
        public DateTime OrderedDate { get; set; }
        public decimal LineAmt { get; set; }
    }

}
