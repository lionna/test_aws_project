using Amazon.CDK;
using Amazon.CDK.AWS.APIGateway;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Lambda;
using Constructs;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

namespace CdkTest
{
    public class CdkAuthStack : Stack
    {
        private const string LambdaCodePath = "../lambdas";

        internal CdkAuthStack(Construct scope, string id, IStackProps props = null) : base(scope, id, props)
        {
            var appSettings = GetConfig();

            var authorizerLambda = new Function(this, "basicAuthorizerFunction", new FunctionProps
            {
                Handler = "basicAuthorizer.handler",
                Runtime = Runtime.NODEJS_LATEST,
                Code = Code.FromAsset(Path.Combine(Directory.GetCurrentDirectory(), $"{LambdaCodePath}")),
                Environment = new Dictionary<string, string>
                {
                    { "GITHUB_LOGIN", appSettings.Settings.GitUserName },
                    { "GITHUB_PASSWORD", appSettings.Settings.GitUserPassword }
                },
            });

            var authorizer = new TokenAuthorizer(this, "BasicAuthorizer", new TokenAuthorizerProps
            {
                Handler = authorizerLambda,
                IdentitySource = "method.request.header.Authorization",
            });

            var api = new RestApi(this, "AuthorizationApi", new RestApiProps
            {
                RestApiName = "Auth Import Service",
                Description = "This service for auth requests.",
                DefaultMethodOptions = new MethodOptions
                {
                    AuthorizationType = AuthorizationType.CUSTOM,
                    Authorizer = authorizer,
                    MethodResponses = new[]
                    {
                        new MethodResponse
                        {
                            StatusCode = "200",
                            ResponseParameters = ResponseParameters()
                        },
                        new MethodResponse
                        {
                            StatusCode = "401",
                            ResponseParameters = ResponseParameters()
                        },
                        new MethodResponse
                        {
                            StatusCode = "403",
                            ResponseParameters = ResponseParameters()
                        }
                    }
                },
                DefaultCorsPreflightOptions = new CorsOptions
                {
                    AllowOrigins = Cors.ALL_ORIGINS,
                    AllowMethods = Cors.ALL_METHODS,
                    AllowHeaders = new[] { "Content-Type", "Authorization" }
                }
            });

            authorizerLambda.GrantInvoke(new ServicePrincipal("apigateway.amazonaws.com"));

            var resource = api.Root.AddResource("token");
            resource.AddMethod("GET", new LambdaIntegration(authorizerLambda), new MethodOptions
            {
                AuthorizationType = AuthorizationType.CUSTOM,
                Authorizer = authorizer,
                MethodResponses = new[]
                {
                    new MethodResponse
                    {
                        StatusCode = "200",
                        ResponseParameters = ResponseParameters()
                    },
                    new MethodResponse
                    {
                        StatusCode = "401",
                        ResponseParameters = ResponseParameters()
                    },
                    new MethodResponse
                    {
                        StatusCode = "403",
                        ResponseParameters = ResponseParameters()
                    }
                },
            });

            resource.AddMethod("OPTIONS", new MockIntegration(new IntegrationOptions
            {
                IntegrationResponses = new[]
                {
                    new IntegrationResponse
                    {
                        StatusCode = "200",
                        ResponseParameters = new Dictionary<string, string>
                        {
                            { "method.response.header.Access-Control-Allow-Headers", "'Content-Type,Authorization'" },
                            { "method.response.header.Access-Control-Allow-Origin", "'*'" },
                            { "method.response.header.Access-Control-Allow-Methods", "'GET,OPTIONS'" }
                        }
                    }
                }
            }), new MethodOptions
            {
                MethodResponses = new[]
                {
                    new MethodResponse
                    {
                        StatusCode = "200",
                        ResponseParameters = ResponseParameters()
                    }
                }
            });

            new CfnOutput(this, "BasicAuthorizerArn", new CfnOutputProps
            {
                Description = "Basic Authorizer Lambda",
                Value = authorizerLambda.FunctionArn,
                ExportName = "BasicAuthorizerArn"
            });
        }

        private AppSettings GetConfig()
        {
            string configFilePath = "../../appsettings.json";
            string jsonContent = File.ReadAllText(configFilePath);
            return JsonSerializer.Deserialize<AppSettings>(jsonContent);
        }

        private Dictionary<string, bool> ResponseParameters()
        {
            return new Dictionary<string, bool>
            {
                { "method.response.header.Access-Control-Allow-Headers", true },
                { "method.response.header.Access-Control-Allow-Origin", true },
                { "method.response.header.Access-Control-Allow-Methods", true }
            };
        }
    }
}

