using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices.WindowsRuntime;
using Windows.Foundation;
using Windows.Foundation.Collections;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Controls.Primitives;
using Windows.UI.Xaml.Data;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Navigation;
using Windows.UI.ViewManagement;
using Windows.ApplicationModel.Core;
using Windows.UI;
using Windows.Data.Json;
using Windows.ApplicationModel.Email;
using Windows.ApplicationModel.Background;

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
        }

        private void MyWebView_ContentLoading(WebView sender, WebViewContentLoadingEventArgs args)
        {

        }

        private async void MainWebView_ScriptNotify(object sender, NotifyEventArgs e)
        {
           // JObject json = JObject.Parse(e.Value);
            string method = "email";
            switch (method)
            {
                case "email":
                    var emailMessage = new Windows.ApplicationModel.Email.EmailMessage();
                    break;
            }
        }
    }
}
