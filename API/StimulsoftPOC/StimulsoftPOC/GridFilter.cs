namespace StimulsoftPOC
{
    public class GridFilter
    {
        public string Field { get; set; }
        public string Operator { get; set; }
        public object Value { get; set; }
    }

    public class GridFilterDescriptor
    {
        public string Logic { get; set; } // "and" or "or"
        public List<GridFilter> Filters { get; set; } // Nested filters
    }

    public class GridSort
    {
        public string Field { get; set; }
        public string Dir { get; set; }
        public bool IsGroup { get; set; }
    }
}
