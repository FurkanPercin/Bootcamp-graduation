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
      //bucket name'ler globally unique olduğu için başka bir aws account'unda 
      //veya region'unda bu isimde bucket açılamaz. 
      //Bu sebeple bu şekilde isimlendirmek daha mantıklı.
      blockPublicAccess: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },//gel verileri bu veri yolundan al dediklerimiz hariç herkese kapalı
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
