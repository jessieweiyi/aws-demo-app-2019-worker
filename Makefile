PROJECT := aws-demo-app-2019-worker
REGISTRY := 897785104057.dkr.ecr.ap-southeast-2.amazonaws.com
AWS_REGION := ap-southeast-2
ENVIRONMENT := dev

VERSION := $(shell whoami)
APP_IMAGE := $(PROJECT):$(VERSION)
IMAGE_URL := $(REGISTRY)/$(PROJECT):$(VERSION)
SERVICE_NAME := $(PROJECT)-$(ENVIRONMENT)

GITHUB_OWNER:=jessieweiyi
GITHUB_REPO:=aws-demo-app-2019-worker

FOLDER_CF_TEMPLATES := $(PWD)/infra
FILE_CF_TEMPLATE_ENV_WORKER := aws-env-worker.yml
FILE_CF_TEMPLATE_PIPELINE_WORKER := aws-pipeline-worker.yml
STACK_NAME_ENV_WORKER := aws-demo-app-2019-worker-$(ENVIRONMENT)
STACK_NAME_PIPELINE_WORKER := aws-demo-app-2019-worker-pipeline

CLUSTER_STACK_NAME := aws-demo-app-2019-cluster-$(ENVIRONMENT)
NETWORK_STACK_NAME := aws-demo-app-2019-network-$(ENVIRONMENT)
AWS_SERVICES_STACK_NAME := aws-demo-app-2019-aws-services-$(ENVIRONMENT)

PROD_SERVICE_NAME:=$(PROJECT)-prod
DEV_SERVICE_NAME:=$(PROJECT)-dev

.PHONY: build
build:
	@echo Building the Docker image... 
	docker build -t $(APP_IMAGE) .

.PHONY: login-ecr
login-ecr:
	@echo Logging in to Amazon ECR...
	 `aws ecr get-login --region $(AWS_REGION) --no-include-email`

.PHONY: publish
publish: 
	@echo Tagging and Pushing the Docker images...
	docker tag $(APP_IMAGE) $(IMAGE_URL)
	docker push $(IMAGE_URL)
	docker tag $(APP_IMAGE) $(REGISTRY)/$(PROJECT):latest
	docker push $(REGISTRY)/$(PROJECT):latest

.PHONY: write-image-definitions
write-image-definitions:
	@echo Writing image definitions file...
	printf '[{"name":"%s","imageUri":"%s"}]' $(SERVICE_NAME) $(IMAGE_URL) > imagedefinitions.json

PROVISION_PARAMETERS_STACK_ENV := --stack-name $(STACK_NAME_ENV_WORKER) \
		--template-body file://$(FOLDER_CF_TEMPLATES)/$(FILE_CF_TEMPLATE_ENV_WORKER) \
		--parameters ParameterKey=Environment,ParameterValue=$(ENVIRONMENT) \
			ParameterKey=NetworkStackName,ParameterValue=$(NETWORK_STACK_NAME) \
			ParameterKey=ClusterStackName,ParameterValue=$(CLUSTER_STACK_NAME) \
			ParameterKey=AWSServicesStackName,ParameterValue=$(AWS_SERVICES_STACK_NAME) \
			ParameterKey=ServiceName,ParameterValue=$(SERVICE_NAME) \
			ParameterKey=ImageURL,ParameterValue=$(IMAGE_URL) \
		--capabilities CAPABILITY_IAM \
		--region $(AWS_REGION)

.PHONY: create-env-worker
create-env-worker: 
	aws cloudformation create-stack $(PROVISION_PARAMETERS_STACK_ENV)
	aws cloudformation wait stack-create-complete --stack-name $(STACK_NAME_ENV_WORKER)

.PHONY: update-env-worker
update-env-worker: 
	aws cloudformation update-stack $(PROVISION_PARAMETERS_STACK_ENV)
	aws cloudformation wait stack-update-complete --stack-name $(STACK_NAME_ENV_WORKER)

PROVISION_PARAMETERS_STACK_PIPELINE := --stack-name $(STACK_NAME_PIPELINE_WORKER) \
		--template-body file://$(FOLDER_CF_TEMPLATES)/$(FILE_CF_TEMPLATE_PIPELINE_WORKER) \
		--parameters ParameterKey=ECRRepositoryName,ParameterValue=$(PROJECT) \
		--capabilities CAPABILITY_IAM \
		--region $(AWS_REGION)

.PHONY: create-pipeline-worker
create-pipeline-worker:
	aws cloudformation create-stack $(PROVISION_PARAMETERS_STACK_PIPELINE)
	aws cloudformation wait stack-create-complete --stack-name $(STACK_NAME_PIPELINE_WORKER)

.PHONY: update-pipeline-worker
update-pipeline-worker: 
	aws cloudformation update-stack $(PROVISION_PARAMETERS_STACK_PIPELINE)
	aws cloudformation wait update-create-complete --stack-name $(STACK_NAME_PIPELINE_WORKER)