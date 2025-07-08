namespace StimulsoftPOC
{
    public class GridColumn
    {
        public string Field { get; set; }         // Column field name
        public int OrderIndex { get; set; }       // Position/order of the column
        public int? Width { get; set; }           // Optional: Width in pixels
        public bool Hidden { get; set; }          // Whether the column is hidden
        public string HeaderText { get; set; }    // Column Header Display Text
    }
}
