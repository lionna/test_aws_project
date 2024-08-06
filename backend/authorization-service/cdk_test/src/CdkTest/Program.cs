using Amazon.CDK;
using CdkTest;

namespace Cdk
{
    sealed class Program
    {
        public static void Main(string[] args)
        {
            var app = new App();
            new CdkAuthStack(app, "CdkAuthStack", new StackProps
            {
                Env = new Environment
                {
                    Account = "851725229611",
                    Region = "us-east-1",
                }
            });
            app.Synth();
        }
    }
}