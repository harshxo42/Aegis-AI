# Aegis AI - AWS Enterprise Architecture Deployment

This document outlines the high-availability, scalable AWS architecture designed for Aegis AI to support enterprise-scale emergency services.

## Architecture Overview

```mermaid
architecture-beta
    group aws(cloud)[AWS Cloud]

    service route53(internet)[Amazon Route 53] in aws
    service waf(firewall)[AWS WAF] in aws
    service alb(server)[Application Load Balancer] in aws

    group vpc(cloud)[Virtual Private Cloud] in aws
    
    group public_subnet(server)[Public Subnets] in vpc
    service nat(server)[NAT Gateway] in public_subnet

    group private_app(server)[Private Subnets - Application] in vpc
    service ecs_frontend(server)[ECS Fargate - React] in private_app
    service ecs_backend(server)[ECS Fargate - FastAPI] in private_app
    service ecs_worker(server)[ECS Fargate - Celery] in private_app

    group private_data(server)[Private Subnets - Data] in vpc
    service rds(database)[Amazon RDS PostgreSQL Multi-AZ] in private_data
    service elasticache(database)[Amazon ElastiCache Redis] in private_data

    route53:R --> waf:L
    waf:R --> alb:L
    alb:R --> ecs_frontend:L
    alb:R --> ecs_backend:L
    
    ecs_frontend:B --> nat:T
    ecs_backend:B --> nat:T
    ecs_worker:B --> nat:T

    ecs_backend:R --> rds:L
    ecs_backend:R --> elasticache:L
    ecs_worker:L --> rds:R
    ecs_worker:L --> elasticache:R
```

## Core Components

### 1. Networking & Edge
- **Amazon Route 53**: DNS routing.
- **AWS WAF**: Web Application Firewall to protect against DDoS and SQL injections.
- **Application Load Balancer (ALB)**: Routes traffic to the frontend and backend services.
- **VPC**: Isolated network with Public (NAT/ALB) and Private (App/Data) subnets.

### 2. Compute Layer (ECS Fargate)
- **Frontend Container**: Nginx serving the React + Redux Toolkit SPA.
- **Backend API**: FastAPI application handling REST API requests and WebSockets.
- **Background Workers**: Celery workers processing async tasks (e.g., ML inference offloading, report generation).
- **Auto-Scaling**: ECS services configured with target tracking scaling policies based on CPU and Memory.

### 3. Data Layer
- **Amazon RDS (PostgreSQL)**: Multi-AZ deployment for high availability, automated backups, and read replicas if read traffic surges.
- **Amazon ElastiCache (Redis)**: Used for WebSocket Pub/Sub across Uvicorn workers and Celery message brokering.

### 4. Storage & AI
- **Amazon S3**: Stores medical report PDFs and images for analysis.
- **Amazon SageMaker / Bedrock**: For hosting or integrating advanced ML models and Agentic workflows securely within the AWS ecosystem.

### 5. Observability & CI/CD
- **Amazon CloudWatch**: Centralized structured JSON logs, alarms, and dashboards (integrates with Loguru & Prometheus metrics).
- **GitHub Actions to ECR**: CI/CD pipeline pushes built images to Amazon ECR, which triggers ECS rolling updates.
