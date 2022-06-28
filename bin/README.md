### CDNBucket
cdk synth --app "npx ts-node bin/computing.ts" CDNBucket
cdk deploy --app "npx ts-node bin/computing.ts" CDNBucket
cdk diff --app "npx ts-node bin/computing.ts" CDNBucket

### VPCStack
cdk synth --app "npx ts-node bin/bitirme.ts" VpcStack
cdk deploy --app "npx ts-node bin/bitirme.ts" VpcStack
cdk diff --app "npx ts-node bin/bitirme.ts" VpcStack

### ECSClusterStack
cdk synth --app "npx ts-node bin/computing.ts" ECSClusterStack
cdk deploy --app "npx ts-node bin/computing.ts" ECSClusterStack
cdk diff --app "npx ts-node bin/computing.ts" ECSClusterStack 

### BackendECRStack
cdk synth --app "npx ts-node bin/bitirme.ts" BackendECRStack
cdk deploy --app "npx ts-node bin/bitirme.ts" BackendECRStack
cdk diff --app "npx ts-node bin/bitirme.ts" BackendECRStack

### ServicesEnvBucketStack
cdk synth --app "npx ts-node bin/computing.ts" ServicesEnvBucketStack
cdk deploy --app "npx ts-node bin/computing.ts" ServicesEnvBucketStack
cdk diff --app "npx ts-node bin/computing.ts" ServicesEnvBucketStack

### ECSFargateStack
cdk synth --app "npx ts-node bin/computing.ts" ECSFargateStack
cdk deploy --app "npx ts-node bin/computing.ts" ECSFargateStack
cdk diff --app "npx ts-node bin/computing.ts" ECSFargateStack

### CDNCloudFront
cdk synth --app "npx ts-node bin/bitirme.ts" CDNCloudFront
cdk deploy --app "npx ts-node bin/bitirme.ts" CDNCloudFront
cdk diff --app "npx ts-node bin/bitirme.ts" CDNCloudFront

cdk bootstrap aws://010876915553/us-east-1 --app "npx ts-node bin/bitirme.ts"