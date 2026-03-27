using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Remoting.Channels;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using Ysr.Framework.Business.Common.Configuration;
using Ysr.Framework.Business.Common.Engine.Print.Common;
using Ysr.Framework.Business.Common.ExternalLinkage;
using Ysr.Framework.Business.Common.Model.ReceiptModel;
using Ysr.Framework.Common.Global.CommonType;
using Ysr.Framework.Common.Global.Constant;
using Ysr.Framework.Common.Global.Enums;
using Ysr.Framework.Common.Global.Helper;
using Ysr.Framework.Common.Global.Util;
using Ysr.Framework.Common.Ysr.Util;

namespace Ysr.Framework.Business.Common.Engine.Print.Maker
{
    public static class ReceiptMaker
    {
        private const string patientInfoRowHeight = "16pt";
        private const string priceInfoRowHeight = "12pt";
        private const string detailInfoRowHeight = "151pt";

        private const string patientInfo1st너비 = "93pt";
        private const string patientInfo2nd너비 = "147pt";
        private const string patientInfo3rd너비 = "182pt";
        private const string patientInfo4th너비 = "113pt";

        private const string patientInfoBed너비 = "64pt";
        private const string patientInfoUDept너비 = "80pt";
        private const string patientInfoReceiptNumber너비 = "151pt";

        private const string priceInfo1st너비 = "93pt";

        private const string priceInfo금액산정내용너비 = "197pt";
        private const string priceInfo금액세부항목너비 = "49pt";
        private const string priceInfo금액세부항목2칸너비 = "98pt";
        private const string priceInfo금액세부항목3칸너비 = "147pt";

        private const string priceInfo금액세부항목제목너비 = "115pt";
        private const string priceInfo금액세부항목내용너비 = "82pt";

        private const string priceInfo납부한금액너비 = "36pt";
        private const string priceInfo납부한금액세부너비 = "79pt";
        private const string priceInfo납부한금액세부금액너비 = "82pt";

        private const string priceInfo금액세부항목대분류너비 = "18pt";
        private const string priceInfo금액세부항목중분류너비 = "38pt";
        private const string priceInfo금액세부항목소분류너비 = "37pt";

        private const string priceInfo금액세부항목중소분류너비 = "75pt";
        public static string GetReceipt(ReceiptData receipt)
        {
            if (receipt.IsNull()) return string.Empty;
            var htmlBuilder = new StringBuilder();
            htmlBuilder.Append(PrintHelper.GetPrefixHtml(GetStyle()));
            htmlBuilder.Append(GetEachReceiptHtml(receipt));
            htmlBuilder.Append(PrintHelper.GetSuffixHtml());
            return htmlBuilder.ToString();
        }

        private static string GetEachReceiptHtml(ReceiptData receipt)
        {
            var body = $@"
                <div class=""A4"">
                    <div class=""space-between"" style=""width: 174mm; margin-top: 18mm; margin-left: 33mm; display: inline-flex;"">	
                        <p class=""s2"">
                            <span class=""s1"">{Get외래입원여부(receipt.PatientClass)} </span>(<span class=""s3"">{Get입원수납종류(receipt)}) <span class=""s1"">진료비 계산서·영수증</span>
                        </p>
                    </div>
                    <p style=""text-indent: 0pt; text-align: left; ""><br /></p>
                    <p style = ""padding-left: 13mm; text-indent: 0pt; text-align: left;"" >[별지 제 6호서식] </p>
                    <p style=""font-size: 4pt""><br /></p>    
                    {Get영수증Table(receipt)}
                    <div style=""position: absolute; top: 191mm; left: 185mm; "">
                    { Get대표직인()}
                    </div>
                    {GetQrCode(receipt)}
                </div>
                      ";
            return body;
        }

        private static string Get영수증Table(ReceiptData receipt)
        {
            var table = $@"
                    <table style=""border-collapse: collapse; margin-left: 13mm; margin-right: 13mm"" cellspacing=""0"">
                        {GetPatientAndEncounterInfo(receipt)}
                        {GetDetailPriceInfo(receipt)}
                    </table>                    
                    <p style=""padding-top: 4pt; padding-right: 13mm; text-align: right;"">210mm X 297mm[보존용지(2종) 70g/m²]</p>
                             ";

            return table;
        }

        private static string GetPatientAndEncounterInfo(ReceiptData receipt)
        {
            return $@"
                        <tr style = ""height: {patientInfoRowHeight}; "" >
                            <td style = ""width: {patientInfo1st너비};"" colspan = ""3"" >
                                <p class=""columnTitleText"">환자등록번호</p>
                            </td>
                            <td style = ""width: {patientInfo2nd너비};"" colspan=""3"">
                                <p class=""columnTitleText"">환자 성명</p>
                            </td>
                            <td style = ""width: {patientInfo3rd너비};"" colspan=""4"">
                                <p class=""columnTitleText"">진료기간</p>
                            </td>
                            <td style = ""width: {patientInfo4th너비};"">
                                <p class= ""columnTitleText "" > 야간(공휴일)진료 </p >     
                            </td >
                        </tr >     
                        <tr style = ""height: {patientInfoRowHeight};"" >
                            <td style = ""width: {patientInfo1st너비};"" colspan = ""3"" >
                                <p class= ""columnTitleText "" >{receipt.PatientNo}</p >
                            </td >
                            <td style = ""width: {patientInfo2nd너비};"" colspan = ""3"" >
                                <p class= ""columnTitleText "" >{receipt.PatientName}</p >
                            </td >
                            <td style = ""width: {patientInfo3rd너비};"" colspan = ""4"" >
                                <p class= ""columnTitleText "" >{Get진료기간(receipt)}</p >     
                            </td >    
                            <td style = ""width: {patientInfo4th너비};"">
                                <p class= ""columnTitleText "" >{Get야간공휴일여부(receipt)}</p >
                            </td >
                        </tr >
                        <tr style = ""height: {patientInfoRowHeight}; "" >
                            <td style = ""width: {patientInfo1st너비}; "" colspan = ""3"" >
                                <p class= ""columnTitleText "" > 진료과목 </p >
                            </td >
                            <td style = ""width: {patientInfo2nd너비}; "" colspan = ""3"" >
                                <p class= ""columnTitleText "" > 질병군(DRG)번호 </p >
                            </td >
                            <td style = ""width: {patientInfoBed너비}; "" colspan = ""2"" >
                                <p class= ""columnTitleText "" > 병실 </p >
                            </td >
                            <td style = ""width: {patientInfoUDept너비}; "" colspan = ""1"" >
                                <p class= ""columnTitleText "" > 환자구분 </p >
                            </td >
                            <td style = ""width: {patientInfoReceiptNumber너비}; "" colspan = ""2"" >
                                <p class= ""columnTitleText "" > 영수증번호(연월 - 일련번호) </p >
                            </td >
                        </tr >
                        <tr style = ""height: {patientInfoRowHeight}; "" >
                            <td style = ""width: {patientInfo1st너비}; "" colspan = ""3"" >
                                <p class= ""columnTitleText "" >{TypeValue.SubjectName[receipt.TargetEncounter.Subject]}</p >
                            </td >
                            <td style = ""width: {patientInfo2nd너비}; "" colspan = ""3"" >
                                <p class= ""columnTitleText "" >{receipt.DRGNo}</p >
                            </td >
                            <td style = ""width: {patientInfoBed너비}; "" colspan = ""2"" >
                                <p class= ""columnTitleText "" >{receipt.BedNumber}</p >
                            </td >
                            <td style = ""width: {patientInfoUDept너비}; "" colspan = ""1"" >
                                <p class= ""columnTitleText "" >{EnumUtil.GetEnumDescription<보험구분>(receipt.TargetEncounter.UDept)}</p >
                            </td >
                            <td style = ""width: {patientInfoReceiptNumber너비}; "" colspan = ""2"" >
                                <p class= ""columnTitleText "" >{receipt.영수증번호}</p >
                            </td >
                        </tr >
                ";
        }

        private static string GetDetailPriceInfo(ReceiptData receipt)
        {
            return $@"
                        <tr style = ""height: {priceInfoRowHeight}; "" >
                            <td style = ""width: {priceInfo1st너비}; "" colspan = ""3"" rowspan = ""3"">                                
                                <p class=""columnTitleText"">항목</p>
                            </td>
                            <td style = ""width: {priceInfo금액세부항목3칸너비}; "" colspan=""3"">
                                <p class=""columnTitleText"" style=""line-height: 9pt;"">급여</p>
                            </td>
                            <td style = ""width: {priceInfo금액세부항목2칸너비}; "" colspan=""2"">
                                <p class=""columnTitleText"" style=""line-height: 9pt;"">비급여</p>
                            </td>
                            <td style = ""width: {priceInfo금액산정내용너비};"" colspan = ""3"" >
                                <p class= ""columnTitleText"" > 금액산정내용 </p>     
                            </td>
                        </tr>     
                        <tr style = ""height: {priceInfoRowHeight}; "" >
                            <td style = ""width: {priceInfo금액세부항목2칸너비};"" colspan = ""2"" >
                                <p class= ""columnTitleText"" style=""line-height: 9pt;"" >일부 본인부담</p>
                            </td>
                            <td style = ""width: {priceInfo금액세부항목너비};"" rowspan = ""2"" >
                                <p class= ""columnTitleText"" style=""line-height: 11pt;"" >
                                    <span>
                                        전액<br />
                                        본인부담
                                    </span>
                                </p>
                            </td>
                            <td style = ""width: {priceInfo금액세부항목너비};"" rowspan = ""2"" >
                                <p class= ""columnTitleText"" style=""line-height: 11pt;"" >
                                    <span>
                                        선택<br />
                                        진료료
                                    </span>
                                </p>
                            </td>
                            <td style = ""width: {priceInfo금액세부항목너비};"" rowspan = ""2"" >
                                <p class= ""columnTitleText"" style=""line-height: 11pt; font-size:7.5pt"" >
                                    <span>
                                        선택진료료<br />
                                        이외
                                    </span>
                                </p>
                            </td>
                            <td style = ""width: {priceInfo금액세부항목제목너비};"" colspan = ""2"" rowspan=""2"" >
                                <p class= ""columnTitleText"">
                                    <span>
                                        ⑦ 진료비 총액<br />
                                        (①+②+③+④+⑤)
                                    </span>
                                </p>
                            </td>
                            <td style=""width: {priceInfo금액세부항목내용너비};"" rowspan=""2"" >
                                <p class=""columnPriceSummaryValueText"">{receipt.합계.TotalJinryobi:n0}</p>
                            </td>
                        </tr >
                        <tr style = ""height: {priceInfoRowHeight}; "" >
                            <td style = ""width: {priceInfo금액세부항목너비};"">
                                <p class= ""columnTitleText"" style=""line-height: 9pt;font-size:7.5pt;"" >본인부담금</p>
                            </td>
                            <td style = ""width: {priceInfo금액세부항목너비};"">
                                <p class= ""columnTitleText"" style=""line-height: 9pt;font-size:7.5pt;"" >공단부담금</p>
                            </td>
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight}; "" >
                            <td style = ""width: {priceInfo금액세부항목대분류너비};"" rowspan=""16"">
                                <p class= ""columnTitleText"" style=""line-height: 117%;"" >
                                    <span>
                                        기<br />
                                        본<br />
                                        항<br />
                                        목<br />
                                    </span>
                                </p>
                            </td>
                            <td style = ""width: {priceInfo금액세부항목중소분류너비};"" colspan=""2"">
                                <p class= ""columnPriceTitleText"" style=""line-height: 9pt;"" >진 찰 료</p>
                            </td>
                            {Get항목별세부금액(receipt, "01")}                            
                            <td style = ""width: {priceInfo금액세부항목제목너비};"" colspan=""2"" rowspan=""2"">
                                <p class= ""columnTitleText"" >
                                    <span>
                                        ⑧ 환자부담 총액<br />
                                        (①-⑥)+③+④+⑤
                                    </span>
                                </p>
                            </td>
                            <td style=""width: {priceInfo금액세부항목내용너비};"" rowspan=""2"" >
                                <p class=""columnPriceSummaryValueText"">{receipt.환자부담총액:n0}</p>
                            </td>
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight}; "">
                            <td style = ""width: {priceInfo금액세부항목중소분류너비};"" colspan=""2"">
                                <p class= ""columnPriceTitleText"" style=""line-height: 9pt;"" >입 원 료</p>
                            </td>
                            {Get항목별세부금액(receipt, "02")}     
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight}; "">
                            <td style = ""width: {priceInfo금액세부항목중소분류너비};"" colspan=""2"">
                                <p class= ""columnPriceTitleText"" style=""line-height: 9pt;"" >식대</p>
                            </td>
                            {Get항목별세부금액(receipt, "21")}     
                            <td style = ""width: {priceInfo금액세부항목제목너비};"" colspan=""2"" rowspan=""2"">
                                <p class= ""columnTitleText"">⑨ 이미 납부한 금액</p>
                            </td>
                            <td style=""width: {priceInfo금액세부항목내용너비};"" rowspan=""2"" >
                                <p class=""columnPriceSummaryValueText"">{receipt.합계.RefundPrice-receipt.합계.ReceivableAmount:n0}</p>
                            </td>
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight}; "">
                            <td style = ""width: {priceInfo금액세부항목중분류너비};"" rowspan=""2"">
                                <p class=""columnPriceTitleSmallText"">
                                    <span>
                                        투약 및<br />
                                        조제료
                                    </span>
                                </p>
                            </td>
                            <td style = ""width: {priceInfo금액세부항목소분류너비};"">
                                <p class=""columnPriceTitleText"" style=""line-height: 10pt;"">행위료</p>
                            </td>
                            {Get항목별세부금액(receipt, "03_Act")}   
                        </tr>

                        <tr style = ""height: {priceInfoRowHeight}; "">                
                            <td style = ""width: {priceInfo금액세부항목소분류너비};"">
                                <p class=""columnPriceTitleText"" style=""line-height: 10pt;"">약품비</p>
                            </td>
                            {Get항목별세부금액(receipt, "03")}   
                            <td style = ""width: {priceInfo금액세부항목제목너비};"" colspan=""2"" rowspan=""2"">
                                <p class= ""columnTitleText"">
                                    <span>
                                        ⑩ 납부할 금액<br />
								        (⑧-⑨)
                                    </span>                                
                                </p>
                            </td>
                            <td style=""width: {priceInfo금액세부항목내용너비};"" rowspan=""2"" >
                                <p class=""columnPriceSummaryValueText"">{receipt.납부할금액:n0}</p>
                            </td>
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight}; "">                
                            <td style = ""width: {priceInfo금액세부항목중분류너비};"" rowspan=""2"">
                                <p class=""columnTitleText"">주사료</p>
                            </td>
                            <td style = ""width: {priceInfo금액세부항목소분류너비};"">
                                <p class=""columnPriceTitleText"" style=""line-height: 9pt;"">행위료</p>
                            </td>
                            {Get항목별세부금액(receipt, "05_Act")}                               
                        </tr>                        
                        <tr style = ""height: {priceInfoRowHeight}; "">                                            
                            <td style = ""width: {priceInfo금액세부항목소분류너비};"">
                                <p class=""columnPriceTitleText"" style=""line-height: 9pt;"">약품비</p>
                            </td>
                            {Get항목별세부금액(receipt, "05")}                               
                            <td style = ""width: {priceInfo납부한금액너비};"" rowspan=""4"">
                                <p class= ""columnTitleText"">
                                    <span>
                                        ⑪ 납부한 금액
                                    </span>                                
                                </p>
                            </td>
                            <td style=""width: {priceInfo납부한금액세부너비};"" >
                                <p class=""columnTitleText"">카드</p>
                            </td>
                            <td style=""width: {priceInfo납부한금액세부금액너비};"" >
                                <p class=""columnPriceSummaryValueText"">{receipt.카드수납액:n0}</p>
                            </td>
                        </tr>                        
                        <tr style = ""height: {priceInfoRowHeight}; "">
                            <td style = ""width: {priceInfo금액세부항목중소분류너비};"" colspan=""2"">
                                <p class= ""columnPriceTitleText"">마취료</p>
                            </td>
                            {Get항목별세부금액(receipt, "06")}     
                            <td style=""width: {priceInfo납부한금액세부너비};"" >
                                <p class=""columnTitleText"">현금영수증</p>
                            </td>
                            <td style=""width: {priceInfo납부한금액세부금액너비};"" >
                                <p class=""columnPriceSummaryValueText"">{receipt.현금영수증금액:n0}</p>
                            </td>
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight}; "">
                            <td style = ""width: {priceInfo금액세부항목중소분류너비};"" colspan=""2"">
                                <p class= ""columnPriceTitleText"">처치 및 수술료</p>
                            </td>
                            {Get항목별세부금액(receipt, "09")}     
                            <td style=""width: {priceInfo납부한금액세부너비};"" >
                                <p class=""columnTitleText"">현금</p>
                            </td>
                            <td style=""width: {priceInfo납부한금액세부금액너비};"" >
                                <p class=""columnPriceSummaryValueText"">{receipt.현금수납액:n0}</p>
                            </td>
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight};"">
                            <td style = ""width: {priceInfo금액세부항목중소분류너비};"" colspan=""2"">
                                <p class= ""columnPriceTitleText"">검사료</p>
                            </td>
                            {Get항목별세부금액(receipt, "11")}     
                            <td style=""width: {priceInfo납부한금액세부너비};"" >
                                <p class=""columnTitleText"">합계</p>
                            </td>
                            <td style=""width: {priceInfo납부한금액세부금액너비};"" >
                                <p class=""columnPriceSummaryValueText"">{receipt.카드수납액 + receipt.현금수납액 + receipt.현금영수증금액:n0}</p>
                            </td>
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight}; "">
                            <td style = ""width: {priceInfo금액세부항목중소분류너비};"" colspan=""2"">
                                <p class= ""columnPriceTitleText"">영상진단료</p>
                            </td>
                            {Get항목별세부금액(receipt, "13")}     
                            <td style=""width: {priceInfo금액세부항목제목너비};"" colspan=""2"" >
                                <p class=""columnTitleText"">납부하지 않은 금액(⑩-⑪)</p>
                            </td>
                            <td style=""width: {priceInfo금액세부항목내용너비};"" >
                                <p class=""columnPriceSummaryValueText"">{receipt.납부할금액-(receipt.카드수납액 + receipt.현금수납액 + receipt.현금영수증금액) - receipt.건강생활유지비:n0}</p>
                            </td>
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight}; "">
                            <td style = ""width: {priceInfo금액세부항목중소분류너비};"" colspan=""2"">
                                <p class= ""columnPriceTitleText"">방사선치료료</p>
                            </td>
                            {Get항목별세부금액(receipt, "20")}     
                            <td style=""width: 197pt;"" colspan=""3"" >
                                <p class=""columnTitleText"">{(receipt.현금영수증금액 > 0 ? "현금영수증 (소득공제)": "현금영수증 (    )")}</p>
                            </td>                            
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight}; "">
                            <td style = ""width: {priceInfo금액세부항목중소분류너비};"" colspan=""2"">
                                <p class= ""columnPriceTitleText"">치료재료대</p>
                            </td>
                            {Get항목별세부금액(receipt, "10")}     
                            <td style=""width: {priceInfo금액세부항목제목너비};"" colspan=""2"" >
                                <p class=""columnTitleText"">신분확인번호</p>
                            </td>                            
                            <td style=""width: {priceInfo금액세부항목내용너비};"" >
                                <p class=""columnTitleText"">{receipt.신분확인번호}</p>
                            </td>
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight}; "">
                            <td style = ""width: {priceInfo금액세부항목중소분류너비};"" colspan=""2"">
                                <p class= ""columnPriceTitleSmallText"">재활 및 물리치료료</p>
                            </td>
                            {Get항목별세부금액(receipt, "07")}     
                            <td style=""width: {priceInfo금액세부항목제목너비};"" colspan=""2"" >
                                <p class=""columnTitleText"">현금승인번호</p>
                            </td>                            
                            <td style=""width: {priceInfo금액세부항목내용너비};"" >
                                <p class=""columnTitleText"">{receipt.현금승인번호}</p>
                            </td>
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight}; "">
                            <td style = ""width: {priceInfo금액세부항목중소분류너비};"" colspan=""2"">
                                <p class= ""columnPriceTitleText"">정신요법료</p>
                            </td>
                            {Get항목별세부금액(receipt, "08")}     
                            <td style=""width: 197pt; vertical-align: top;border-bottom-width: 0pt;"" colspan=""3"" >
                                <p class=""columnTitleText"" style=""text-indent: 0pt; text-align: left;"">* 요양기관 임의활용공간</p>                                
                            </td>
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight}; "">
                            <td style = ""width: {priceInfo금액세부항목중소분류너비};"" colspan=""2"">
                                <p class= ""columnPriceTitleSmallText"" style=""font-size: 5pt;"">전혈 및 혈액성분제제료</p>
                            </td>
                            {Get항목별세부금액(receipt, "22")}                                 
                            <td style=""width: 197pt; vertical-align: top;border-top-width: 0pt; border-bottom-width: 0pt;"" colspan=""3"" >
                                <p class=""columnTitleText"" style=""text-indent: 0pt; text-align: left;"">{receipt.본인부담문구}</p>                                
                            </td>
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight}; "" >
                            <td style = ""width: {priceInfo금액세부항목대분류너비};"" rowspan=""6"">
                                <p class= ""columnTitleText"" style=""line-height: 117%;"" >
                                    <span>
                                        선<br />
                                        택<br />
                                        항<br />
                                        목<br />
                                    </span>
                                </p>
                            </td>
                            <td style = ""width: {priceInfo금액세부항목중소분류너비};"" colspan=""2"">
                                <p class= ""columnPriceTitleText"">CT 진단료</p>
                            </td>
                            {Get항목별세부금액(receipt, "14")}
                            <td style=""width: 197pt; vertical-align: top;border-top-width: 0pt; border-bottom-width: 0pt;"" colspan=""3"" >
                                <p class=""columnTitleText"" style=""text-indent: 0pt; text-align: left;"">{receipt.계좌이체문구}</p>                                
                            </td>
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight}; "" >
                            <td style = ""width: {priceInfo금액세부항목중소분류너비};"" colspan=""2"">
                                <p class= ""columnPriceTitleText"">MRI 진단료</p>
                            </td>
                            {Get항목별세부금액(receipt, "15")}
                            <td style=""width: 197pt; vertical-align: top;border-top-width: 0pt; border-bottom-width: 0pt;"" colspan=""3"" >
                                <p class=""columnTitleText"" style=""text-indent: 0pt; text-align: left;"">{receipt.지원금문구}</p>
                            </td>
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight}; "" >
                            <td style = ""width: {priceInfo금액세부항목중소분류너비};"" colspan=""2"">
                                <p class= ""columnPriceTitleText"">PET 진단료</p>
                            </td>
                            {Get항목별세부금액(receipt, "19")}
                            <td style=""width: 197pt; vertical-align: top;border-top-width: 0pt; border-bottom-width: 0pt;"" colspan=""3"" >
                                <p class=""columnTitleText"" style=""text-indent: 0pt; text-align: left;"">{receipt.감액문구}</p>
                            </td>
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight}; "" >
                            <td style = ""width: {priceInfo금액세부항목중소분류너비};"" colspan=""2"">
                                <p class= ""columnPriceTitleText"">초음파진단료</p>
                            </td>
                            {Get항목별세부금액(receipt, "16")}
                            <td style=""width: 197pt; vertical-align: top;border-top-width: 0pt; border-bottom-width: 0pt;"" colspan=""3"" rowspan=""1"">
                                <p class=""columnTitleText"" style=""text-indent: 0pt; text-align: left;"">{receipt.내원일연도문구}</p>
                            </td>
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight}; "" >
                            <td style = ""width: {priceInfo금액세부항목중소분류너비};"" colspan=""2"">
                                <p class= ""columnPriceTitleSmallText"">보철ㆍ교정료ㆍ기타</p>
                            </td>
                            {Get항목별세부금액(receipt, "17")}                            
                            <td style=""width: 197pt; vertical-align: top;border-top-width: 0pt; border-bottom-width: 0pt;"" colspan=""3"" rowspan=""2"">
                                <p class=""columnTitleText"" style=""text-indent: 0pt; text-align: left;"">{receipt.내원일목록문구}</p>
                            </td>
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight}; "" >
                            <td style = ""width: {priceInfo금액세부항목중소분류너비};"" colspan=""2"">
                                <p class= ""columnPriceTitleText"">{receipt.기타항목}</p>
                            </td>
                            {Get항목별세부금액(receipt, "etc")}
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight}; "" >
                            <td style = ""width: {priceInfo1st너비};"" colspan=""3"">
                                <p class= ""columnPriceTitleText"">65세 이상 등 정액</p>
                            </td>
                            {Get항목별세부금액(receipt, "_DEF")}
                            <td style=""width: 197pt; vertical-align: top;border-top-width: 0pt; border-bottom-width: 0pt;"" colspan=""3"" rowspan=""4"">
                                <p class=""columnTitleText"" style=""text-indent: 0pt; text-align: left;"">{receipt.합계.PrintMemo}</p>
                            </td>
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight}; "" >
                            <td style = ""width: {priceInfo1st너비};"" colspan=""3"">
                                <p class= ""columnPriceTitleText"">정액수가(요양병원)</p>
                            </td>
                            {Get항목별세부금액(receipt, "18")}
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight}; "" >
                            <td style = ""width: {priceInfo1st너비};"" colspan=""3"">
                                <p class= ""columnPriceTitleText"">포괄수가진료비</p>
                            </td>
                            {Get항목별세부금액(receipt, "_DRG")}
                        </tr>                      
                        <tr style = ""height: {priceInfoRowHeight}; "" >
                            <td style = ""width: {priceInfo1st너비};"" colspan=""3"">
                                <p class= ""columnPriceTitleText"">합계</p>
                            </td>
                            <td style = ""width: {priceInfo금액세부항목너비};"">
                                <span class=""columnPriceValueText"" style=""float:left; padding-top:1.5pt"">①</span>
                                <span class=""columnPriceValueText"" style=""float:right; padding-top:1.5pt"">{receipt.합계.PersonCharge:n0}</span>                                   
                            </td>
                            <td style = ""width: {priceInfo금액세부항목너비};"">
                                <span class=""columnPriceValueText"" style=""float:left; padding-top:1.5pt"">②</span>
                                <span class=""columnPriceValueText"" style=""float:right; padding-top:1.5pt"">{receipt.합계.ClaimAmount:n0}</span>                                
                            </td>
                            <td style = ""width: {priceInfo금액세부항목너비};"">
                                <span class=""columnPriceValueText"" style=""float:left; padding-top:1.5pt"">③</span>
                                <span class=""columnPriceValueText"" style=""float:right; padding-top:1.5pt"">{receipt.항목별전액본인부담금.Get세부금액총합():n0}</span>                                
                            </td>
                            <td style = ""width: {priceInfo금액세부항목너비};"">
                                <span class=""columnPriceValueText"" style=""float:left; padding-top:1.5pt"">④</span>
                                <span class=""columnPriceValueText"" style=""float:right; padding-top:1.5pt"">0</span>                                                                
                            </td>
                            <td style = ""width: 50pt;"">
                                <span class=""columnPriceValueText"" style=""float:left; padding-top:1.5pt"">⑤</span>
                                <span class=""columnPriceValueText"" style=""float:right; padding-top:1.5pt"">{receipt.항목별선택진료료이외.Get세부금액총합():n0} </span>
                            </td>
                        </tr>
                        <tr style = ""height: {priceInfoRowHeight}; "" >
                            <td style = ""width: {priceInfo1st너비};"" colspan=""3"">
                                <p class= ""columnPriceTitleText"">상한액 초과금</p>
                            </td>
                            <td style = ""width: {priceInfo금액세부항목너비};"">
                                <span class=""columnPriceValueText"" style=""float:left; padding-top:1.5pt"">⑥</span>
                                <span class=""columnPriceValueText"" style=""float:right; padding-top:1.5pt"">{receipt.상한액초과금:n0}</span>
                            </td>
                            <td style = ""width: {priceInfo금액세부항목2칸너비};"" colspan=""2"">
                                <p class=""columnPriceValueText""></p>
                            </td>
                            <td style = ""width: {priceInfo금액세부항목2칸너비};"" colspan=""2"">
                                <p class=""columnPriceValueText""></p>
                            </td>
                            <td style = ""width: 76pt;"" colspan=""2"">
                                <p class=""columnPriceTitleText"">선택진료 신청</p>
                            </td>
                            <td style = ""width: 57pt;"">
                                <p class=""columnPriceTitleText"">[ ] 유&nbsp;&nbsp;&nbsp;[ ] 무</p>
                            </td>
                        </tr>
                        <tr style = ""height: {patientInfoRowHeight}; "" >
                            <td style = ""width: {priceInfo1st너비};"" colspan=""3"">
                                <p class= ""columnPriceTitleText"">요양기관 종류</p>
                            </td>
                            <td style = ""width: 442pt;"" colspan=""8"">
                                <p class=""columnPriceTitleText"" style=""padding-left:3pt; text-align:left;"">{Get요양기관종류(receipt)}</p>
                            </td>
                        </tr>
                        <tr style = ""height: {patientInfoRowHeight}; "" >
                            <td style = ""width: {priceInfo1st너비};"" colspan=""3"">
                                <p class= ""columnTitleText"">사업자등록번호</p>
                            </td>
                            <td style = ""width: {priceInfo금액세부항목2칸너비};"" colspan=""2"">
                                <p class= ""columnPriceValueText"" style=""text-align:left;"">{receipt.요양기관정보.BizRegNum}</p>
                            </td>
                            <td style = ""width: {priceInfo금액세부항목너비};"">
                                <p class= ""columnTitleText"">상호</p>
                            </td>
                            <td style = ""width: 114pt;"" colspan=""3"">
                                <p class= ""columnPriceValueText"" style=""text-align:left;"">{receipt.요양기관정보.Name}</p>
                            </td>
                            <td style = ""width: 64pt;"">
                                <p class= ""columnTitleText"">전화번호</p>
                            </td>
                            <td style = ""width: 64pt;"">
                                <p class= ""columnPriceTitleText"" style=""padding-left: 2pt; text-align: left;"">{receipt.요양기관정보.Telephone}</p>
                            </td>
                        </tr>
                        <tr style = ""height: {patientInfoRowHeight}; "" >
                            <td style = ""width: {priceInfo1st너비};"" colspan=""3"">
                                <p class= ""columnTitleText"">사업장 소재지</p>
                            </td>
                            <td style = ""width: 245pt;"" colspan=""6"">
                                <p class= ""columnStringValueText"" style=""padding-left: 2pt; text-align:left;"">{receipt.요양기관정보.Address}</p>
                            </td>
                            <td style = ""width: 76pt;"">
                                <p class= ""columnTitleText"">대표자</p>
                            </td>
                            <td style = ""width: 121pt;"" colspan=""6"">
                                <span class=""columnStringValueText"" style=""float:left; padding-left: 2pt;padding - top:1.5pt"">{receipt.요양기관정보.DirectorName}</span>
                                <span class=""columnStringValueText"" style=""float:right; padding-right: 2pt; padding-top:1.5pt"">[인]</span>
                            </td>
                        </tr>
                        <tr style = ""height: {patientInfoRowHeight}; "" >
                            <td style = ""width: 535pt;"" colspan=""11"">
                                <p class= ""columnTitleText"">{receipt.PrintDate:yyyy년 MM월 dd일}</p>
                            </td>
                        </tr>
                        <tr style = ""height: {patientInfoRowHeight}; "" >
                            <td style = ""width: 294pt;"" colspan=""8"">
                                <p class= ""columnTitleText"" style=""line-height: 10pt;"">항목별 설명</p>
                            </td>
                            <td style = ""width: 241pt;"" colspan=""3"">
                                <p class= ""columnTitleText"" style=""line-height: 10pt;"">일반사항 안내</p>
                            </td>
                        </tr>
                        <tr style = ""height: {detailInfoRowHeight}; "" >
                            <td style = ""width: 294pt;"" colspan=""8"">
                                <ol id=""l1"">
                                    <li data-list-text=""1."">
                                        <p class=""columnInformationValueText"" style = ""padding-left: 19pt;"">
                                            <span>
                                                일부 본인부담 : 일반적으로 다음과 같이 본인부담률을 적용하나, 요양기관 지역, 요양기관의 종별, 환자 자격 등에 따라 달라질 수 있습니다.
                                            </span>       
                                        </p>
                                        <ul id=""l2"">
                                            <li data-list-text=""-"">
                                                <p class=""columnInformationValueText"" style = ""padding-left: 22pt;"">
                                                    <span>
                                                        외래 본인부담률 : 요양기관 종별에 따라 30%~60%(의료급여는 수급권자 종별 및 의료급여기관 유형등에 따라 0원~2500원, 0%~15%) 등
                                                    </span>       
                                                </p>
                                            </li>
                                            <li data-list-text=""-"">
                                                <p class=""columnInformationValueText"" style = ""padding-left: 22pt;"">
                                                    <span>
                                                        입원 본인부담률 : 20%(의료급여는 수급권자 종별 및 의료급여기관 유형 등에 따라 0%~10%) 등
                                                    </span>       
                                                </p>
                                            </li>
                                        </ul>
                                    </li>
                                </ol>
                                <p class=""columnInformationValueText"" style=""padding-left: 16pt; text-indent: 0pt;"">※ 식대 : 50%(의료급여는 20%)</p>
						        <p class=""columnInformationValueText"" style=""padding-left: 22pt; text-indent: 0pt;"">CT·MRI·PET : 외래 본인부담률(의료급여는 입원 본인부담률과 동일)</p>
						        <ol id=""l3"">
							        <li data-list-text=""2."">
								        <p class=""columnInformationValueText"" style=""padding-left: 19pt;"">
									        <span>
										        전액 본인부담 :「국민건강보험법 시행규칙」별표5 또는 「의료급여법 시행규칙」별표 1의 2에 따라 적용되는 항목으로 건강보험(의료급여)에서 금액을 정하고 있으나 진료비 전액을 환자 본인이 부담합니다.
									        </span>
								        </p>
							        </li>
							        <li data-list-text=""3.""><p class=""columnInformationValueText"" style=""padding-left: 20pt; line-height: 10pt;"">상한액 초과금 : 본인부담액 상한제에 따라 같은 의료기관에서 연간 {receipt.본인부담금상한액:n0}원(환자 자격 등에 따라 다를 수 있음) 이상 본인부담금이 발생한 경우 공단이 부담하는 초과분 중 사전 정산하는 금액을 말합니다.</p></li>
						        </ol>                    
                            </td>
					        <td style="" width: 241pt;""colspan=""3"">
						        <ol id=""l4"">
							        <li data-list-text=""1."">
								        <p class=""columnInformationValueText"" style=""padding-left: 15pt;"">
									        <span>
										        이 계산서ㆍ영수증에 대한 세부내용은 요양기관에 요구하여 제공받을 수 있습니다. 
									        </span>
								        </p>
							        </li>
							        <li data-list-text=""2."">
								        <p class=""columnInformationValueText"" style=""padding-left: 15pt; line-height: 10pt;"">「국민건강보험법」제43조의2 또는 「의료급여법」</p>
								        <p class=""columnInformationValueText"" style=""padding-left: 15pt; text-indent: 0pt; "">
									        <span>
										        제 11조의 3에 따라 환자가 전액 부담한 비용과 비급여
										        로 부담한 비용의 타당성 여부를 건강보험심사평가원
										        (☏1644-2000, 홈페이지 : www.hira.or.kr)에 확인 요청
										        하실 수 있습니다.
									        </span>
								        </p>
							        </li>
							        <li data-list-text=""3."">
								        <p class=""columnInformationValueText"" style=""padding-left: 15pt;"">
									        <a href=""http://현금영수증.kr"" class=""s8"" target=""_blank"">
										        계산서·영수증은「소득세법」에 따른 의료비 공제신청 또는 「조세특례제한법」에 따른 현금영수증 공제신청
										        (현금영수증 승인번호가 적힌 경우만 해당합니다)에 사
										        용할 수 있습니다. 다만, 지출증빙용으로 발급된 &quot;현금
										        영수증(지출증빙)&quot;은 공제신청에 사용할 수 없습니다.
										        (현금영수증 문의 126 인터넷 홈페이지 :
									        </a>
									        <span>
										        http://현금영수증.kr)
									        </span>
								        </p>
							        </li>
						        </ol>
					        </td>
				        </tr>
                        <tr style=""height: 15pt;"">
					        <td style=""width: 56pt;"" colspan=""11"">
						        <p class=""columnTitleText"" style=""padding-left: 14pt;text-align: left;"">주(註) : 진료항목 중 선택항목은 요양기관의 특성에 따라 추가 또는 생략할 수 있습니다.</p>
					        </td>                                
				        </tr>
                ";
        }

        private static string Get요양기관종류(ReceiptData receipt)
        {
            return (receipt.요양기관정보.HosStep == 진료기관.의원1차
                       ? "[V] 의원급ㆍ보건기관 &nbsp;&nbsp;&nbsp;[ ] 병원급"
                       : "[ ] 의원급ㆍ보건기관 &nbsp;&nbsp;&nbsp;[V] 병원급")
                   + " &nbsp;&nbsp;&nbsp;[ ] 종합병원 &nbsp;&nbsp;&nbsp;[ ] 상급종합병원";
        }

        private static string Get외래입원여부(환자구분 patientClass)
        {
            return patientClass == 환자구분.외래 ? "[V] 외래 [ ]입원 " : "[ ] 외래[V] 입원";
        }

        private static string Get항목별세부금액(ReceiptData receipt, string item)
        {
            //var 본인부담금 = 0;
            //var 공단부담금 = 0;
            //var 전액본인부담금 = 0;
            //var 선택진료료 = 0;
            //var 선택진료료이외 = 0;
            //if (item.StartsWith("03"))
            //{
            //    receipt.항목별본인부담금.Get세부금액(item)
                //본인부담금 = (int)typeof(BoninSunab).GetFields(BindingFlags.Instance | BindingFlags.Public)
                //    .Where(x => (x.Name == "B" + item) || (x.Name == ("B" + item).Replace("03", "04")))
                //    .Sum(x => (int)x.GetValue(receipt.항목별본인부담금));
                //공단부담금 = (int)typeof(GongdanSunab).GetFields(BindingFlags.Instance | BindingFlags.Public)
                //    .Where(x => (x.Name == "G" + item) || (x.Name == ("G" + item).Replace("03", "04")))
                //    .Sum(x => (int)x.GetValue(receipt.항목별공단부담금));
                //전액본인부담금 = (int)typeof(AllBoninSunab).GetFields(BindingFlags.Instance | BindingFlags.Public)
                //    .Where(x => (x.Name == "A" + item) || (x.Name == ("A" + item).Replace("03", "04")))
                //    .Sum(x => (int)x.GetValue(receipt.항목별전액본인부담금));
                //선택진료료 = (int)typeof(ChoiceSunab).GetFields(BindingFlags.Instance | BindingFlags.Public)
                //    .Where(x => (x.Name == "C" + item) || (x.Name == ("C" + item).Replace("03", "04")))
                //    .Sum(x => (int)x.GetValue(receipt.항목별선택진료료));
                //선택진료료이외 = (int)typeof(ChoiceEtcSunab).GetFields(BindingFlags.Instance | BindingFlags.Public)
                //    .Where(x => (x.Name == "E" + item) || (x.Name == ("E" + item).Replace("03", "04")))
                //    .Sum(x => (int)x.GetValue(receipt.항목별선택진료료이외));
            //}
            //else
            //{
            //    본인부담금 = (int)typeof(BoninSunab).GetFields(BindingFlags.Instance | BindingFlags.Public)
            //        .Where(x => x.Name.StartsWith("B" + item))
            //        .Sum(x => (int)x.GetValue(receipt.항목별본인부담금));
            //    공단부담금 = (int)typeof(GongdanSunab).GetFields(BindingFlags.Instance | BindingFlags.Public)
            //        .Where(x => x.Name.StartsWith("G" + item))
            //        .Sum(x => (int)x.GetValue(receipt.항목별공단부담금));
            //    전액본인부담금 = (int)typeof(AllBoninSunab).GetFields(BindingFlags.Instance | BindingFlags.Public)
            //        .Where(x => x.Name.StartsWith("A" + item))
            //        .Sum(x => (int)x.GetValue(receipt.항목별전액본인부담금));
            //    선택진료료 = (int)typeof(ChoiceSunab).GetFields(BindingFlags.Instance | BindingFlags.Public)
            //        .Where(x => x.Name.StartsWith("C" + item))
            //        .Sum(x => (int)x.GetValue(receipt.항목별선택진료료));
            //    선택진료료이외 = (int)typeof(ChoiceEtcSunab).GetFields(BindingFlags.Instance | BindingFlags.Public)
            //        .Where(x => x.Name.StartsWith("E" + item))
            //        .Sum(x => (int)x.GetValue(receipt.항목별선택진료료이외));
            //}

            return $@"
                <td style = ""width: {priceInfo금액세부항목너비};"">
                    <p class=""columnPriceValueText"">{receipt.항목별본인부담금.Get세부금액(item):n0}</p>
                </td>
                <td style = ""width: {priceInfo금액세부항목너비};"">
                    <p class=""columnPriceValueText"">{receipt.항목별공단부담금.Get세부금액(item):n0}</p>
                </td>
                <td style = ""width: {priceInfo금액세부항목너비};"">
                    <p class=""columnPriceValueText"">{receipt.항목별전액본인부담금.Get세부금액(item):n0}</p>
                </td>
                <td style = ""width: {priceInfo금액세부항목너비};"">
                    <p class=""columnPriceValueText"">{receipt.항목별선택진료료.Get세부금액(item):n0}</p>
                </td>
                <td style = ""width: {priceInfo금액세부항목너비};"">
                    <p class=""columnPriceValueText"">{receipt.항목별선택진료료이외.Get세부금액(item):n0}</p>
                </td>";
        }

        //private static int Get전액본인부담합계액(ReceiptData receipt)
        //{
        //    return (int)typeof(AllBoninSunab).GetFields(BindingFlags.Instance | BindingFlags.Public)
        //        .Where(x => x.Name.StartsWith("A"))
        //        .Sum(x => (int)x.GetValue(receipt.항목별전액본인부담금));
        //}

        //private static int Get선택진료료이외합계액(ReceiptData receipt)
        //{
        //    return (int)typeof(AllBoninSunab).GetFields(BindingFlags.Instance | BindingFlags.Public)
        //        .Where(x => x.Name.StartsWith("E"))
        //        .Sum(x => (int)x.GetValue(receipt.항목별전액본인부담금));
        //}
        private static string Get입원수납종류(ReceiptData receipt)
        {
            return receipt.PatientClass == 환자구분.외래 ? "[ ]퇴원[ ] 중간 " :
                receipt.퇴원수납여부 ? "[V]퇴원[ ] 중간 " : "[ ]퇴원[V] 중간 ";
        }

        private static string Get진료기간(ReceiptData receipt)
        {
            return receipt.FromDate == receipt.ToDate 
                ? receipt.FromDate.ToString("yyyy-MM-dd") 
                : $@"{receipt.FromDate.ToString("yyyy-MM-dd")} ~ {receipt.ToDate.ToString("yyyy-MM-dd")}";
        }

        private static string Get야간공휴일여부(ReceiptData receipt)
        {
            var str = string.Empty;
            switch (receipt.TargetEncounter.DayNightHoliday)
            {
                case 주간야간휴일구분.없음:
                case 주간야간휴일구분.주간:
                    str = "[ ]야간 &nbsp;[ ]공휴일";
                    break;
                case 주간야간휴일구분.야간:
                    str = "[V]야간 &nbsp;[ ]공휴일";
                    break;
                case 주간야간휴일구분.휴일:
                    str = "[ ]야간 &nbsp;[V]공휴일";
                    break;
                case 주간야간휴일구분.야간토요공휴:
                    str = "[V]야간 &nbsp;[V]공휴일";
                    break;
            }

            return str;
        }

        private static string GetStyle()
        {
            return @"<style type=""text/css"">	
              * {
            margin: 0;
            padding: 0mm;
                text-indent: 0;
            }            
            .s1 {
            color: black;
                font-family: 바탕체, serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 15pt;
            }
            .s2 {
            color: black;
                font-family: 바탕체, serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 12pt;
                vertical-align: 1pt;
            }
            .s3 {
            color: black;
                font-family: 바탕체, serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 12pt;
                vertical-align: 1pt;
            }
            p {
            color: black;
                font-family: 바탕체, serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 8pt;
            margin: 0pt;
            }
            .columnTitleText {
            color: black;
                font-family: 바탕체, serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 8pt;
                text-align: center;                
            }
            .columnPriceTitleText {
            color: black;
                font-family: 새굴림, serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 8pt;
                text-align: center;                
            }
            .columnPriceTitleSmallText {
            color: black;
                font-family: 바탕체, serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 6pt;
                text-align: center;                
            }            
			.columnPriceValueText {
            color: black;
                font-family: 바탕체, serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 8pt;
                text-align: right;
                padding-right: 2pt;
            }     	
            .columnPriceSummaryValueText {
                color: black;
                font-family: 바탕체, serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 8pt;
				text-align: right;				
				padding-right: 5pt;				
            }
			.columnStringValueText {
            color: black;
                font-family: 바탕체, serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 8pt;
                text-align: center;                
            }		
			.columnInformationValueText {
            color: black;
                font-family: 바탕체, serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 7.5pt;
                text-align: left;
                padding-right: 10pt;
                text-indent: -6pt;
            }		
			.columnPriceNumberText {
            color: black;
                font-family: 바탕체, serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 8pt;
                text-align: left;                
                padding-left: 1pt;
            }			
            .s8 {
            color: black;
                font-family: 바탕체, serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 8pt;
            }
            td{
                border-top-style: solid;
                border-top-width: 1pt;
                border-left-style: solid;
                border-left-width: 1pt;
                border-bottom-style: solid;
                border-bottom-width: 1pt;
                border-right-style: solid;
                border-right-width: 1pt;
            }
            li {
                display: block;
            }
            #l1 {
                padding-left: 0pt;
                counter-reset: c1 1;
            }
            #l1 > li > *:first-child:before {
                counter-increment: c1;
                content: counter(c1, decimal) "". "";
                color: black;
                font-family: 바탕체, serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 8pt;
            }
            #l1 > li:first-child > *:first-child:before {
                counter-increment: c1 0;
            }
            #l2 {
                padding-left: 0pt;
            }
            #l2 > li > *:first-child:before {
                content: ""- "";
                color: black;
                font-family: 바탕체, serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 8pt;
            }
            li
            {
                display: block;
            }
            #l3 {
                padding-left: 0pt;
                counter-reset: d1 2;
            }
            #l3 > li > *:first-child:before {
                counter-increment: d1;
                content: counter(d1, decimal) "". "";
                color: black;
                font-family: 바탕체, serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 8pt;
            }
            #l3 > li:first-child > *:first-child:before {
                counter-increment: d1 0;
            }
            li
            {
                display: block;
            }
            #l4 {
                padding-left: 0pt;
                counter-reset: e1 1;
            }
            #l4 > li > *:first-child:before {
                counter-increment: e1;
                content: counter(e1, decimal) "". "";
                color: black;
                font-family: 새굴림, serif;
                font-style: normal;
                font-weight: normal;
                text-decoration: none;
                font-size: 8pt;
            }
            #l4 > li:first-child > *:first-child:before {
                counter-increment: e1 0;
            }
            table,
            tbody
            {
                vertical-align: center;
                overflow: visible;
            }
        </style > ";
        }

        private static string Get대표직인()
        {
            try
            {
                var image = Convert.ToBase64String(Meta.Hospital.StampImage);
                return string.IsNullOrWhiteSpace(image) ? string.Empty
                    : $@"<img src=""data:image/jpg;base64, {image}"" style=""Opacity:0.9;"" alt=""sign"" class=""sign"" />";
            }
            catch (Exception)
            {
                return string.Empty;
            }
        }

        private static string GetQrCode(ReceiptData receipt)
        {
            var barcodeType = (BarCodeType)Meta.GetOption(Constants.FOptionKeys.BarCodeType).Value.ToInt();
            if (barcodeType != BarCodeType.UBBarCode) return string.Empty;

            if (!CallDll.MakeReceiptQrCode(receipt)) return string.Empty;

            var qrImgPath = Path.Combine(YsrPathUtil.GetYsrTempPath(), "UBBARCodeInsImg.bmp");
            var qrCode = $@"
                <div style=""position: absolute; top: 5mm; left: 175mm;"">
                    <img src=""{qrImgPath}"" style=""width: 25mm; height: 25mm;"" onerror=""this.style.display='none'"" />
                </div>
            ";

            return qrCode;
        }
    }
}
