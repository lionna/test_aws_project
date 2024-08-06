namespace CdkTest
{
    public class AppSettings
    {
        public AppSettingsSection Settings { get; set; }
    }

    public class AppSettingsSection
    {
        public string GitUserName { get; set; }
        public string GitUserPassword { get; set; }
    }
}