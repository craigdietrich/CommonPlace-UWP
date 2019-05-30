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
using Windows.UI.Core;
using Windows.Storage;
using System.Diagnostics;

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
            // Title bar chrome
            var titleBar = ApplicationView.GetForCurrentView().TitleBar;
            titleBar.ForegroundColor = Colors.Gray;
            titleBar.BackgroundColor = Colors.Black;
            titleBar.ButtonForegroundColor = Colors.Gray;
            titleBar.ButtonBackgroundColor = Colors.Black;
            titleBar.ButtonHoverForegroundColor = Colors.White;
            titleBar.ButtonHoverBackgroundColor = Colors.Black;
            titleBar.ButtonPressedForegroundColor = Colors.White;
            titleBar.ButtonPressedBackgroundColor = Colors.Black;
            titleBar.InactiveForegroundColor = Colors.Gray;
            titleBar.InactiveBackgroundColor = Colors.Black;
            titleBar.ButtonInactiveForegroundColor = Colors.Gray;
            titleBar.ButtonInactiveBackgroundColor = Colors.Black;
        }
    
        private void MainPage_Loaded(object sender, RoutedEventArgs e)
        {
            string src = "ms-appx-web:///Assets/index.html";
            this.MyWebView.Navigate(new Uri(src));
        }

        private async void MyWebView_ContendLoaded(WebView sender, WebViewDOMContentLoadedEventArgs args)
        {
            string XMLFilePath = Path.Combine(Package.Current.InstalledLocation.Path, "AppConfig.xml");
            XDocument loadedData = XDocument.Load(XMLFilePath);
            XElement generalElement = loadedData.Element("appSettings");
            string authors = (string)generalElement.Element("authors");
            string short_description = (string)generalElement.Element("shortDescription");
            string long_description = (string)generalElement.Element("longDescription");
            var version_num = GetAppVersion();
            string[] js_args = { version_num, authors, short_description, long_description };
            string returnValue = await this.MyWebView.InvokeScriptAsync("set_app_vars", js_args);
        }

        private void emailConfigCancelButton_Click(object sender, RoutedEventArgs e)
        {
            this.emailConfigView.Visibility = Visibility.Collapsed;
        }

        private void emailConfigSaveButton_Click(object sender, RoutedEventArgs e)
        {
            string errorMsg = String.Empty;
            var smtpSecureBox = (ComboBox)this.smtp_secure;
            var smtpSecureItem = (ComboBoxItem)smtpSecureBox.SelectedItem;
            string smtpSecure = smtpSecureItem.Content.ToString();
            string smtpPort = this.smtp_port.Text;
            if (String.IsNullOrWhiteSpace(smtpPort)) errorMsg = "SMTP Port is a required field.";
            string smtpPassword = this.smtp_password.Password;
            if (String.IsNullOrWhiteSpace(smtpPassword)) errorMsg = "Password is a required field.";
            string smtpUsername = this.smtp_username.Text;
            if (String.IsNullOrWhiteSpace(smtpUsername)) errorMsg = "Username is a required field.";
            string smtpHost = this.smtp_host.Text;
            if (String.IsNullOrWhiteSpace(smtpHost)) errorMsg = "SMTP Host is a required field.";
            Debug.WriteLine("smtpHost: " + smtpHost + " smtpUsername: "+ smtpUsername + " smtpPassword: "+ smtpPassword + " smtpPort: "+ smtpPort + " smtpSecure: "+ smtpSecure);
            if (!String.IsNullOrEmpty(errorMsg))
            {
                smtp_validation_error.Text = errorMsg;
                smtp_validation_error.Visibility = Visibility.Visible;
                return;
            }
            // TODO: save to app storage
            smtp_validation_error.Text = String.Empty;
            this.emailConfigView.Visibility = Visibility.Collapsed;
        }

        private async void MainWebView_ScriptNotify(object sender, NotifyEventArgs e)
        {
            if (string.IsNullOrEmpty(e.Value)) return;
            var json = JsonValue.Parse(e.Value).GetObject();
            string method = json.GetObject().GetNamedString("method");
            switch (method)
            {
                case "restart":
                    this.MyWebView.Refresh();
                    break;
                case "coming_soon":
                    MessageDialog showComingSoonDialog = new MessageDialog("CommonPlace feature coming soon!");
                    var comingSoonResult = await showComingSoonDialog.ShowAsync();
                    break;
                case "toggle_fullscreen":
                    ToggleFullScreenMode();
                    break;
                case "show_email_config":
                    this.emailConfigView.Visibility = Visibility.Visible;
                    break;
                case "email":
                    string smtpHost, smtpUsername, smtpPassword, smtpSecure, smtpPort;
                    smtpHost = smtpUsername = smtpPassword = smtpSecure = smtpPort = String.Empty;
                    try
                    {
                        // See if SMTP settings have been set in local data
                        Debug.WriteLine("Trying local folder");
                        StorageFile file = await Windows.Storage.ApplicationData.Current.LocalFolder.GetFileAsync("EmailConfig.xml");
                    }
                    catch
                    {
                        MessageDialog showCantEmailDialog = new MessageDialog("Unfotunately, email can't be sent at this time because email SMTP settings haven't been setup.");
                        var cantEmailResult = await showCantEmailDialog.ShowAsync();
                        return;
                    }
                    Debug.WriteLine("smtpHost: "+smtpHost+" smtpUsername: "+smtpUsername+" smtpPasswrod: "+smtpPassword+" smtpPort: "+smtpPort+" smtpSecure: "+smtpSecure);
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
                    emailMessage.Body = title + "\r\n\r\n" + url;
                    await client.SendMailAsync(emailMessage);
                    break;
            }
        }

        public static string GetAppVersion()
        {
            Package package = Package.Current;
            PackageId packageId = package.Id;
            PackageVersion version = packageId.Version;
            return string.Format("{0}.{1}.{2}", version.Major, version.Minor, version.Build, version.Revision);
        }

        private void ToggleFullScreenMode()
        {
            var view = ApplicationView.GetForCurrentView();
            var coreTitleBar = CoreApplication.GetCurrentView().TitleBar;
            if (view.IsFullScreenMode)
            {
                view.ExitFullScreenMode();
                coreTitleBar.ExtendViewIntoTitleBar = false;
            }
            else
            {
                view.TryEnterFullScreenMode();
                coreTitleBar.ExtendViewIntoTitleBar = true;
            }
        }
    }
}
