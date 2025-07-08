using Kendo.Mvc.UI;

namespace StimulsoftPOC
{
    public class RequestStorageService
    {
        private DataSourceRequest _lastRequest;

        public DataSourceRequest LastRequest => _lastRequest;

        public void SaveRequest(DataSourceRequest request)
        {
            _lastRequest = request;
        }
    }
}
