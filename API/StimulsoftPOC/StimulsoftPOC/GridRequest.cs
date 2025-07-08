using Kendo.Mvc;
using Kendo.Mvc.UI;

namespace StimulsoftPOC
{
    public class GridRequest<T>
    {
        //public int Skip { get; set; }
        //public int Take { get; set; }
        //public List<GridSort> Sort { get; set; }
        //public GridFilterDescriptor Filter { get; set; }
        public List<GridColumn> Columns { get; set; }
        public bool IsLandscape { get; set; }
    }

    //public class CustomDataSourceRequest
    //{
    //    public int Page { get; set; }
    //    public int PageSize { get; set; }
    //    public int Skip { get; set; }
    //    public int Take { get; set; }
    //    public List<SortDescriptor> Sort { get; set; }
    //    public List<GroupDescriptor> Group { get; set; }
    //    public FilterDescriptor Filter { get; set; }
    //}
}
