// <copyright file="ReportCacheHelper.cs" company="WorldSmart">
// Copyright © WorldSmart. All rights reserved.
// This computer program may not be used, copied, distributed, corrected, modified,
// translated, transmitted or assigned without WorldSmart’s prior written authorization.
// </copyright>

namespace ReportGenerator.Services;

using Stimulsoft.Report;
using Stimulsoft.Report.Angular;
using Stimulsoft.Report.Web;


/// <summary>
/// Cache helper.
/// </summary>
public class ReportCacheHelper : StiCacheHelper
{
    /// <summary>
    /// Initializes a new instance of the <see cref="ReportCacheHelper"/> class.
    /// </summary>
    /// <param name="applicationContext">The application context</param>
    /// <param name="isPagination">The ispagination flag.</param>
    public ReportCacheHelper( bool isPagination)
    {
        this.IsPagination = isPagination;
    }


    private bool IsPagination { get; set; }

    /// <summary>
    /// Get Report.
    /// </summary>
    /// <param name="guid">The guid</param>
    /// <returns>Report</returns>
    public override StiReport GetReport(string guid)
    {
        string path = Path.Combine("CacheFiles", guid);
        StiReport report = new StiReport();

        if (File.Exists(path))
        {
            string packedReport = File.ReadAllText(path);
            if (guid.EndsWith("template"))
            {
                report.LoadPackedReportFromString(packedReport);
            }
            else
            {
                report.LoadPackedDocumentFromString(packedReport);
            }
        }
        return report;
    }

    /// <summary>
    /// Saves the report.
    /// </summary>
    /// <param name="report">The report</param>
    /// <param name="guid">The guid</param>
    public override void SaveReport(StiReport report, string guid)
    {
        string packedReport = guid.EndsWith("template") ? report.SavePackedReportToString() : report.SavePackedDocumentToString();
        var directory = "CacheFiles";
        if (!Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        string path = Path.Combine("CacheFiles", guid);
        File.WriteAllText(path, packedReport);
    }

    /// <summary>
    /// Removes the report.
    /// </summary>
    /// <param name="guid">The guid</param>
    public override void RemoveReport(string guid)
    {
        var path = Path.Combine("CacheFiles", guid);

        if (File.Exists(path))
        {
            File.Delete(path);
        }
    }
}
