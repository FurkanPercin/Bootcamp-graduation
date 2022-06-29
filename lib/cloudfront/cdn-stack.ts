import { Stack, StackProps,CfnOutput, RemovalPolicy, Fn, aws_cloudfront_origins } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    aws_s3,
    aws_cloudfront, 
    aws_certificatemanager,
    aws_route53,
    aws_route53_targets
  } from 'aws-cdk-lib';
  import { getConfig } from '../config';
export class CDNCloudFront extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const config = getConfig(scope);

    const cdnBucket = aws_s3.Bucket.fromBucketAttributes(this,'CDNBucket',{
        bucketArn:'arn:aws:s3:::010876915553-eu-central-1-cdn-bucket',
        bucketName:'010876915553-eu-central-1-cdn-bucket',
        region:'eu-central-1',
        //CloudFront works in Virginia (since it's global). For this reason, sharing between regions is like this.
        
    });
    const certificate = aws_certificatemanager.Certificate.fromCertificateArn(this, 'CDNCertificate', 'arn:aws:acm:us-east-1:010876915553:certificate/935e521f-7777-4478-aab5-0bc0f0262058');

    const distribution = new aws_cloudfront.CloudFrontWebDistribution(this,'PatikaCDN',{
        originConfigs:[
            {
                s3OriginSource:{
                    s3BucketSource:cdnBucket,
                    originAccessIdentity:new aws_cloudfront.OriginAccessIdentity(this,'CDNBucketOriginAccessIdentity',{
                        comment:'cloudfront distribution access identity for s3 bucket'
                    }) //Since this s3 is closed to public, this s3 can only be accessed from cloudfront
                },
                behaviors:[{isDefaultBehavior:true}],//Let the config made be run by default. Just like the rule set in the load balancer
                
            },
            
        ],
        priceClass: aws_cloudfront.PriceClass.PRICE_CLASS_100,
        comment: 'CDN distribution for graduation project',
        viewerProtocolPolicy:aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        
        viewerCertificate: aws_cloudfront.ViewerCertificate.fromAcmCertificate(certificate),
        
        
    });
    
    const hostedZone = aws_route53.HostedZone.fromHostedZoneAttributes(this, 'PercinTechHostedZoneCDN', {
        hostedZoneId: 'Z04864691RI5WK8SMB65L', //insert your hosted zone ID here.
        zoneName: 'percin.tech',
      
      });



      const target = new aws_route53_targets.CloudFrontTarget(distribution);

      new aws_route53.ARecord(this, 'CDNARecord', { //ARecord ==>Alias Record
        target: aws_route53.RecordTarget.fromAlias(target),
        zone: hostedZone,
        recordName: 'patika-cdn',

      });



  }
}
