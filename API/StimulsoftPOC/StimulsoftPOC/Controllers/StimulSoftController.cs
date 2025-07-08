using Azure;
using Azure.Core;
using Kendo.Mvc;
using Kendo.Mvc.Extensions;
using Kendo.Mvc.Infrastructure;
using Kendo.Mvc.UI;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReportGenerator.Services;
using Stimulsoft.Base;
using Stimulsoft.Base.Drawing;
using Stimulsoft.Base.Json;
using Stimulsoft.Report;
using Stimulsoft.Report.Angular;
using Stimulsoft.Report.Components;
using Stimulsoft.Report.Dashboard;
using Stimulsoft.Report.Mvc;
using Stimulsoft.Report.Web;
using System.Collections.Generic;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Linq.Expressions;
using System.Text.Json;
using static Stimulsoft.Report.Func;
using static Stimulsoft.Report.Help.StiHelpProvider;
using static Stimulsoft.Report.StiOptions.Engine;

namespace StimulsoftPOC.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StimulSoftController : Controller
    {
        private readonly AppDbContext _context;
        private readonly RequestStorageService _requestStorage;

        public StimulSoftController(AppDbContext context, RequestStorageService requestStorage)
        {
            _context = context;
            _requestStorage = requestStorage;
            Stimulsoft.Base.StiLicense.LoadFromString("6vJhGtLLLz2GNviWmUTrhSqnOItdDwjBylQzQcAOiHmM6EwCCUUghT03Jqd0IjPZlt50zXHcxxCD6oRmcQWrc9jdX5m0hZDlio1lnrMxzUlnjn+X2f+wmhaYfG8EbJ7R3F9gIU+wDdoO8w69PT4tmQ5ioIdDb7aTAm3UvXsAARtMm/PuZTJF5pxfHDAI/45SxoadZQI72WU7ocF+iezd1AawOHqm1APNFOBdJTzNYCT/h2/jpr6K9HmEHHQksC8pgBplKTI+layk6ZegPQt3Cl4B76ZUqChOAmTStJNWUSzEtumQpm9cm4PkSW9QidHWv+oyITMEVAmqGQmsPBwil7qq8qt+mbkmM7+fxCiIPLcn2q5OvOYf8SzU9hDEVp6VlbcXNhLTWOhJ0DvgalnFYQdozsnjKqd9mMLINF3gmYG1y2NukzRq/621tF88EWxLxAD5k6qAYocVeGC8YGuVVgI3DgLcdLu24Vc20vxPmHk4EUrxgdtu5dIXl8AYZUUsXS7S2WEIfD/q7VFXpxsZ4JezigxGiVK/k0H3D9aCS9sIiG7Giu3PuaoLExQaFBfhmv5GXUNDktj7iwex+H44Zg==");
        }

        [HttpGet("GetGridData")]
        public async Task<IActionResult> GetGridData([DataSourceRequest] DataSourceRequest request)
        {
            try
            {
                _requestStorage.SaveRequest(request);
                //IQueryable<PurchaseOrder> queryable = _context.PurchaseOrders;

                //DataSourceResult result = await queryable.ToDataSourceResultAsync(request);

                DataSourceResult result;
                if (request.Groups != null && request.Groups.Any())
                {
                    var data = await _context.PurchaseOrders.ToListAsync();
                    result = data.ToDataSourceResult(request);
                }
                else
                {
                    result = await _context.PurchaseOrders.ToDataSourceResultAsync(request);
                }
                return new JsonResult(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Failed to read or deserialize file. {ex.Message}");
            }
        }

        [HttpPost("GenerateReport")]
        public async Task<IActionResult> GenerateReport([FromBody] GridRequest<PurchaseOrder> request)
        {
            var lastRequest = _requestStorage.LastRequest;

            if (lastRequest == null || request.Columns == null)
                return BadRequest("Invalid report parameters.");

            //IQueryable<PurchaseOrder> queryable = _context.PurchaseOrders;
            lastRequest.PageSize = 0;
            DataSourceResult result = new DataSourceResult();
            var data = new List<PurchaseOrder>();
            //DataSourceResult result = await queryable.ToDataSourceResultAsync(lastRequest);

            //var data = ((System.Collections.IEnumerable)result.Data).Cast<PurchaseOrder>().ToList();

            bool hasGroups = lastRequest.Groups != null && lastRequest.Groups.Any();

            if (hasGroups)
            {
                var dataGrp = await _context.PurchaseOrders.ToListAsync();
                result = dataGrp.ToDataSourceResult(lastRequest);

                //if (result.Data is IEnumerable<AggregateFunctionsGroup> grouped)
                //{
                //    data = grouped.SelectMany(g => g.Items.Cast<PurchaseOrder>()).ToList();
                //}
                var grps = result.Data as IEnumerable<AggregateFunctionsGroup>;

                data = FlattenGroupedData(grps);
            }
            else
            {
                IQueryable<PurchaseOrder> queryable = _context.PurchaseOrders;
                result = await queryable.ToDataSourceResultAsync(lastRequest);
                if (result.Data is IEnumerable<PurchaseOrder> flat)
                {
                    data = flat.ToList();
                }
            }

            if (!data.Any())
                return BadRequest("No data found for the specified filters.");

            var report = new StiReport();

            // Register the data
            report.Dictionary.Databases.Clear();
            report.RegData("GridData", data);
            report.Dictionary.Synchronize();

            var page = report.Pages[0];
            page.Margins.Left = 1f;
            page.Margins.Right = 1f;
            page.Margins.Top = 1f;
            page.Margins.Bottom = 1f;
            page.Orientation = request.IsLandscape ? StiPageOrientation.Landscape : StiPageOrientation.Portrait;

            var visibleColumns = request.Columns
                ?.Where(c => !c.Hidden)
                .OrderBy(c => c.OrderIndex)
                .ToList();

            double availableWidth = page.PageWidth - page.Margins.Left - page.Margins.Right;
            double totalDeclaredWidth = visibleColumns.Sum(c => (double)(c.Width ?? 30));
            double scaleFactor = availableWidth / totalDeclaredWidth;
            string filterText = string.Empty;

            float posX = 0f;

            var titleBand = new StiReportTitleBand
            {
                Height = 2.5f,
                Name = "TitleBand"
            };
            page.Components.Add(titleBand);

            var titleText = new StiText(new RectangleD(posX, 0, page.Width, 0.6))
            {
                Text = "Purchase Order Report",
                Name = "Title",
                HorAlignment = StiTextHorAlignment.Center,
                VertAlignment = StiVertAlignment.Center,
                Font = new Font("Arial", 14, FontStyle.Bold)
            };
            titleBand.Components.Add(titleText);

            // 1. Filters Text (left aligned, multiline)
            if (lastRequest.Filters?.Count > 0)
            {
                filterText = ConvertFiltersToText(lastRequest.Filters.FirstOrDefault());

                var filterTextBox = new StiText(new RectangleD(0, 1, page.Width / 3, 2.2))
                {
                    Text = $"<b>Filters:</b><br>{filterText}",
                    Font = new Font("Arial", 9),
                    HorAlignment = StiTextHorAlignment.Left,
                    VertAlignment = StiVertAlignment.Top,
                    CanGrow = true,
                    WordWrap = true,
                    Name = "FilterTextBox",
                    Margins = new StiMargins(1, 0, 0, 0),
                    AllowHtmlTags = true
                };
                titleBand.Components.Add(filterTextBox);
            }
            var dateText = new StiText(new RectangleD(page.Width * 2 / 3, 2.0, page.Width / 3, 0.5f))
            {
                Text = $"Report Date: {DateTime.Now:dd-MMM-yyyy hh:mm:ss tt}",
                Name = "ReportDate",
                HorAlignment = StiTextHorAlignment.Right,
                VertAlignment = StiVertAlignment.Bottom,
                Font = new Font("Arial", 9),
                Border = new StiBorder { Side = StiBorderSides.None },
                Margins = new StiMargins { Right = 2f }
            };
            titleBand.Components.Add(dateText);
            var maxBottom = titleBand.Components
                .OfType<StiComponent>()
                .Max(c => c.Top + c.Height);
            var titleLine = new StiHorizontalLinePrimitive
            {
                Name = "TitleBorderLine",
                Top = maxBottom + 0.05f,
                Left = 0,
                Width = page.Width,
                Height = 0.1f,
                Color = Color.Black,
                Style = StiPenStyle.Solid
            };
            page.Components.Add(titleLine);
            posX = 0f;

            if (!hasGroups)
            {
                var headerBand = new StiHeaderBand
                {
                    Height = 1f,
                    Name = "HeaderBand"
                };
                page.Components.Add(headerBand);
                //float columnSpacing = 0.1f;
                foreach (var col in visibleColumns)
                {
                    bool isNumField = col.Field == "Quantity" || col.Field == "UnitPrice" || col.Field == "LineAmt";
                    float width = (float)((col.Width ?? 30) * scaleFactor);

                    var headerText = new StiText(new RectangleD(posX, 0.07f, width, headerBand.Height))
                    {
                        Text = col.HeaderText,
                        Name = $"HeaderText_{col.HeaderText}",
                        HorAlignment = isNumField ? StiTextHorAlignment.Right : StiTextHorAlignment.Left,
                        VertAlignment = StiVertAlignment.Center,
                        Font = new Font("Arial", 8, FontStyle.Bold),
                        CanGrow = true,
                        WordWrap = true,
                        Margins = isNumField ? new StiMargins { Right = 5f } : new StiMargins(2, 0, 0, 0),
                    };
                    var horizontalLine = new StiHorizontalLinePrimitive
                    {
                        Name = $"GroupHeaderBand_{col.HeaderText}",
                        Top = headerText.Bottom + 0.05,
                        Left = 0f,
                        Width = (float)page.Width,
                        Height = 0.02f, // thin line
                        Color = Color.Gray,
                        Style = StiPenStyle.Dot
                    };

                    headerBand.Components.Add(headerText);
                    headerBand.Components.Add(horizontalLine);
                    posX += width;
                }

                var dataBand = new StiDataBand
                {
                    Name = "DataBand",
                    DataSourceName = "GridData",
                    Height = 0.5f
                };
                page.Components.Add(dataBand);
                posX = 0f;
                foreach (var col in visibleColumns)
                {
                    float width = (float)((col.Width ?? 30) * scaleFactor);
                    bool isNum = IsNumeric(col.Field);
                    string textExpression;
                    if (col.Field == "OrderedDate")
                    {
                        textExpression = "{GridData.OrderedDate.ToString(\"dd-MMM-yyyy\")}";
                    }
                    else
                    {
                        textExpression = $"{{GridData.{col.Field}}}";
                    }

                    var text = new StiText(new RectangleD(posX, 0.07f, width, dataBand.Height))
                    {
                        Text = textExpression,
                        Name = $"Text_{col.Field}",
                        HorAlignment = isNum ? StiTextHorAlignment.Right : StiTextHorAlignment.Left,
                        VertAlignment = StiVertAlignment.Center,
                        //Font = new StiFont("Arial", 10f),
                        Border = new StiBorder
                        {
                            Side = StiBorderSides.None
                        },
                        CanGrow = !isNum,
                        WordWrap = !isNum,
                        Margins = isNum ? new StiMargins { Right = 5f } : new StiMargins(2, 0, 0, 0),
                    };

                    dataBand.Components.Add(text);
                    posX += width;
                }
            }

            string PascalCase(string input) => string.IsNullOrEmpty(input) ? input : char.ToUpperInvariant(input[0]) + input.Substring(1);

            if (hasGroups)
            {
                int level = 0;
                float indent = 0;
                posX = 0f;
                int groupCount = lastRequest.Groups.Count - 1;
                var groupFields = lastRequest.Groups?.Select(g => g.Member).ToHashSet(StringComparer.OrdinalIgnoreCase) ?? new HashSet<string>();
                var visibleDataColumns = visibleColumns
                    .Where(c => !groupFields.Contains(c.Field))
                    .ToList();
                foreach (var group in lastRequest.Groups)
                {
                    string groupField = PascalCase(group.Member);
                    indent = level * 0.5f;

                    var groupHeaderBand = new StiGroupHeaderBand
                    {
                        Condition = new StiGroupConditionExpression($"{{GridData.{groupField}}}"),
                        Height = 0.6f,
                        Name = $"GroupHeaderBand_{groupField}"
                    };
                    float headerTopPadding = level == 0 ? 0.5f : 0.2f;
                    var groupHeaderText = new StiText(new RectangleD(indent, headerTopPadding, availableWidth - indent, 0.5f))
                    {
                        Text = $"{GetGroupTitle(groupField)}: {{GridData.{groupField}}}",
                        Name = groupField,
                        HorAlignment = StiTextHorAlignment.Left,
                        Font = level == 0 ? new Font("Arial", 12, FontStyle.Bold) : new Font("Arial", 10, FontStyle.Bold),
                        Border = new StiBorder { Side = StiBorderSides.None }
                    };

                    groupHeaderBand.Components.Add(groupHeaderText);

                    if (level == groupCount)
                    {
                        posX = indent;
                        float posY = level == 0 ? 1f : 0.7f;
                        
                        foreach (var col in visibleDataColumns)
                        {
                            bool isNumField = col.Field == "Quantity" || col.Field == "UnitPrice" || col.Field == "LineAmt";
                            float width = (float)((col.Width ?? 30) * scaleFactor);

                            var headerText = new StiText(new RectangleD(posX, posY, width, 0.5f))
                            {
                                Text = col.HeaderText,
                                Name = $"HeaderText_{groupField + col.HeaderText}",
                                HorAlignment = isNumField ? StiTextHorAlignment.Right : StiTextHorAlignment.Left,
                                VertAlignment = StiVertAlignment.Center,
                                Font = new Font("Arial", 8, FontStyle.Bold),
                                Border = new StiBorder
                                {
                                    Side = StiBorderSides.None
                                },
                                CanGrow = true,
                                WordWrap = true,
                                Margins = isNumField ? new StiMargins { Right = 5f } : new StiMargins(2, 0, 0, 0),
                            };

                            groupHeaderBand.Components.Add(headerText);
                            var horizontalLine = new StiHorizontalLinePrimitive
                            {
                                Name = $"GroupHeaderBand_{col.HeaderText + groupField}",
                                Top = headerText.Bottom + 0.05,
                                Left = posX,
                                Width = width,
                                Height = 0.02f, // thin line
                                Color = Color.Gray,
                                Style = StiPenStyle.Dot
                            };
                            groupHeaderBand.Components.Add(horizontalLine);
                            posX += width;
                        }

                    }

                    page.Components.Add(groupHeaderBand);

                    level++;
                }

                var dataBand = new StiDataBand
                {
                    Name = "DataBand",
                    DataSourceName = "GridData",
                    Height = 0.5f
                };

                posX = indent;
                foreach (var col in visibleDataColumns)
                {
                    float width = (float)((col.Width ?? 30) * scaleFactor);
                    bool isNum = IsNumeric(col.Field);
                    string textExpression;
                    if (col.Field == "OrderedDate")
                    {
                        textExpression = "{GridData.OrderedDate.ToString(\"dd-MMM-yyyy\")}";
                    }
                    else
                    {
                        textExpression = $"{{GridData.{col.Field}}}";
                    }

                    var text = new StiText(new RectangleD(posX, 0.3, width, 0.5f))
                    {
                        Text = textExpression,
                        Name = $"Text_{col.Field}",
                        HorAlignment = isNum ? StiTextHorAlignment.Right : StiTextHorAlignment.Left,
                        VertAlignment = StiVertAlignment.Center,
                        CanGrow = true,
                        WordWrap = true,
                        Border = new StiBorder { Side = StiBorderSides.None },
                        Margins = isNum ? new StiMargins { Right = 5f } : new StiMargins(2, 0, 0, 0),
                    };

                    dataBand.Components.Add(text);
                    posX += width;
                }

                page.Components.Add(dataBand);

                var lastGroupField = PascalCase(lastRequest.Groups.Last().Member);
                float footerPosX = indent;//(lastRequest.Groups.Count - 1) * 0.5f;
                
                bool labelPrinted = false;

                var groupFooterBand = new StiGroupFooterBand
                {
                    Name = $"GroupFooterBand_{lastGroupField}",
                    Height = 0.5f
                };

                foreach (var col in visibleDataColumns)
                {
                    float width = (float)((col.Width ?? 30) * scaleFactor);
                    bool isSumField = col.Field == "Quantity" || col.Field == "LineAmt"; // customize
                    string textValue = "";
                    StiTextHorAlignment alignment = StiTextHorAlignment.Left;

                    var groupFooterLine = new StiHorizontalLinePrimitive
                    {
                        Name = $"GroupFooterLine_{col.Field + lastGroupField}",
                        Top = 0f, // Top of the footer band
                        Left = footerPosX,
                        Width = width,
                        Height = 0.02f,
                        Color = Color.Gray,
                        Style = StiPenStyle.Dot
                    };
                    groupFooterBand.Components.Add(groupFooterLine);

                    if (isSumField)
                    {
                        textValue = "{Sum(GridData." + col.Field + ")}";
                        alignment = StiTextHorAlignment.Right;
                    }
                    else if (!labelPrinted)
                    {
                        textValue = "Total:";
                        alignment = StiTextHorAlignment.Left;
                        labelPrinted = true;
                    }

                    var footerText = new StiText(new RectangleD(footerPosX, 0.2, width, 0.5f))
                    {
                        Text = textValue,
                        Name = $"GroupFooter_{col.Field}",
                        HorAlignment = alignment,
                        Font = new Font("Arial", 8, FontStyle.Bold),
                        CanGrow = false,
                        Margins = isSumField ? new StiMargins { Right = 5f } : new StiMargins(2, 0, 0, 0),
                    };

                    groupFooterBand.Components.Add(footerText);
                    footerPosX += width;
                }

                page.Components.Add(groupFooterBand);
            }

            var footerBand = new StiPageFooterBand
            {
                Height = 0.5f,
                Name = "FooterBand"
            };
            page.Components.Add(footerBand);

            double left = page.Margins.Left;
            float footerWidth = (float)(page.PageWidth - page.Margins.Left - page.Margins.Right);

            var pageNumberText = new StiText(new RectangleD(0, 0, page.Width, footerBand.Height))
            {
                Text = "Page {PageNumber} of {TotalPageCount}",
                Name = "Footer",
                HorAlignment = StiTextHorAlignment.Right,
                VertAlignment = StiVertAlignment.Center,
                Border = new StiBorder { Side = StiBorderSides.None },
                CanGrow = false
            };
            pageNumberText.Border = new StiBorder
            {
                Side = StiBorderSides.Top,
                Color = Color.Black,
                Size = 0.5f,
                Style = StiPenStyle.Solid
            };
            footerBand.Components.Add(pageNumberText);

            string mrtPath = Path.Combine("Reports", "Report.mrt");
            Directory.CreateDirectory(Path.GetDirectoryName(mrtPath));
            report.Save(mrtPath);
            try
            {
                report.Render();
            }
            catch (Exception ex)
            {
                return BadRequest($"Failed to render report. {ex.Message}");
            }

            //Export directly to PDF stream
            //var stream = new MemoryStream();
            //report.ExportDocument(StiExportFormat.Pdf, stream);
            //stream.Position = 0;
            //return File(stream, "application/pdf", "DynamicReport.pdf");

            ReportCache.Save(report);
            Console.WriteLine("GenerateReport completed, saving report: " + report.ReportName);

            return Ok(new
            {
                requestUrl = "https://localhost:7162/api/StimulSoft/",
                action = "InitViewer",
                actionViewerEvent = "ViewerEvent"
            });
        }

        [HttpPost("InitViewer")]
        public IActionResult InitViewer()
        {
            var requestParams = StiAngularViewer.GetRequestParams(this);

            var options = new StiAngularViewerOptions();

            options.Localization = StiAngularHelper.MapPath(this, "Localization/en-GB.xml");

            // Required action URLs
            options.Actions.GetReport = "GetReport";
            options.Actions.ViewerEvent = "ViewerEvent";
            options.Actions.ExportReport = "ExportReport";
            options.Actions.PrintReport = "PrintReport";
            options.Actions.EmailReport = "EmailReport";
            options.Actions.Interaction = "ViewerInteraction";
            options.Actions.DesignReport = "DesignReport";

            options.Toolbar.Visible = true;
            options.Toolbar.ShowOpenButton = false;
            options.Toolbar.ShowSaveButton = false;
            options.Toolbar.ShowPrintButton = false;
            options.Toolbar.ShowBookmarksButton = false; // still hidden
            options.Toolbar.ShowParametersButton = false;
            options.Toolbar.ShowSendEmailButton = false;
            options.Toolbar.ShowDesignButton = false;
            options.Toolbar.ShowFullScreenButton = false;
            options.Toolbar.ShowAboutButton = false;
            //options.Toolbar.ShowPageNavigation = true;
            //options.Toolbar.ShowPageSetupButton = false;
            options.Toolbar.ShowSendEmailButton = false;
            options.Toolbar.ShowDesignButton = false;
            options.Toolbar.ShowParametersButton = false;
            options.Toolbar.ShowAboutButton = false;
            options.Toolbar.ShowFullScreenButton = false;
            //options.Appearance.s
            //options.Toolbar.ShowMoreButton = false;

            options.Appearance.FullScreenMode = false;
            options.Appearance.ScrollbarsMode = true;
            options.Appearance.BookmarksTreeWidth = 0;
            options.Appearance.ShowPageShadow = false;

            options.Server.RequestTimeout = 9000;
            options.Server.CacheMode = StiServerCacheMode.ObjectCache;
            options.Server.AllowAutoUpdateCache = false;

            return StiAngularViewer.ViewerDataResult(requestParams, options);
        }


        [HttpPost]
        [Route("GetReport")]
        public async Task<IActionResult> GetReport()
        {
            var report = ReportCache.Load();
            if (report == null) return NotFound("Report not found or expired.");

            return StiAngularViewer.GetReportResult(this, report);
        }

        [HttpPost]
        [Route("ViewerEvent")]
        public async Task<IActionResult> ViewerEvent()
        {
            var requestParams = StiAngularViewer.GetRequestParams(this);
            var report = ReportCache.Load();
            if (report == null)
            {
                Console.WriteLine("❌ Report was null in cache.");
                return BadRequest("Report is not specified.");
            }

            //Console.WriteLine("ViewerEvent called. Report: " + (report != null ? report.ReportName : "NULL"));
            //Console.WriteLine("RequestParams: " + System.Text.Json.JsonSerializer.Serialize(requestParams));
            try
            {
                return StiAngularViewer.ViewerEventResult(this);
            }
            catch (Exception ex)
            {
                Console.WriteLine("ViewerEvent error: " + ex.Message);
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost]
        [Route("ViewerInteraction")]
        public IActionResult ViewerInteraction()
        {
            var requestParams = StiAngularViewer.GetRequestParams(this);

            return StiAngularViewer.InteractionResult(this);
        }

        [HttpPost]
        [Route("DesignReport")]
        public IActionResult DesignReport()

        {
            StiReport report = StiNetCoreViewer.GetReportObject(this);
            ViewBag.ReportName = report.ReportName;
            return View("Designer");

        }

        private StiText CreateText(float leftCm, float topCm, float widthCm, string text, bool bold = false)
        {
            return new StiText
            {
                Left = leftCm,
                Top = topCm,
                Width = widthCm,
                Height = 0.5f,
                Text = text,
                //HorAlignment = StiTextHorAlignment.Center,
                //VertAlignment = StiVertAlignment.Center,
                //Font = new Font("Arial", 10, bold ? FontStyle.Bold : FontStyle.Regular),
                //Border = new StiBorder(StiBorderSides.All, Color.Gray, 1, StiPenStyle.Solid)
            };
        }

        private List<PurchaseOrder> FlattenGroupedData(IEnumerable<AggregateFunctionsGroup> groups)
        {
            var result = new List<PurchaseOrder>();

            foreach (var group in groups)
            {
                if (group.HasSubgroups && group.Items is IEnumerable<AggregateFunctionsGroup> subgroups)
                {
                    result.AddRange(FlattenGroupedData(subgroups)); // 🔁 Recurse into subgroups
                }
                else
                {
                    result.AddRange(group.Items.Cast<PurchaseOrder>());
                }
            }

            return result;
        }

        string GetGroupTitle(string field)
        {
            string PascalCase(string input) => string.IsNullOrEmpty(input) ? input : char.ToUpperInvariant(input[0]) + input.Substring(1);
            // Use a mapping or fallback to PascalCase field
            var titleMap = new Dictionary<string, string>
            {
                { "OrderNumber", "Order Number" },
                { "ItemCode", "Item Code" },
                { "ItemDescription", "Item Description" },
                { "Quantity", "Quantity" },
                { "UnitPrice", "Unit Price" },
                { "VendorName", "Vendor Name" },
                { "VendorCode", "Vendor Code" },
                { "VendorContact", "Vendor Contact" },
                { "OrderStatus", "Order Status" },
                { "OrderedDate", "Order Date" },
                { "LineAmt", "Line Amount" }
            };

            return titleMap.TryGetValue(field, out var title) ? title : PascalCase(field);
        }

        private bool IsNumeric(string field)
        {
            var propInfo = typeof(PurchaseOrder).GetProperty(field);
            bool isNumeric = propInfo != null && (
                propInfo.PropertyType == typeof(int) ||
                propInfo.PropertyType == typeof(float) ||
                propInfo.PropertyType == typeof(double) ||
                propInfo.PropertyType == typeof(decimal)
            );

            return isNumeric;
        }

        private string ConvertFiltersToText(IFilterDescriptor filter)
        {
            string PascalCase(string input) => string.IsNullOrEmpty(input) ? input : char.ToUpperInvariant(input[0]) + input.Substring(1);
            if (filter is FilterDescriptor descriptor)
            {
                return $"{GetFieldLabel(PascalCase(descriptor.Member))} {GetOperatorText(descriptor.Operator)} \"{descriptor.Value}\"";
            }
            else if (filter is CompositeFilterDescriptor composite)
            {
                var subFilters = composite.FilterDescriptors
                    .Select(ConvertFiltersToText)
                    .Where(text => !string.IsNullOrEmpty(text))
                    .ToList();

                var logic = composite.LogicalOperator == FilterCompositionLogicalOperator.And ? "AND" : "OR";
                return string.Join($"{Environment.NewLine}{logic} ", subFilters);
            }
            return "";
        }

        private string GetOperatorText(FilterOperator op)
        {
            return op switch
            {
                FilterOperator.IsEqualTo => "is equal to",
                FilterOperator.IsNotEqualTo => "is not equal to",
                FilterOperator.IsGreaterThan => ">",
                FilterOperator.IsGreaterThanOrEqualTo => "≥",
                FilterOperator.IsLessThan => "<",
                FilterOperator.IsLessThanOrEqualTo => "≤",
                FilterOperator.StartsWith => "starts with",
                FilterOperator.Contains => "contains",
                FilterOperator.DoesNotContain => "does not contain",
                FilterOperator.EndsWith => "ends with",
                _ => op.ToString()
            };
        }

        private string GetFieldLabel(string field)
        {
            return field switch
            {
                "OrderNumber" => "Order Number",
                "ItemCode" => "Item Code",
                "ItemDescription" => "Item Description",
                "Quantity" => "Quantity",
                "UnitPrice" => "Unit Price",
                "VendorName" => "Vendor Name",
                "VendorCode" => "Vendor Code",
                "VendorContact" => "Vendor Contact",
                "OrderStatus" => "Order Status",
                "OrderedDate" => "Order Date",
                "LineAmt" => "Line Amount",
                _ => field
            };
        }

    }
}
