# detach-aws-sg-from-eni

NPX script that lists all the ENIs that are attached to a specific security group and gives the option to remove that security group attachement. 

```
npx detach-aws-sg-from-eni --id sg-04749f5c743ca2c8c
```

or 

```
npx detach-aws-sg-from-eni --name my-garbage-sg
```

Under the hood, this NPX script used the following AWS CLI v2 commands:

- List the ENIs:
```
aws ec2 describe-network-interfaces --filters Name=...,Values=...
```
- Update the security group IDs on those ENIs:
```
aws ec2 modify-network-interface-attribute --network-interface-id <ENI ID> --groups <SG ID 2> <SG ID 2>
```

Official doc at:
- https://docs.aws.amazon.com/cli/latest/reference/ec2/describe-network-interfaces.html
- https://docs.aws.amazon.com/cli/latest/reference/ec2/modify-network-interface-attribute.html

# Why creating this

When provisioning AWS Lambda in private subnets using IaC tools such as Pulumi, Terraform or CloudFormation, ENIs are created in the background. If security groups are also configured on that Lambda, those security groups are implicitly attached to those ENIs, though those ENIs are not explicitly described in the IaC scripts. When the stack is destroyed, the security groups get stuck because the IaC is not aware of the relation between the ENIs and those security groups. Manually detaching security groups from ENIs in the AWS console can be tedious and prone to human mistakes. This utility aims to fix this issue safely and transparently.

# License

BSD 3-Clause License