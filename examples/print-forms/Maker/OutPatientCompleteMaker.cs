using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Ysr.Framework.Business.Common.Engine.Print.Common;
using Ysr.Framework.Business.Common.Model;
using Ysr.Framework.Common.Global.Enums;

namespace Ysr.Framework.Business.Common.Engine.Print.Maker
{
    public static class OutPatientCompleteMaker
    {
        private const int PageMaxHeight = 350;
        private const int RowHeight = 13;

        public static string GetOutPatientComplete(IEnumerable<Outpatient> outpatients)
        {
            var htmlBuilder = new StringBuilder();
            htmlBuilder.Append(PrintHelper.GetPrefixHtmlLandscape());
            htmlBuilder.Append(GetContentPages(outpatients));
            htmlBuilder.Append(PrintHelper.GetSuffixHtml());

            return htmlBuilder.ToString();
        }

        private static IEnumerable<Outpatient> CalcPrintPageNumber(IEnumerable<Outpatient> outpatients)
        {
            var outpatientList = outpatients.ToList();

            var totalHeight = 0;
            var pageNumber = 1;

            foreach (var outpatient in outpatientList)
            {
                totalHeight += RowHeight;
                if (totalHeight > PageMaxHeight)
                {
                    pageNumber += 1;
                    totalHeight = RowHeight;
                }

                outpatient.PrintPageNumber = pageNumber;
            }

            return outpatientList;
        }

        private static string GetContentPages(IEnumerable<Outpatient> outpatients)
        {
            var htmlBuilder = new StringBuilder();

            var outpatientList = CalcPrintPageNumber(outpatients).ToList();
            var totalPageNum = outpatientList.Max(sp => sp.PrintPageNumber);
            var encounterDate = outpatientList.FirstOrDefault()?.EncounterDate ?? DateTime.Now;

            for (var pageNum = 1; pageNum <= totalPageNum; pageNum++)
            {
                var pageNumber = pageNum;
                var contentByPage = GetContentByPage(outpatientList.Where(r => r.PrintPageNumber == pageNumber));
                htmlBuilder.Append(GetContentPage(pageNumber, contentByPage, encounterDate));
            }

            return htmlBuilder.ToString();
        }

        private static string GetContentPage(int pageNum, string contentByPage, DateTime encounterDate)
        {
            var html = $@"
            <div class=""A4"">
                <div class=""text-center"" style=""font-size: 28px; padding-top: 30px;"">외래완료 환자목록</div>
                <div class=""space-between"" style=""margin: 25px 25px 0 25px;"">
                    <span>{encounterDate.Year}년 {encounterDate.Month}월 {encounterDate.Day}일 외래완료 환자목록</span>
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

        private static string GetContentByPage(IEnumerable<Outpatient> outpatients)
        {
            var html = $@"
            <div style=""margin: 10px 25px 0 25px;"">
                <table class=""table-th-border"" style=""width: 100%;"">
                    <tr>
                        <th>차트번호</th>
                        <th>수진자명</th>
                        <th>주민번호</th>
                        <th>성별</th>
                        <th>나이</th>
                        <th>초진</th>
                        <th>처방일수</th>
                        <th>진료시간</th>
                        <th>일반</th>
                        <th>급여총액</th>
                        <th>본인부담금</th>
                        <th>비급여</th>
                        <th>진료비</th>
                        <th>수납액</th>
                        <th>카드수납액</th>
                        <th>청구액</th>
                        <th>교부번호</th>
                        <th>진료실</th>
                        <th>진료의</th>
                    </tr>
                    {GetContentTable(outpatients)}
                </table>
            </div>
            ";

            return html;
        }

        private static string GetContentTable(IEnumerable<Outpatient> outpatients)
        {
            var htmlBuilder = new StringBuilder();

            foreach (var outpatient in outpatients)
            {
                var html = $@"
                <tr>
                    <td>{outpatient.PatientNo}</td>
                    <td>{outpatient.Name}</td>
                    <td>{outpatient.ResidentRegistrationNumber}</td>
                    <td>{outpatient.Gender}</td>
                    <td>{outpatient.Age}세</td>
                    <td>{Get초재진Check(outpatient)}</td>
                    <td>{outpatient.PrescriptionDays}일</td>
                    <td>{outpatient.ClinicTime}</td>
                    <td>{Get보험구분일반Check(outpatient)}</td>
                    <td>{outpatient.PersonTotalAmount:#,0}</td>
                    <td>{outpatient.PersonCharge:#,0}</td>
                    <td>{outpatient.NonPayment:#,0}</td>
                    <td>{outpatient.MedicalExpenses:#,0}</td>
                    <td>{outpatient.TotalReceiveMoney:#,0}</td>
                    <td>{outpatient.CardAmount:#,0}</td>
                    <td>{outpatient.ClaimAmount:#,0}</td>
                    <td>{outpatient.PrescriptionNumber}</td>
                    <td>{outpatient.ConsultationRoom}</td>
                    <td>{outpatient.Doctor}</td>
                </tr>
                ";

                htmlBuilder.Append(html);
            }

            return htmlBuilder.ToString();
        }

        private static string Get초재진Check(Outpatient outpatient) => outpatient.EncounterType == 초재진.초진 ? "V" : string.Empty;

        private static string Get보험구분일반Check(Outpatient outpatient) => outpatient.UDept == 보험구분.일반 ? "V" : string.Empty;
    }
}
