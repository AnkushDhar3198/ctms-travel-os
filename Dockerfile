# =========================================================================
# CTMS TravelOS — Multi-Stage Production Dockerfile for Render Deployment
# =========================================================================

# ----------------------------------------
# Stage 1: Build Angular Frontend SPA
# ----------------------------------------
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build -- --configuration production

# ----------------------------------------
# Stage 2: Build Spring Boot Backend JAR
# ----------------------------------------
FROM maven:3.9-eclipse-temurin-17-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/pom.xml ./
RUN mvn dependency:go-offline -B

COPY backend/src ./src

# Embed compiled Angular SPA directly into Spring Boot static web assets
COPY --from=frontend-builder /app/frontend/dist/frontend/ ./src/main/resources/static/

RUN mvn clean package -DskipTests -B

# ----------------------------------------
# Stage 3: Lightweight Production JRE
# ----------------------------------------
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create persistent storage folder for H2 database
RUN mkdir -p /app/data

COPY --from=backend-builder /app/backend/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
