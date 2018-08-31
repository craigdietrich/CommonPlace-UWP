using System;
using System.IO;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.ViewManagement;
using Windows.ApplicationModel.Core;
using Windows.UI;
using Windows.UI.Popups;
using System.Xml.Linq;
using Windows.ApplicationModel;
using Windows.Data.Json;
using LightBuzz.SMTP;
using Windows.ApplicationModel.Email;

namespace CommonPlace
{
    public sealed partial class MainPage : Page
    {
        public MainPage()
        {
            this.InitializeComponent();
            Loaded += MainPage_Loaded;
            // Extend the application to the top of the screen (into the title bar area)
            ApplicationViewTitleBar formattableTitleBar = ApplicationView.GetForCurrentView().TitleBar;
            formattableTitleBar.ButtonBackgroundColor = Colors.Transparent;
            CoreApplicationViewTitleBar coreTitleBar = CoreApplication.GetCurrentView().TitleBar;
            coreTitleBar.ExtendViewIntoTitleBar = true;
            // Extend the application over the task bar
            // ApplicationView.GetForCurrentView().FullScreenSystemOverlayMode = FullScreenSystemOverlayMode.Minimal;
            ApplicationView.GetForCurrentView().TryEnterFullScreenMode();
        }

        private async void MainPage_Loaded(object sender, RoutedEventArgs e)
        {
            // Load CommonPlace local HTML
            string src = "ms-appx-web:///Assets/index.html";
            //await WebView.ClearTemporaryWebDataAsync();
            this.MyWebView.Navigate(new Uri(src));

            // Alert for testing
            //MessageDialog showDialog = new MessageDialog("smtpPassword: " + smtpPassword);
            //var result = await showDialog.ShowAsync();
        }

        private void MyWebView_ContentLoading(WebView sender, WebViewContentLoadingEventArgs args)
        {

        }

        private async void MainWebView_ScriptNotify(object sender, NotifyEventArgs e)
        {
            var json = JsonValue.Parse(e.Value).GetObject();
            string method = json.GetObject().GetNamedString("method");
            switch (method)
            {
                case "email":
                    // Load Email SMTP settings
                    string XMLFilePath = Path.Combine(Package.Current.InstalledLocation.Path, "EmailConfig.xml");
                    XDocument loadedData = XDocument.Load(XMLFilePath);
                    XElement generalElement = loadedData.Element("emailSettings");
                    string smtpHost = (string)generalElement.Element("smtpHost");
                    string smtpUsername = (string)generalElement.Element("smtpUsername");
                    string smtpPassword = (string)generalElement.Element("smtpPassword");
                    string smtpSecure = (string)generalElement.Element("smtpSecure");
                    string smtpPort = (string)generalElement.Element("smtpPort");
                    // Load values from interface
                    string address = json.GetObject().GetNamedString("address");
                    string title = json.GetObject().GetNamedString("title");
                    string url = json.GetObject().GetNamedString("url");
                    // Create email
                    SmtpClient client = new SmtpClient(smtpHost, int.Parse(smtpPort), false, smtpUsername, smtpPassword);
                    EmailMessage emailMessage = new EmailMessage();
                    emailMessage.To.Add(new EmailRecipient(address));
                    //emailMessage.Bcc.Add(new EmailRecipient("someone3@anotherdomain.com"));
                    emailMessage.Subject = "[OXY CommonPlace] "+title;
                    emailMessage.Body = "<b>" + title + "</b>\r\n\r\n" + url;
                    await client.SendMailAsync(emailMessage);
                    break;
            }
        }
    }
}
