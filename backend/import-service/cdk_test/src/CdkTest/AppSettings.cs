namespace CdkTest
{
    public class AppSettings
    {
        public AppSettingsSection Settings { get; set; }
    }

    public class AppSettingsSection
    {
        public string ProductSqsQueueUrl { get; set; }
        public string ProductSqsQueueArn { get; set; }
        public string BasicAuthorizerLambdaArn { get; set; }
    }
}