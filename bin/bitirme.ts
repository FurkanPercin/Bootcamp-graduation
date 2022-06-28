#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc';
import { getConfig } from '../lib/config';
import {CDNCloudFront} from '../lib/cloudfront'
const app = new cdk.App();
const conf = getConfig(app);
const env = {
  account: conf.account,
  region: conf.region,
};

new VpcStack(app, 'VpcStack', { env });
new CDNCloudFront(app, 'CDNCloudFront', { 
  env:{
    account:env.account,
    region:'us-east-1'
  }
 });
