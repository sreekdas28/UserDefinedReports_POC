using Stimulsoft.Report;
using System.Collections.Concurrent;
using static Stimulsoft.Report.Help.StiHelpProvider;

namespace StimulsoftPOC
{
    public static class ReportCache
    {
        private static StiReport _report;
        private static List<PurchaseOrder> _data;
        public static void Save(StiReport report)
        {
            _report = report;
        }

        public static StiReport Load()
        {
            return _report;
        }

        public static void Clear()
        {
            _report = null;
        }

        public static void SaveDataModel(List<PurchaseOrder> data)
        {
            _data = data;
        }

        public static List<PurchaseOrder> LoadDataModel()
        {
            return _data;
        }

        public static void ClearDataModel()
        {
            _data = null;
        }
    }
}
