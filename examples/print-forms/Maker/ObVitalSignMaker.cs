using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Ysr.Framework.Business.Common.Engine.Print.Common;
using Ysr.Framework.Business.Common.Model;

namespace Ysr.Framework.Business.Common.Engine.Print.Maker
{
    public static class ObVitalSignMaker
    {
        private const int PageMaxHeight = 350;
        private const int RowHeight = 13;

        public static string GetObVitalSign(IEnumerable<ObVital> obVitals, IEnumerable<ObVitalName> obVitalNames, Patient patient)
        {

            var htmlBuilder = new StringBuilder();
            htmlBuilder.Append(PrintHelper.GetPrefixHtmlLandscape());
            htmlBuilder.Append(GetContentPages(obVitals, obVitalNames, patient));
            htmlBuilder.Append(PrintHelper.GetSuffixHtml());

            return htmlBuilder.ToString();
        }

        private static string GetContentPages(IEnumerable<ObVital> obVitals, IEnumerable<ObVitalName> obVitalNames, Patient patient)
        {
            var htmlBuilder = new StringBuilder();

            var obVitalList = CalcPrintPageNumber(obVitals).ToList();
            var totalPageNum = obVitalList.Max(sp => sp.PrintPageNumber);

            for (var pageNum = 1; pageNum <= totalPageNum; pageNum++)
            {
                var pageNumber = pageNum;
                var contentByPage = GetContentByPage(obVitalList.Where(r => r.PrintPageNumber == pageNumber), obVitalNames);
                htmlBuilder.Append(GetContentPage(pageNumber, contentByPage, patient));
            }

            return htmlBuilder.ToString();
        }

        private static IEnumerable<ObVital> CalcPrintPageNumber(IEnumerable<ObVital> obVitals)
        {
            var obVitalList = obVitals.ToList();

            var totalHeight = 0;
            var pageNumber = 1;

            foreach (var obVital in obVitalList)
            {
                totalHeight += RowHeight;
                if (totalHeight > PageMaxHeight)
                {
                    pageNumber += 1;
                    totalHeight = RowHeight;
                }

                obVital.PrintPageNumber = pageNumber;
            }

            return obVitalList;
        }

        private static string GetContentByPage(IEnumerable<ObVital> obVitals, IEnumerable<ObVitalName> obVitalNames)
        {
            var obVitalName = obVitalNames.FirstOrDefault();

            var html = $@"
            <div style=""margin: 10px 25px 0 25px;"">
                <table class=""table"" style=""width: 100%;"">
                    <tr>
                        <th>내원일자</th>
                        <th>내원시간</th>
                        <th>LMP</th>
                        <th>EDC</th>
                        <th>N/D(횟수)</th>
                        <th>C/S(횟수)</th>
                        <th>자녀수(남/여)</th>
                        {(string.IsNullOrEmpty(obVitalName.Name1) ? string.Empty : $"<th>{obVitalName.Name1}</th>")}
                        {(string.IsNullOrEmpty(obVitalName.Name2) ? string.Empty : $"<th>{obVitalName.Name2}</th>")}
                        {(string.IsNullOrEmpty(obVitalName.Name3) ? string.Empty : $"<th>{obVitalName.Name3}</th>")}
                        {(string.IsNullOrEmpty(obVitalName.Name4) ? string.Empty : $"<th>{obVitalName.Name4}</th>")}
                        {(string.IsNullOrEmpty(obVitalName.Name5) ? string.Empty : $"<th>{obVitalName.Name5}</th>")}
                    </tr>
                    {GetContentTable(obVitals, obVitalNames)}
                </table>
            </div>
            ";

            return html;
        }

        private static string GetContentTable(IEnumerable<ObVital> obVitals, IEnumerable<ObVitalName> obVitalNames)
        {
            var obVitalName = obVitalNames.FirstOrDefault();
            var hasName1 = string.IsNullOrEmpty(obVitalName?.Name1);
            var hasName2 = string.IsNullOrEmpty(obVitalName?.Name2);
            var hasName3 = string.IsNullOrEmpty(obVitalName?.Name3);
            var hasName4 = string.IsNullOrEmpty(obVitalName?.Name4);
            var hasName5 = string.IsNullOrEmpty(obVitalName?.Name5);

            var htmlBuilder = new StringBuilder();

            foreach (var obVital in obVitals)
            {
                if(obVital.Sitmp) continue;

                var html = $@"
                <tr>
                    <td>{obVital.InDateTime:yyyy-MM-dd}</td>
                    <td>{obVital.InDateTime:HH:mm:ss}</td>
                    <td>{obVital.Lmp:yyyy-MM-dd}</td>
                    <td>{obVital.Edc:yyyy-MM-dd}</td>
                    <td>{obVital.Nd}</td>
                    <td>{obVital.Cs}</td>
                    <td>{obVital.Childs}</td>
                    {(hasName1 ? string.Empty : $"<td>{obVital.Name1}</td>")}
                    {(hasName2 ? string.Empty : $"<td>{obVital.Name2}</td>")}
                    {(hasName3 ? string.Empty : $"<td>{obVital.Name3}</td>")}
                    {(hasName4 ? string.Empty : $"<td>{obVital.Name4}</td>")}
                    {(hasName5 ? string.Empty : $"<td>{obVital.Name5}</td>")}
                </tr>
                ";

                htmlBuilder.Append(html);
            }

            return htmlBuilder.ToString();
        }
        private static string GetContentPage(int pageNum, string contentByPage, Patient patient)
        {
            var html = $@"
            <div class=""A4"">
                <div class=""text-center"" style=""font-size: 28px; padding-top: 30px;"">부인과 바이탈</div>
                <div class=""space-between"" style=""margin: 25px 25px 0 25px;"">
                    <span>환자의 부인과 바이탈 사인 목록 [차트번호 : {patient.PatientNumber}]</span>
                    <span>{DateTime.Now:yyyy-MM-dd HH:mm:ss}</span>
                </div>
                {contentByPage}
                <div class=""paper-tail"">
                    <div style=""border-top: solid; border-width: 1px; padding: 5px; text-align: right; margin: 25px; "">
                        <span>{pageNum}</span>
                    </div>
                </div>
            </div>
            ";

            return html;
        }
    }

}