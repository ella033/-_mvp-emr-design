using System;
using System.IO;
using Ysr.Framework.Common.Global.LiteDb;

namespace Ysr.Framework.Business.Common.Engine.Print.Common
{
    public static class PrintHelper
    {
        public static string GetPrefixHtml(string style = "") => $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta http-equiv=""content-type"" content=""text/html;charset=UTF-8"" />
                <title></title>
                <link rel=""stylesheet"" href=""{GetCssStyle()}"" />
                {style}
            </head>
            <body>
            <div>
        ";

        public static string GetPrefixHtmlLandscape(string style = "") => $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta http-equiv=""content-type"" content=""text/html;charset=UTF-8"" />
                <title></title>
                <link rel=""stylesheet"" href=""{GetCssStyleLandscape()}"" />
                {style}
            </head>
            <body>
            <div>
        ";

        public static string GetPrefixHtmlWithoutCss() => $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta http-equiv=""content-type"" content=""text/html;charset=UTF-8"" />
                <title></title>                
            </head>
            <body>
            <div>
        ";

        public static string GetCssStyle() => Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"Engine\Print\Html\Css\Document.css");

        public static string GetCssStyleLandscape() => Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"Engine\Print\Html\Css\Landscape.css");

        public static string GetSuffixHtml() => @"</div></body></html>";

        public static string GetPageBreak() => @"<p class=""break-after""></p>";

        public static string GetChecked(bool isChecked) => isChecked ? "checked" : string.Empty;

        public static string GetChecked(bool isEmpty, bool isChecked) => isEmpty ? string.Empty : GetChecked(isChecked);

        public static string GetCheckedBetween(string val, double start, double end)
        {
            var checkedStr = string.Empty;

            try
            {
                var dVal = double.Parse(val);
                if (dVal >= start && dVal <= end) checkedStr = "checked";
            }
            catch (Exception ex)
            {
                Logger.Error(ex);
            }

            return checkedStr;
        }
    }
}
