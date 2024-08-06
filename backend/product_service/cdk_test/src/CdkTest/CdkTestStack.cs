using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using Amazon.CDK;
using Amazon.CDK.AWS.APIGateway;
using Amazon.CDK.AWS.DynamoDB;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.Lambda.EventSources;
using Amazon.CDK.AWS.SNS;
using Amazon.CDK.AWS.SNS.Subscriptions;
using Amazon.CDK.AWS.SQS;
using CdkTest;
using Constructs;

using Function = Amazon.CDK.AWS.Lambda.Function;
using FunctionProps = Amazon.CDK.AWS.Lambda.FunctionProps;

namespace Cdk
{
    public class CdkStack : Stack
    {
        private const string BackendPath = "product_service";
        private const string LambdaPath = "lambdas";
        private readonly string[] _allowMethods = { "GET", "OPTIONS", "POST", "DELETE" };
        private readonly string[] _allowHeaders =
            { "Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token" };
        private const int BatchSize = 5;
        private const int VisibilityTimeout = 30;

        internal CdkStack(Construct scope, string id, IStackProps props = null) : base(scope, id, props)
        {
            var appSettings = GetConfig();

            // Create DynamoDB tables
            var productsTable = new Table(this, "ProductsTable", new TableProps
            {
                TableName = "products",
                PartitionKey = new Attribute { Name = "id", Type = AttributeType.STRING },
                RemovalPolicy = RemovalPolicy.DESTROY
            });

            var stocksTable = new Table(this, "StocksTable", new TableProps
            {
                TableName = "stocks",
                PartitionKey = new Attribute { Name = "product_id", Type = AttributeType.STRING },
                RemovalPolicy = RemovalPolicy.DESTROY
            });

            var locksTable = new Table(this, "LocksTable", new TableProps
            {
                TableName = "transaction_locks",
                PartitionKey = new Attribute { Name = "_id", Type = AttributeType.STRING },
                RemovalPolicy = RemovalPolicy.DESTROY
            });

            // Create Lambda functions
            var getProductsListFunction = CreateLambdaFunction("GetProductsListFunction", "getProductsList.handler",
                new Dictionary<string, string>
                {
                    { "PRODUCTS_TABLE", productsTable.TableName },
                    { "STOCKS_TABLE", stocksTable.TableName }
                });

            var getProductsByIdFunction = CreateLambdaFunction("GetProductsByIdFunction", "getProductsById.handler",
                new Dictionary<string, string>
                {
                    { "PRODUCTS_TABLE", productsTable.TableName },
                    { "STOCKS_TABLE", stocksTable.TableName }
                });

            var createProductFunction = CreateLambdaFunction("CreateProductFunction", "createProduct.handler",
                new Dictionary<string, string>
                {
                    { "PRODUCTS_TABLE", productsTable.TableName },
                    { "STOCKS_TABLE", stocksTable.TableName },
                });

            var deleteProductByIdFunction = CreateLambdaFunction("DeleteProductByIdFunction", "deleteProductById.handler",
                new Dictionary<string, string>
                {
                    { "PRODUCTS_TABLE", productsTable.TableName },
                    { "STOCKS_TABLE", stocksTable.TableName }
                });

            // Create SQS queue
            var catalogItemsQueue = new Queue(this, "CatalogItemsQueue", new QueueProps
            {
                QueueName = "catalogItemsQueue",
                VisibilityTimeout = Duration.Seconds(VisibilityTimeout)
            });

            // Create Lambda function for batch processing
            var catalogBatchProcessFunction = CreateLambdaFunction("CatalogBatchProcessFunction", "catalogBatchProcess.handler",
                new Dictionary<string, string>
                {
                    { "PRODUCTS_TABLE", productsTable.TableName },
                    { "STOCKS_TABLE", stocksTable.TableName },
                    { "QUEUE_URL", catalogItemsQueue.QueueUrl },
                });

            catalogBatchProcessFunction.AddEventSource(new SqsEventSource(catalogItemsQueue, new SqsEventSourceProps
            {
                BatchSize = BatchSize
            }));

            // Add SQS SendMessage permissions to Lambda role
            catalogBatchProcessFunction.AddToRolePolicy(new PolicyStatement(new PolicyStatementProps
            {
                Actions = ["sqs:SendMessage"],
                Resources = [catalogItemsQueue.QueueArn],
            }));

            catalogBatchProcessFunction.AddEnvironment("QUEUE_URL", catalogItemsQueue.QueueUrl);

            // Create API Gateway with CORS
            var api = new RestApi(this, "ProductApi", new RestApiProps
            {
                RestApiName = "Product Service",
                DefaultCorsPreflightOptions = new CorsOptions
                {
                    AllowOrigins = GetAllowOrigins(),
                    AllowMethods = _allowMethods,
                    AllowHeaders = _allowHeaders
                }
            });

            // Integrate Lambda functions with API Gateway
            var productsResource = api.Root.AddResource("products");
            productsResource.AddMethod("GET", new LambdaIntegration(getProductsListFunction));
            productsResource.AddMethod("POST", new LambdaIntegration(createProductFunction));

            var productByIdResource = productsResource.AddResource("{productId}");
            productByIdResource.AddMethod("GET", new LambdaIntegration(getProductsByIdFunction));
            productByIdResource.AddMethod("DELETE", new LambdaIntegration(deleteProductByIdFunction));

            // Ensure CORS preflight is only added once
            if (productsResource.DefaultCorsPreflightOptions == null)
            {
                productsResource.AddCorsPreflight(new CorsOptions
                {
                    AllowOrigins = GetAllowOrigins(),
                    AllowMethods = _allowMethods,
                    AllowHeaders = _allowHeaders
                });
            }

            // Create SNS topic and subscriptions
            var createProductTopic = new Topic(this, "CreateProductTopic", new TopicProps
            {
                TopicName = "createProductTopic"
            });

            createProductTopic.AddSubscription(new EmailSubscription(appSettings.Settings.EmailSubscription1));
            catalogBatchProcessFunction.AddEnvironment("SNS_TOPIC_ARN", createProductTopic.TopicArn);
            createProductTopic.AddSubscription(new EmailSubscription(appSettings.Settings.EmailSubscription2, new EmailSubscriptionProps
            {
                FilterPolicy = new Dictionary<string, SubscriptionFilter>
                {
                    {
                        "count",
                        SubscriptionFilter.NumericFilter(new NumericConditions
                        {
                            GreaterThan = 4
                        })
                    },
                    //{
                    //    "title",
                    //    SubscriptionFilter.StringFilter(new StringConditions
                    //    {
                    //        Denylist = ["red", "RED", "Red"]
                    //    })
                    //}
                }
            }));

            createProductTopic.GrantPublish(catalogBatchProcessFunction);

            // Grant DynamoDB permissions
            GrantDynamoDbPermissions(productsTable,stocksTable, getProductsListFunction, getProductsByIdFunction,
                createProductFunction, deleteProductByIdFunction, catalogBatchProcessFunction);

            new CfnOutput(this, "The ARN of this queue", new CfnOutputProps
            {
                Value = catalogItemsQueue.QueueArn,
                Description = "QueueArn"
            });

            new CfnOutput(this, "QueueUrl", new CfnOutputProps
            {
                Value = catalogItemsQueue.QueueUrl,
                Description = "The URL of this queue"
            });
        }

        private Function CreateLambdaFunction(string functionName, string handler, Dictionary<string, string> environmentVariables)
        {
            return new Function(this, functionName, new FunctionProps
            {
                Runtime = Runtime.NODEJS_LATEST,
                Handler = handler,
                Code = Code.FromAsset($"../../{BackendPath}/{LambdaPath}"),
                Environment = environmentVariables
            });
        }

        private static void GrantDynamoDbPermissions(Table productsTable, Table stocksTable, Function getProductsListFunction, Function getProductsByIdFunction,
            Function createProductFunction, Function deleteProductByIdFunction, Function catalogBatchProcessFunction)
        {
            productsTable.GrantReadWriteData(getProductsListFunction);
            productsTable.GrantReadWriteData(getProductsByIdFunction);
            productsTable.GrantReadWriteData(createProductFunction);
            productsTable.GrantReadWriteData(deleteProductByIdFunction);
            productsTable.GrantReadWriteData(catalogBatchProcessFunction);
            stocksTable.GrantReadWriteData(getProductsListFunction);
            stocksTable.GrantReadWriteData(getProductsByIdFunction);
            stocksTable.GrantReadWriteData(createProductFunction);
            stocksTable.GrantReadWriteData(deleteProductByIdFunction);
            stocksTable.GrantReadWriteData(catalogBatchProcessFunction);
        }

        private static AppSettings GetConfig()
        {
            string configFilePath = "../../appsettings.json";
            string jsonContent = File.ReadAllText(configFilePath);
            return JsonSerializer.Deserialize<AppSettings>(jsonContent);
        }

        private static string[] GetAllowOrigins()
        {
            //const string localUrl = "http://localhost:3000";
            //const string docsUrl = "http://localhost:3000/api-docs";
            return new[] { "*" };
        }
    }
}
