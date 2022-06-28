import { RemovalPolicy, Stack, StackProps ,CfnOutput} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    aws_ecr,
} from 'aws-cdk-lib';

export class BackendECRStack extends Stack {
    ecrRepo: aws_ecr.Repository;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.ecrRepo=new aws_ecr.Repository(this,'BackendECRRepository',{
        repositoryName:'backend',
        removalPolicy:RemovalPolicy.RETAIN,
        imageScanOnPush:false, //no need to scan vulnerabilities
        

    })
 //To show the data path of the service image in my task, that is my container, 
 //by importing it while creating the ECS fargate stack
 new CfnOutput(this,'BackendECRRepositoryARN',{
    exportName:'BackendECRRepositoryARN',
    value:this.ecrRepo.repositoryArn,
}) 

}
}
