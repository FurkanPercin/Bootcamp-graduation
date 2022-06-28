import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_ec2,
} from 'aws-cdk-lib';
import { getConfig } from '../config';


export class VpcStack extends Stack {

  get availabilityZones(): string[] {//To restrict AZ
    return ['eu-central-1a', 'eu-central-1b']
  }

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const config = getConfig(scope);

    new aws_ec2.Vpc(this, 'GraduationVpc', {
      vpcName: `${config.account}-${config.region}-vpc-stack`,
      cidr: '10.0.0.0/16',//The range will be split across all subnets per Availability Zone.
     // natGateways: 1,
      maxAzs: 2,//Define the maximum number of AZs to use in this region.
      subnetConfiguration: [// one public one private subnet for each AZ
        {
          name: 'publicSubnet',
          subnetType: aws_ec2.SubnetType.PUBLIC,
          cidrMask: 20,
        },
/*
        {
          name: 'privateSubnet',
          subnetType: aws_ec2.SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 20,
        }
*/
      ]
    });

  }
}
