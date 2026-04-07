using System;
using System.Windows.Automation;
using System.Runtime.InteropServices;
using System.Collections.Generic;

namespace UiaBridge
{
    class Program
    {
        static void Main(string[] args)
        {
            try
            {
                if (args.Length > 0 && args[0] == "--inject")
                {
                    InjectText(args[1]);
                    return;
                }

                ReadContext();
            }
            catch (Exception ex)
            {
                Console.WriteLine("{{\"error\": \"{0}\"}}", ex.Message.Replace("\"", "\\\""));
            }
        }

        static void ReadContext()
        {
            var focused = AutomationElement.FocusedElement;
            if (focused == null) return;

            string text = "";
            double caretX = 0, caretY = 0, caretH = 0;

            // Try ValuePattern
            if (focused.TryGetCurrentPattern(ValuePattern.Pattern, out object valPattern))
            {
                text = ((ValuePattern)valPattern).Current.Value;
            }

            // Try TextPattern for cursor position
            if (focused.TryGetCurrentPattern(TextPattern.Pattern, out object textPattern))
            {
                var tp = (TextPattern)textPattern;
                var selection = tp.GetSelection();
                if (selection.Length > 0)
                {
                    var rects = selection[0].GetBoundingRectangles();
                    if (rects.Length > 0)
                    {
                        caretX = rects[0].X;
                        caretY = rects[0].Y;
                        caretH = rects[0].Height;
                    }

                    if (string.IsNullOrEmpty(text))
                    {
                        text = tp.DocumentRange.GetText(-1);
                    }
                }
            }

            // Manual JSON formatting for compatibility
            Console.WriteLine("{{\"fullText\": \"{0}\", \"processId\": {1}, \"name\": \"{2}\", \"controlType\": \"{3}\", \"caret\": {{\"x\": {4}, \"y\": {5}, \"height\": {6}}}}}",
                EscapeJson(text),
                focused.Current.ProcessId,
                EscapeJson(focused.Current.Name),
                EscapeJson(focused.Current.ControlType.ProgrammaticName),
                caretX.ToString().Replace(",", "."),
                caretY.ToString().Replace(",", "."),
                caretH.ToString().Replace(",", ".")
            );
        }

        static string EscapeJson(string s)
        {
            if (string.IsNullOrEmpty(s)) return "";
            return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", "\\n").Replace("\r", "\\r");
        }

        static void InjectText(string text)
        {
            var focused = AutomationElement.FocusedElement;
            if (focused != null && focused.TryGetCurrentPattern(ValuePattern.Pattern, out object valPattern))
            {
                var vp = (ValuePattern)valPattern;
                vp.SetValue(text); // Injection should ideally be smart merging, but keeping it simple for now
            }
        }
    }
}
