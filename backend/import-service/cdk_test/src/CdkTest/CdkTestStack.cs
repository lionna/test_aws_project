using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using Amazon.CDK;
using Amazon.CDK.AWS.APIGateway;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.S3;
using Amazon.CDK.AWS.S3.Notifications;
using Amazon.CDK.AWS.SQS;
using Constructs;
using Function = Amazon.CDK.AWS.Lambda.Function;
using FunctionProps = Amazon.CDK.AWS.Lambda.FunctionProps;

namespace CdkTest
{
    public class CdkStack : Stack
    {
        private const string BucketName = "csv-file-import-bucket";
        private const string UploadedFolder = "uploaded/";
        private const string LambdaCodePath = "../lambdas";
        private const string ApiName = "Import Service";
        private const string ImportApiResource = "import";
        private readonly string[] _allowMethods = { "GET", "PUT", "OPTIONS", "POST" };
        private readonly string[] _allowHeaders =
            { "Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token" };

        internal CdkStack(Construct scope, string id, IStackProps props = null) : base(scope, id, props)
        {
            var appSettings = GetConfig();

            // Create S3 bucket
            var bucket = new Bucket(this, "ImportBucket", new BucketProps
            {
                BucketName = BucketName,
                RemovalPolicy = RemovalPolicy.DESTROY,
                AutoDeleteObjects = true,
                Cors = new[]
                {
                    new CorsRule
                    {
                        AllowedOrigins = GetAllowOrigins(),
                        AllowedMethods = new[]
                        {
                            HttpMethods.GET, HttpMethods.PUT, HttpMethods.POST, HttpMethods.DELETE, HttpMethods.HEAD
                        },
                        AllowedHeaders = _allowHeaders
                    }
                }
            });

            var importProductsFile = new Function(this, "ImportProductsFileFunction", new FunctionProps
            {
                Handler = "importProductsFile.handler",
                Runtime = Runtime.NODEJS_LATEST,
                Code = Code.FromAsset(Path.Combine(Directory.GetCurrentDirectory(), $"{LambdaCodePath}")),
                Environment = new Dictionary<string, string>
                {
                    { "BUCKET_NAME", BucketName }
                }
            });

            var importFileParser = new Function(this, "ImportFileParserFunction", new FunctionProps
            {
                Handler = "importFileParser.handler",
                Runtime = Runtime.NODEJS_LATEST,
                Code = Code.FromAsset(Path.Combine(Directory.GetCurrentDirectory(), $"{LambdaCodePath}")),
                Environment = new Dictionary<string, string>
                {
                    { "BUCKET_NAME", BucketName },
                    { "QUEUE_URL", appSettings?.Settings?.ProductSqsQueueUrl }
                }
            });

            var basicAuthorizer = Function.FromFunctionAttributes(this, "BasicAuthorizerFunction", new FunctionAttributes
            {
                FunctionArn = appSettings.Settings.BasicAuthorizerLambdaArn,
                SameEnvironment = true
            });

            bucket.GrantReadWrite(importProductsFile);
            bucket.GrantReadWrite(importFileParser);
            bucket.GrantDelete(importFileParser);

            bucket.AddEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(importFileParser), new NotificationKeyFilter
            {
                Prefix = UploadedFolder
            });

            var api = new RestApi(this, "ImportApi", new RestApiProps
            {
                RestApiName = ApiName,
                DefaultCorsPreflightOptions = new CorsOptions
                {
                    AllowOrigins = GetAllowOrigins(),
                    AllowMethods = _allowMethods,
                    AllowHeaders = _allowHeaders
                }
            });

            api.AddGatewayResponse("ImportServiceDefault4xx", new GatewayResponseProps
            {
                Type = ResponseType_.DEFAULT_4XX,
                ResponseHeaders = new Dictionary<string, string>
                {
                    { "Access-Control-Allow-Headers", "'Content-Type,Authorization'" },
                    { "Access-Control-Allow-Origin", "'*'" },
                    { "Access-Control-Allow-Methods", "'*'" }
                }
            });


            var importResource = api.Root.AddResource(ImportApiResource);

            //var authorizer = new RequestAuthorizer(this, "RequestAuthorizer", new RequestAuthorizerProps
            //{
            //    Handler = basicAuthorizer,
            //    IdentitySources = new[] { IdentitySource.Header("Authorization") },
            //    ResultsCacheTtl = Duration.Seconds(0)
            //});
            var authorizer = new TokenAuthorizer(this, "BasicAuthorizer", new TokenAuthorizerProps
            {
                Handler = basicAuthorizer,
                IdentitySource = "method.request.header.Authorization",
                ResultsCacheTtl = Duration.Seconds(0)
            });

            importResource.AddMethod("GET", new LambdaIntegration(importProductsFile), new MethodOptions
            {
                RequestParameters = new Dictionary<string, bool>
                {
                    { "method.request.querystring.name", true }
                },
                RequestValidatorOptions = new RequestValidatorOptions
                {
                    ValidateRequestParameters = true
                },
                Authorizer = authorizer,
                AuthorizationType = AuthorizationType.CUSTOM
            });

            // Ensure CORS preflight is only added once
            if (importResource.DefaultCorsPreflightOptions == null)
            {
                importResource.AddCorsPreflight(new CorsOptions
                {
                    AllowOrigins = GetAllowOrigins(),
                    AllowMethods = _allowMethods,
                    AllowHeaders = _allowHeaders
                });
            }

            // Import existing SQS queue by ARN
            var productQueue = Queue.FromQueueArn(this, "ProductQueue", appSettings?.Settings?.ProductSqsQueueArn??"");
            productQueue.GrantSendMessages(importFileParser);

            // Outputs
            new CfnOutput(this, "ImportApiUrl", new CfnOutputProps
            {
                Value = api.Url,
                Description = "The URL of the import API"
            });

            new CfnOutput(this, "BucketName", new CfnOutputProps
            {
                Value = bucket.BucketName,
                Description = "The name of the S3 bucket"
            });
        }

        private AppSettings GetConfig()
        {
            string configFilePath = "../../appsettings.json";
            string jsonContent = File.ReadAllText(configFilePath);
            return JsonSerializer.Deserialize<AppSettings>(jsonContent);
        }

        private static string[] GetAllowOrigins()
        {
            return Cors.ALL_ORIGINS;
            //const string localUrl = "http://localhost:3000";
            //const string docsUrl = "http://localhost:3000/api-docs";
            //return new[]
            //{
            //    //localUrl, docsUrl, $"https://{}"
            //    "*"
            //};
        }
    }
}