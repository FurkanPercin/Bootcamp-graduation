import { Stack, StackProps,CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    aws_s3,
   
  } from 'aws-cdk-lib';
  import { getConfig } from '../config';
export class CDNBucket extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const config = getConfig(scope);

    //'Resource physical ID'
    const bucket = new aws_s3.Bucket(this,'CDNBucket',{
        bucketName:`${config.account}-${config.region}-cdn-bucket`,
      //Since bucket names are globally unique, a bucket with this name cannot be opened in another aws account or region. 
      //For this reason, it makes more sense to name it this way.
        blockPublicAccess: {
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
          },
          removalPolicy:RemovalPolicy.RETAIN,

          
    });
    
    new CfnOutput(this, 'CDNBucketARN', {
        exportName: 'CDNBucketARN',
        value: bucket.bucketArn
      });
  
      new CfnOutput(this, 'CDNBucketName', {
        exportName: 'CDNBucketName',
        value: bucket.bucketName
      });






  }
}
