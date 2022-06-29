import { Stack, StackProps,RemovalPolicy,CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    aws_s3,
} from 'aws-cdk-lib';
import { getConfig } from '../config';


//Bucket for env. variables. Pull from env file
export class ServicesEnvBucketStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const config = getConfig(scope);

    const buck=new aws_s3.Bucket(this,'ServicesEnvBucket',{
      bucketName:`${config.account}-${config.region}-services-env-bucket`,
      //Since bucket names are globally unique, a bucket with this name cannot be opened in another aws account or region. 
      //For this reason, it makes more sense to name it this way.
      blockPublicAccess: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },//Come and get the data from this data path, it is closed to everyone except those we say
      removalPolicy:RemovalPolicy.RETAIN,
    });

    new CfnOutput(this, 'ServicesEnvBucketARN', {
      exportName: 'ServicesEnvBucketARN',
      value: buck.bucketArn
    });

    new CfnOutput(this, 'ServicesEnvBucketName', {
      exportName: 'ServicesEnvBucketName',
      value: buck.bucketName
    });
  
  }
}
