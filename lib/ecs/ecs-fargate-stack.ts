import { Stack, StackProps,CfnOutput, RemovalPolicy,Fn } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CommonStackProps } from '../common-stack-props';
import {
    aws_ecs,
    aws_s3,
    aws_iam,
    aws_ssm,
    aws_elasticloadbalancingv2,
    aws_ec2,
    aws_certificatemanager,
    aws_route53,
    aws_route53_targets,
    aws_logs
  } from 'aws-cdk-lib';
  import { getConfig } from '../config';
import { SecurityGroup } from 'aws-cdk-lib/aws-ec2';
export class ECSFargateStack extends Stack {
  constructor(scope: Construct, id: string, props?: CommonStackProps) {
    super(scope, id, props);

    const config = getConfig(scope);

    if (props?.ecrStack) {
      const vpc=aws_ec2.Vpc.fromVpcAttributes(this,'Vpc',{
        vpcId:config.vpcId,
        availabilityZones:config.availabilityZones,
        publicSubnetIds:config.publicSubnetIds,
        
    });

     // const cluster = aws_ecs.Cluster.fromClusterArn(this,'ECSCluster',Fn.importValue('ECSClusterARN'));

     const clusterSg = aws_ec2.SecurityGroup.fromSecurityGroupId(this,'ECSClusterSg',Fn.importValue('ECSClusterSgId'));


      const cluster = aws_ecs.Cluster.fromClusterAttributes(this, 'ECSCluster', {
        clusterArn: Fn.importValue('ECSClusterARN'),
        clusterName: Fn.importValue('ECSClusterName'),
        vpc,
        securityGroups: [clusterSg]//fake security grup 
      });



      const envBucket = aws_s3.Bucket.fromBucketAttributes(this, 'ServicesEnvBucket', {
        bucketArn: Fn.importValue('ServicesEnvBucketARN'),
        bucketName: Fn.importValue('ServicesEnvBucketName'),
        //If we were to import the bucket of another account or region, 
        //then we would enter the account and region as well.
        
      });


      // Granted to access s3 to pull env variables before the container stands up.
      const executionRole = new aws_iam.Role(this,'BackendFargateServiceExecutionIAMRole',{
        roleName:'BackendFargateServiceExecutionIAMRole',
        assumedBy: new aws_iam.ServicePrincipal('ecs-tasks.amazonaws.com') //Which service will use this created role
      })

      executionRole.addToPolicy(new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        resources: [ '*' ],
        actions: [
          's3:*'
        ]
      }));

      const fargateTaskDef = new aws_ecs.FargateTaskDefinition(this,'BackendFargateServiceTaskDef',{
        family:'BackendFargateServiceTaskDef',
        cpu:512,
        memoryLimitMiB:1024,
        executionRole,// Granted to access s3 to pull env variables before the container up.


      });


      const logGroup = new aws_logs.LogGroup(this,'BackendServiceContainerLogGroup',{
        logGroupName:`${config.account}-${config.region}-fargate-log-group`,
        retention:aws_logs.RetentionDays.THREE_DAYS,
        removalPolicy:RemovalPolicy.DESTROY,
      });

      fargateTaskDef.addContainer('BackendFargateServiceContainer',{
        containerName:'backend-fargate-service-container',
        image:aws_ecs.ContainerImage.fromEcrRepository(props.ecrStack,'latest'),
        memoryReservationMiB:512,
        cpu:1,
        portMappings: [
          {
            containerPort: 8080,
            protocol:aws_ecs.Protocol.TCP

          }
        ],
        logging: new aws_ecs.AwsLogDriver({
          logGroup,
          streamPrefix:'ecs'

        }),
        environment:{
          MYSQL_ROOT_PASSWORD:aws_ssm.StringParameter.fromStringParameterName(this,'DB_PASSWORD','/app/DB_PASSWORD').stringValue,
        },

        environmentFiles: [ aws_ecs.EnvironmentFile.fromBucket(envBucket, 'backend/dev.env') ]
      })

    const serviceSg= new aws_ec2.SecurityGroup(this,'BackendECSFargateSecurityGroup',{
      vpc,
      allowAllOutbound:true,
      securityGroupName:'backend-ecs-fargate-sg',
    });
    
    
     const fargateService = new aws_ecs.FargateService(this,'BackendFargateService',{
      serviceName:'backend-fargate-service',
      cluster,
      taskDefinition: fargateTaskDef,
      //deploymentController:aws_ecs.DeploymentControllerType.ECS,
      desiredCount:config.fargateServiceDesiredCount, //how many runs from the given task instantly
      securityGroups:[serviceSg],
      assignPublicIp: true, // By enabling the container to get internet on it, internet output was provided.
 
    });
   const autoScale = fargateService.autoScaleTaskCount({
      maxCapacity:config.maxAutoScaleTaskCount,//how many runs in rush hour or something
      minCapacity:config.minAutoScaleTaskCount,// how many tasks should run at night or something
    });
    




    //With autoScaleTasskCount, we determined how many tasks should run in max min.
    //But in what situations this happens, we define them. Memory util, cpu util
    autoScale.scaleOnMemoryUtilization('scaleOnMemoryUtilization',{
        targetUtilizationPercent:80,//Means to scale when the memory of the targets in the target group reaches 80 percent
    });//We look at it as a service, not as a container.
    

    autoScale.scaleOnCpuUtilization('scaleOnCPUUtilization',{
      targetUtilizationPercent:15,
     // Cooldown: When it reaches 15 percent, don't scale it immediately, wait for the entered value.
    });





    //fargateService.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const albSG=new aws_ec2.SecurityGroup(this,'albSG',{
      securityGroupName:'alb-sg',
      vpc,
      allowAllOutbound:true,//handle with the egress rule
    });

    albSG.addIngressRule(aws_ec2.Peer.anyIpv4(),aws_ec2.Port.tcp(80),'allow HTTP port to be accessible from anywhere');
    albSG.addIngressRule(aws_ec2.Peer.anyIpv4(),aws_ec2.Port.tcp(443),'allow HTTPs port to be accessible from anywhere');


    serviceSg.addIngressRule(albSG,aws_ec2.Port.tcpRange(49153,65535),'allow container port to be accessible from Application Load Balancer');//ECS port range
    //Since we do not give a host port to the container (since it is not a host), it will be randomly assigned. That's why we gave a range

    const serviceAlb = new aws_elasticloadbalancingv2.ApplicationLoadBalancer(this,'BackendALB',{
      loadBalancerName:'backend-fargate-service-alb',
      vpc,
      internetFacing:true,//load balancer publicly available or private
      
      securityGroup:albSG,
      deletionProtection: true,
    });

      
    const fargateServiceTargetGroup= new aws_elasticloadbalancingv2.ApplicationTargetGroup(this,'FargateServiceTargetGroup',{
        healthCheck:{
          enabled:true,
          path:'/',
          port:'8080',
          protocol:aws_elasticloadbalancingv2.Protocol.HTTP,
          healthyHttpCodes:'200'
        },
        port:80,
        protocol:aws_elasticloadbalancingv2.ApplicationProtocol.HTTP,//internal network'ü de https yaparsak network latency yeriz.
        //There is already https on the public internet. Decoding ssl certificate creates network latency.
        //Solving two makes more latency.
        targetGroupName:'backend-tg',
        targetType:aws_elasticloadbalancingv2.TargetType.IP,//We can direct traffic to IP, ALB, Instance and Lambda.
        // Since there is no instance in Fargate, it gives IP, we used it here.
        targets:[fargateService],
        vpc,
      });
    


      const httpListenerAction = aws_elasticloadbalancingv2.ListenerAction.redirect({
        host: '#{host}',
        path: '/#{path}',
        port: '443',
        protocol: 'HTTPS',
        permanent: true,
      });

    serviceAlb.addListener('httpListener',{
        port: 80,
        protocol: aws_elasticloadbalancingv2.ApplicationProtocol.HTTP,
        defaultAction: httpListenerAction //What to do when a request comes to port 80
       // defaultTargetGroups:[fargateServiceTargetGroup]
      });

      const certificate = aws_certificatemanager.Certificate.fromCertificateArn(this, 'BackendCertificate', 'arn:aws:acm:eu-central-1:010876915553:certificate/91713931-d6eb-42b3-90cf-253cc21397c9');

      serviceAlb.addListener('httpsListener', {
        port: 443,
        protocol: aws_elasticloadbalancingv2.ApplicationProtocol.HTTPS,
        defaultTargetGroups: [fargateServiceTargetGroup],
        certificates: [certificate]
      });

      autoScale.scaleOnRequestCount('scaleOnTargetGroup',{
        requestsPerTarget:20, //requests for each container inside the service
        targetGroup:fargateServiceTargetGroup
      });
      const hostedZone = aws_route53.HostedZone.fromHostedZoneAttributes(this, 'PercinTechHostedZone', {
        hostedZoneId: 'Z04864691RI5WK8SMB65L', //insert your hosted zone ID here.
        zoneName: 'percin.tech',
      
      });

      const target = new aws_route53_targets.LoadBalancerTarget(serviceAlb);

      new aws_route53.ARecord(this, 'ApiBackendARecord', { //ARecord ==>Alias Record
        target: aws_route53.RecordTarget.fromAlias(target),
        zone: hostedZone,
        recordName: 'api-furkan'
      });













    }

   



  }
}
