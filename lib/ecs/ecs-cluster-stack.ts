import { Stack, StackProps,CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    aws_ecs,
    aws_ec2
  } from 'aws-cdk-lib';
  import { getConfig } from '../config';
export class ECSClusterStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const config = getConfig(scope);

    const vpc=aws_ec2.Vpc.fromVpcAttributes(this,'Vpc',{
        vpcId:config.vpcId,
        availabilityZones:config.availabilityZones,
        publicSubnetIds:config.publicSubnetIds,
        
    });

    const cluster = new aws_ecs.Cluster(this,'ECSCluster',{
        clusterName:'graduation-cluster',
        vpc,
    });


    //we will only ensure that the load balancer can access the applications in this cluster on port 80 and 443. 
    //Because load balancer is on the same vpc
    const clusterSg = new aws_ec2.SecurityGroup(this, 'ECSClusterSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      securityGroupName: 'ecs-cluster-sg'
    });

    clusterSg.addIngressRule(aws_ec2.Peer.anyIpv4(), aws_ec2.Port.tcp(80), 'allow HTTP port to be accessible from anywhere');
    clusterSg.addIngressRule(aws_ec2.Peer.anyIpv4(), aws_ec2.Port.tcp(443), 'allow HTTPS port to be accessible from anywhere');

    cluster.connections.addSecurityGroup();

    new CfnOutput(this, 'ECSClusterARN', {
      exportName: 'ECSClusterARN',
      value: cluster.clusterArn
    });

    new CfnOutput(this, 'ECSClusterName', {
      exportName: 'ECSClusterName',
      value: cluster.clusterName
    });
    new CfnOutput(this, 'ECSClusterSgId', {
      exportName: 'ECSClusterSgId',
      value: clusterSg.securityGroupId
    });
   



  }
}
