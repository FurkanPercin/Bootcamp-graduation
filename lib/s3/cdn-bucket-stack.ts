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
        //bucket name'ler globally unique olduğu için başka bir aws account'unda 
        //veya region'unda bu isimde bucket açılamaz. 
        //Bu sebeple bu şekilde isimlendirmek daha mantıklı.
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
