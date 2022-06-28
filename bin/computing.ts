#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { getConfig } from '../lib/config';
import {ECSClusterStack} from '../lib/ecs'
import { CDNBucket } from '../lib/s3';
import { ECSFargateStack } from '../lib/ecs';
import { BackendECRStack } from '../lib/ecr';
import { ServicesEnvBucketStack } from '../lib/s3';

const app = new cdk.App();
const conf = getConfig(app);
const env = {
  account: conf.account,
  region: conf.region,
};


new CDNBucket(app,'CDNBucket',{env});
new ECSClusterStack(app,'ECSClusterStack',{env});
const ecrStack =new BackendECRStack(app, 'BackendECRStack', { env });
 new ECSFargateStack(app,'ECSFargateStack',{ecrStack: ecrStack.ecrRepo});
 new ServicesEnvBucketStack(app,'ServicesEnvBucketStack',{env});