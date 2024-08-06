namespace CdkTest
{
    public class AppSettings
    {
        public AppSettingsSection Settings { get; set; }
    }

    public class AppSettingsSection
    {
        public string EmailSubscription1 { get; set; }
        public string EmailSubscription2 { get; set; }
        public string ProductSqsQueueUrl { get; set; }
    }
}
